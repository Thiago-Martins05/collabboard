import { db } from "@/lib/db";
import { toast } from "sonner";
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

  let current = 0;
  let max = 0;

  switch (feature) {
    case "boards":
      current = await db.board.count({ where: { organizationId } });
      max = limits.maxBoards;
      break;
    case "members":
      current = await db.membership.count({ where: { organizationId } });
      max = limits.maxMembers;
      break;
    case "columns":
      // Para colunas, verificamos por board (assumindo limite de 10 colunas por board)
      const boards = await db.board.findMany({
        where: { organizationId },
        include: { columns: true },
      });
      current = boards.reduce((sum, board) => sum + board.columns.length, 0);
      max = boards.length * 10; // 10 colunas por board
      break;
    case "cards":
      // Para cards, verificamos por board (assumindo limite de 100 cards por board)
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
      max = boardsWithCards.length * 100; // 100 cards por board
      break;
    case "labels":
      // Para labels, verificamos por board (assumindo limite de 20 labels por board)
      const boardsWithLabels = await db.board.findMany({
        where: { organizationId },
        include: { labels: true },
      });
      current = boardsWithLabels.reduce(
        (sum, board) => sum + board.labels.length,
        0
      );
      max = boardsWithLabels.length * 20; // 20 labels por board
      break;
  }

  return {
    allowed: max === -1 || current < max,
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
): Promise<boolean> {
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
      return true;
    }

    toast.error(
      `Limite atingido! Você atingiu o máximo de ${result.max} ${featureNames[feature]} no plano Free.`,
      {
        description: "Faça upgrade para o plano Pro para criar mais.",
        action: {
          label: "Ver planos",
          onClick: () => {
            // TODO: Redirecionar para página de billing
            console.log("Redirecionar para billing");
          },
        },
      }
    );

    return false;
  }

  return true;
}

/**
 * Obtém estatísticas de uso da organização
 */
export async function getOrganizationUsage(organizationId: string) {
  const limits = await getFeatureLimits(organizationId);
  if (!limits) return null;

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
    boards: { current: boards, max: limits.maxBoards },
    members: { current: members, max: limits.maxMembers },
    columns: { current: totalColumns, max: boards * 10 },
    cards: { current: totalCards, max: boards * 100 },
    labels: { current: totalLabels, max: boards * 20 },
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
