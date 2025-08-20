import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultLabels = [
  { name: 'Bug', color: '#ef4444' },      // Red
  { name: 'Feature', color: '#3b82f6' },  // Blue
  { name: 'Improvement', color: '#10b981' }, // Green
  { name: 'Documentation', color: '#f59e0b' }, // Yellow
  { name: 'Design', color: '#8b5cf6' },   // Purple
];

async function main() {
  console.log('🌱 Seeding labels for existing boards...');

  // Busca todos os boards existentes
  const boards = await prisma.board.findMany();
  
  for (const board of boards) {
    console.log(`📋 Adding labels to board: ${board.title}`);
    
    // Verifica se o board já tem labels
    const existingLabels = await prisma.label.findMany({
      where: { boardId: board.id }
    });
    
    if (existingLabels.length === 0) {
      // Adiciona as labels padrão
      for (const label of defaultLabels) {
        await prisma.label.create({
          data: {
            boardId: board.id,
            name: label.name,
            color: label.color,
          }
        });
      }
      console.log(`✅ Added ${defaultLabels.length} labels to board: ${board.title}`);
    } else {
      console.log(`⏭️ Board ${board.title} already has ${existingLabels.length} labels`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
