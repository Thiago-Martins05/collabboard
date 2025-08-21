import { db } from "@/lib/db";

export async function setupTestLimits(organizationId: string) {
  await db.featureLimit.upsert({
    where: { organizationId },
    update: {
      maxBoards: 1,
      maxMembers: 2,
    },
    create: {
      organizationId,
      maxBoards: 1,
      maxMembers: 2,
    },
  });
}

export async function restoreNormalLimits(organizationId: string) {
  await db.featureLimit.upsert({
    where: { organizationId },
    update: {
      maxBoards: 3,
      maxMembers: 5,
    },
    create: {
      organizationId,
      maxBoards: 5,
      maxMembers: 5,
    },
  });
}
