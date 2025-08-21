import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultLabels = [
  { name: "Bug", color: "#ef4444" }, // Red
  { name: "Feature", color: "#3b82f6" }, // Blue
  { name: "Improvement", color: "#10b981" }, // Green
  { name: "Documentation", color: "#f59e0b" }, // Yellow
  { name: "Design", color: "#8b5cf6" }, // Purple
];

async function main() {
  const boards = await prisma.board.findMany();

  for (const board of boards) {
    const existingLabels = await prisma.label.findMany({
      where: { boardId: board.id },
    });

    if (existingLabels.length === 0) {
      for (const label of defaultLabels) {
        await prisma.label.create({
          data: {
            boardId: board.id,
            name: label.name,
            color: label.color,
          },
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
