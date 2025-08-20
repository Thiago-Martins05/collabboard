import { config } from "dotenv";
import { db } from "@/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function checkUsers() {
  console.log("🔍 Verificando usuários no banco de dados...\n");

  try {
    // Busca todos os usuários
    const users = await db.user.findMany({
      include: {
        accounts: true,
      },
    });

    console.log(`📊 Total de usuários: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`👤 Usuário ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Contas vinculadas: ${user.accounts.length}`);

      user.accounts.forEach((account) => {
        console.log(
          `     - ${account.provider} (${account.providerAccountId})`
        );
      });

      console.log("");
    });

    // Busca todas as contas
    const accounts = await db.account.findMany();
    console.log(`🔗 Total de contas OAuth: ${accounts.length}`);

    accounts.forEach((account) => {
      console.log(
        `   - ${account.provider}: ${account.providerAccountId} (User: ${account.userId})`
      );
    });
  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error);
  } finally {
    await db.$disconnect();
  }
}

checkUsers().catch(console.error);

