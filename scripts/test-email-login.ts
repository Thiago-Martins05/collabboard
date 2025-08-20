import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testEmailLogin() {
  console.log("🧪 Testando login com email...\n");

  try {
    // Criar alguns usuários de teste
    const testUsers = [
      {
        email: "teste1@collabboard.com",
        name: "Usuário Teste 1",
      },
      {
        email: "teste2@collabboard.com",
        name: "Usuário Teste 2",
      },
      {
        email: "admin@collabboard.com",
        name: "Admin CollabBoard",
      },
    ];

    console.log("👥 Criando usuários de teste...");

    for (const userData of testUsers) {
      const user = await db.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
        },
        create: {
          email: userData.email,
          name: userData.name,
        },
      });

      console.log(`✅ Usuário criado: ${user.email} (${user.id})`);
    }

    console.log("\n🎉 Usuários de teste criados com sucesso!");
    console.log("\n🔗 Para testar o login:");
    console.log("1. Acesse: http://localhost:3000/sign-in");
    console.log("2. Use um dos emails de teste:");

    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`);
    });

    console.log("\n📋 Como funciona:");
    console.log("- Digite o email no formulário");
    console.log("- O nome é opcional (pode deixar em branco)");
    console.log("- Clique em 'Entrar com Email'");
    console.log("- Você será redirecionado para o dashboard");
    console.log("- Uma organização será criada automaticamente");

    console.log("\n✨ Para testar o billing:");
    console.log("1. Faça login com qualquer email de teste");
    console.log("2. Vá para: http://localhost:3000/billing");
    console.log("3. Teste o upgrade para PRO");
  } catch (error) {
    console.error("❌ Erro ao criar usuários de teste:", error);
  }
}

testEmailLogin().catch(console.error);
