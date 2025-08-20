import { config } from "dotenv";
import { db } from "@/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function resetUser() {
  console.log("🔄 Resetando usuário para permitir novo login...\n");

  try {
    // Busca o usuário existente
    const user = await db.user.findFirst({
      include: {
        accounts: true,
        memberships: true,
      },
    });

    if (!user) {
      console.log("❌ Nenhum usuário encontrado");
      return;
    }

    console.log(`👤 Usuário encontrado: ${user.name} (${user.email})`);
    console.log(`   Contas: ${user.accounts.length}`);
    console.log(`   Memberships: ${user.memberships.length}`);

    // Remove todas as contas OAuth
    if (user.accounts.length > 0) {
      console.log("🗑️ Removendo contas OAuth...");
      await db.account.deleteMany({
        where: { userId: user.id },
      });
      console.log("✅ Contas OAuth removidas");
    }

    // Remove o usuário
    console.log("🗑️ Removendo usuário...");
    await db.user.delete({
      where: { id: user.id },
    });
    console.log("✅ Usuário removido");

    console.log("\n🎉 Reset concluído! Agora você pode fazer login novamente.");
  } catch (error) {
    console.error("❌ Erro ao resetar usuário:", error);
  } finally {
    await db.$disconnect();
  }
}

resetUser().catch(console.error);

