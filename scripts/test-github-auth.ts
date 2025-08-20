import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testGitHubAuth() {
  console.log("🔍 Testando configuração do GitHub OAuth...\n");

  // Verifica variáveis de ambiente
  console.log("1. Verificando variáveis de ambiente:");
  console.log(
    `   GITHUB_ID: ${
      process.env.GITHUB_ID ? "✅ Configurada" : "❌ Não configurada"
    }`
  );
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
  console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);

  if (process.env.GITHUB_ID) {
    console.log(
      `   GitHub ID (primeiros 10 chars): ${process.env.GITHUB_ID.substring(
        0,
        10
      )}...`
    );
  }

  if (process.env.GITHUB_SECRET) {
    console.log(
      `   GitHub Secret (primeiros 10 chars): ${process.env.GITHUB_SECRET.substring(
        0,
        10
      )}...`
    );
  }

  // Verifica se as credenciais parecem válidas
  console.log("\n2. Validando formato das credenciais:");

  if (process.env.GITHUB_ID && process.env.GITHUB_ID.length < 10) {
    console.log("   ❌ GITHUB_ID parece muito curto");
  } else if (process.env.GITHUB_ID) {
    console.log("   ✅ GITHUB_ID tem formato válido");
  }

  if (process.env.GITHUB_SECRET && process.env.GITHUB_SECRET.length < 20) {
    console.log("   ❌ GITHUB_SECRET parece muito curto");
  } else if (process.env.GITHUB_SECRET) {
    console.log("   ✅ GITHUB_SECRET tem formato válido");
  }

  // Verifica URL de callback
  console.log("\n3. Verificando URL de callback:");
  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/github`;
  console.log(`   Callback URL: ${callbackUrl}`);

  console.log("\n4. Instruções para verificar no GitHub:");
  console.log("   - Acesse: https://github.com/settings/developers");
  console.log("   - Clique no seu OAuth App");
  console.log(
    "   - Verifique se a 'Authorization callback URL' está configurada como:"
  );
  console.log(`     ${callbackUrl}`);
  console.log(
    "   - Verifique se o 'Client ID' e 'Client Secret' correspondem às variáveis de ambiente"
  );

  console.log("\n5. Possíveis problemas:");
  console.log("   - Credenciais incorretas no GitHub");
  console.log("   - URL de callback não configurada");
  console.log("   - App não está ativo no GitHub");
  console.log("   - Variáveis de ambiente não carregadas corretamente");
}

testGitHubAuth().catch(console.error);

