import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

export type FeatureType = "boards" | "members" | "columns" | "cards" | "labels";

export interface FeatureLimit {
  id: string;
  organizationId: string;
  maxBoards: number;
  maxMembers: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  feature: FeatureType;
}

/**
 * Obtém os limites da organização
 */
export async function getFeatureLimits(
  organizationId: string
): Promise<FeatureLimit | null> {
  try {
    // Busca a subscription da organização
    const subscription = await db.subscription.findUnique({
      where: { organizationId },
    });

    const plan = subscription?.plan || "FREE";
    const planLimits = PLANS[plan as keyof typeof PLANS].limits;

    const limits = await db.featureLimit.findUnique({
      where: { organizationId },
    });

    if (!limits) {
      // Criar limites baseados no plano atual
      return await db.featureLimit.create({
        data: {
          organizationId,
          maxBoards: planLimits.boards,
          maxMembers: planLimits.members,
        },
      });
    }

    // Atualiza os limites se o plano mudou
    if (
      limits.maxBoards !== planLimits.boards ||
      limits.maxMembers !== planLimits.members
    ) {
      return await db.featureLimit.update({
        where: { organizationId },
        data: {
          maxBoards: planLimits.boards,
          maxMembers: planLimits.members,
        },
      });
    }

    return limits;
  } catch (error) {
    console.error("Erro ao obter limites:", error);
    return null;
  }
}

/**
 * Verifica se uma ação está dentro dos limites
 */
export async function checkFeatureLimit(
  organizationId: string,
  feature: FeatureType
): Promise<LimitCheckResult> {
  const limits = await getFeatureLimits(organizationId);
  if (!limits) {
    return { allowed: false, current: 0, max: 0, feature };
  }

  // Busca a subscription para obter os limites do plano
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
  });
  const plan = subscription?.plan || "FREE";
  const planLimits = PLANS[plan as keyof typeof PLANS].limits;

  let current = 0;
  let max = 0;

  switch (feature) {
    case "boards":
      current = await db.board.count({ where: { organizationId } });
      max = planLimits.boards;
      break;
    case "members":
      current = await db.membership.count({ where: { organizationId } });
      max = planLimits.members;
      break;
    case "columns":
      // Para colunas, verificamos o total de colunas da organização
      const boards = await db.board.findMany({
        where: { organizationId },
        include: { columns: true },
      });
      current = boards.reduce((sum, board) => sum + board.columns.length, 0);
      max = planLimits.columns;
      break;
    case "cards":
      // Para cards, verificamos o total de cards da organização
      const boardsWithCards = await db.board.findMany({
        where: { organizationId },
        include: {
          columns: {
            include: { cards: true },
          },
        },
      });
      current = boardsWithCards.reduce(
        (sum, board) =>
          sum +
          board.columns.reduce((colSum, col) => colSum + col.cards.length, 0),
        0
      );
      max = planLimits.cards;
      break;
    case "labels":
      // Para labels, verificamos o total de labels da organização
      const boardsWithLabels = await db.board.findMany({
        where: { organizationId },
        include: { labels: true },
      });
      current = boardsWithLabels.reduce(
        (sum, board) => sum + board.labels.length,
        0
      );
      max = planLimits.labels;
      break;
  }

  // Se o limite é ilimitado (-1), sempre permite
  if (max === -1) {
    return {
      allowed: true,
      current,
      max,
      feature,
    };
  }

  // Para boards, verifica se já atingiu o limite
  // Se current >= max, não permite criar mais
  const allowed = current < max;

  return {
    allowed,
    current,
    max,
    feature,
  };
}

/**
 * Verifica e mostra toast de erro se o limite foi atingido
 */
export async function enforceFeatureLimit(
  organizationId: string,
  feature: FeatureType
): Promise<{ allowed: boolean; error?: string }> {
  const result = await checkFeatureLimit(organizationId, feature);

  if (!result.allowed) {
    const featureNames = {
      boards: "boards",
      members: "membros",
      columns: "colunas",
      cards: "cards",
      labels: "labels",
    };

    // Se o limite é ilimitado (-1), sempre permite
    if (result.max === -1) {
      return { allowed: true };
    }

    return {
      allowed: false,
      error: `Limite atingido! Você atingiu o máximo de ${result.max} ${featureNames[feature]} no plano Free. Faça upgrade para o plano Pro para criar mais.`,
    };
  }

  return { allowed: true };
}

/**
 * Obtém estatísticas de uso da organização
 */
export async function getOrganizationUsage(organizationId: string) {
  const limits = await getFeatureLimits(organizationId);
  if (!limits) return null;

  // Busca a subscription para obter os limites do plano
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
  });
  const plan = subscription?.plan || "FREE";
  const planLimits = PLANS[plan as keyof typeof PLANS].limits;

  const boards = await db.board.count({ where: { organizationId } });
  const members = await db.membership.count({ where: { organizationId } });

  const boardsWithDetails = await db.board.findMany({
    where: { organizationId },
    include: {
      columns: {
        include: { cards: true },
      },
      labels: true,
    },
  });

  const totalColumns = boardsWithDetails.reduce(
    (sum, board) => sum + board.columns.length,
    0
  );
  const totalCards = boardsWithDetails.reduce(
    (sum, board) =>
      sum + board.columns.reduce((colSum, col) => colSum + col.cards.length, 0),
    0
  );
  const totalLabels = boardsWithDetails.reduce(
    (sum, board) => sum + board.labels.length,
    0
  );

  return {
    boards: { current: boards, max: planLimits.boards },
    members: { current: members, max: planLimits.members },
    columns: { current: totalColumns, max: planLimits.columns },
    cards: { current: totalCards, max: planLimits.cards },
    labels: { current: totalLabels, max: planLimits.labels },
  };
}

/**
 * Verifica se a organização está próxima dos limites
 */
export async function isNearLimit(
  organizationId: string,
  feature: FeatureType
): Promise<boolean> {
  const result = await checkFeatureLimit(organizationId, feature);
  const usagePercentage = (result.current / result.max) * 100;

  // Considera "próximo do limite" quando está acima de 80%
  return usagePercentage >= 80;
}
