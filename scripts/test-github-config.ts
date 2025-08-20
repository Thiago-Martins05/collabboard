import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

function testGitHubConfig() {
  console.log("🔍 Testando configuração do GitHub...\n");

  console.log("📋 CONFIGURAÇÃO ATUAL:");
  console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`   GITHUB_ID: ${process.env.GITHUB_ID}`);
  console.log(
    `   GITHUB_SECRET: ${
      process.env.GITHUB_SECRET ? "✅ Configurada" : "❌ Não configurada"
    }`
  );
  console.log(
    `   AUTH_SECRET: ${
      process.env.AUTH_SECRET ? "✅ Configurada" : "❌ Não configurada"
    }`
  );

  console.log("\n🔗 URLs que devem estar no GitHub:");
  console.log(`   Homepage URL: ${process.env.NEXTAUTH_URL}`);
  console.log(
    `   Authorization callback URL: ${process.env.NEXTAUTH_URL}/api/auth/callback/github`
  );

  console.log("\n🚨 INSTRUÇÕES PARA CORRIGIR:");
  console.log("1. Acesse: https://github.com/settings/developers");
  console.log("2. Clique no seu OAuth App");
  console.log("3. Configure EXATAMENTE estas URLs:");
  console.log(`   - Homepage URL: ${process.env.NEXTAUTH_URL}`);
  console.log(
    `   - Authorization callback URL: ${process.env.NEXTAUTH_URL}/api/auth/callback/github`
  );
  console.log("4. Salve as alterações");
  console.log("5. Teste o login em: http://localhost:3000/sign-in");

  console.log("\n✅ SERVIDOR:");
  console.log("   - Rodando na porta 3000 (fixa)");
  console.log("   - URL de acesso: http://localhost:3000");

  console.log("\n🎯 PRÓXIMOS PASSOS:");
  console.log("1. Atualize a URL no GitHub para porta 3000");
  console.log("2. Teste o login");
  console.log("3. Deve redirecionar para: http://localhost:3000/dashboard");
}

testGitHubConfig();

