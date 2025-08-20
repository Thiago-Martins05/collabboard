import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

function showGitHubSetupInstructions() {
  console.log("🔧 Configuração do GitHub OAuth App\n");

  console.log("📋 PASSO A PASSO:\n");

  console.log("1️⃣ Acesse o GitHub:");
  console.log("   https://github.com/settings/developers\n");

  console.log("2️⃣ Clique no seu OAuth App ou crie um novo\n");

  console.log("3️⃣ Configure as seguintes informações:\n");
  console.log(`   🔑 Client ID: ${process.env.GITHUB_ID}`);
  console.log(`   🔐 Client Secret: ${process.env.GITHUB_SECRET}`);
  console.log("   🌐 Authorization callback URL:");
  console.log(`      ${process.env.NEXTAUTH_URL}/api/auth/callback/github\n`);

  console.log("4️⃣ IMPORTANTE - URLs que devem estar configuradas:");
  console.log(`   ✅ Homepage URL: ${process.env.NEXTAUTH_URL}`);
  console.log(
    `   ✅ Authorization callback URL: ${process.env.NEXTAUTH_URL}/api/auth/callback/github\n`
  );

  console.log("5️⃣ Verifique se o app está:");
  console.log("   ✅ Ativo (não desabilitado)");
  console.log("   ✅ Com as permissões corretas\n");

  console.log("🚨 PROBLEMA ATUAL:");
  console.log(
    "   O GitHub está redirecionando para porta 3003, mas o servidor está na 3000"
  );
  console.log(
    "   Você precisa atualizar a 'Authorization callback URL' no GitHub para:"
  );
  console.log(`   ${process.env.NEXTAUTH_URL}/api/auth/callback/github\n`);

  console.log("🔗 URL completa que deve estar no GitHub:");
  console.log(`   http://localhost:3000/api/auth/callback/github\n`);

  console.log("📝 Após atualizar no GitHub:");
  console.log("   1. Salve as alterações");
  console.log("   2. Teste o login novamente");
  console.log("   3. Deve redirecionar para a porta 3000\n");
}

showGitHubSetupInstructions();

