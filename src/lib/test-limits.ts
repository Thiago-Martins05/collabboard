import { db } from "@/lib/db";

/**
 * Script para testar os limites
 * Configura limites baixos para facilitar os testes
 */
export async function setupTestLimits(organizationId: string) {
  console.log("🔧 Configurando limites de teste...");

  // Configura limites baixos para teste
  await db.featureLimit.upsert({
    where: { organizationId },
    update: {
      maxBoards: 1, // Apenas 1 board
      maxMembers: 2, // Apenas 2 membros
    },
    create: {
      organizationId,
      maxBoards: 1,
      maxMembers: 2,
    },
  });

  console.log("✅ Limites de teste configurados:");
  console.log("   - maxBoards: 1");
  console.log("   - maxMembers: 2");
  console.log("");
  console.log("🧪 Para testar:");
  console.log("   1. Tente criar um segundo board (deve falhar)");
  console.log("   2. Tente convidar um terceiro membro (deve falhar)");
  console.log("   3. Verifique se os banners aparecem no dashboard");
}

/**
 * Restaura limites normais
 */
export async function restoreNormalLimits(organizationId: string) {
  console.log("🔄 Restaurando limites normais...");

  await db.featureLimit.upsert({
    where: { organizationId },
    update: {
      maxBoards: 3, // Free: 3 boards
      maxMembers: 5, // Free: 5 members
    },
    create: {
      organizationId,
      maxBoards: 5,
      maxMembers: 5,
    },
  });

  console.log("✅ Limites normais restaurados:");
  console.log("   - maxBoards: 5");
  console.log("   - maxMembers: 5");
}
