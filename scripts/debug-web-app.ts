import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function debugWebApp() {
  console.log("🔍 Debugando aplicação web...\n");

  console.log("📋 Informações da aplicação:");
  console.log("🌐 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
  console.log(
    "🔑 AUTH_SECRET:",
    process.env.AUTH_SECRET ? "Configurada" : "NÃO CONFIGURADA"
  );
  console.log(
    "💰 STRIPE_SECRET_KEY:",
    process.env.STRIPE_SECRET_KEY ? "Configurada" : "NÃO CONFIGURADA"
  );
  console.log("💳 STRIPE_PRO_PRICE_ID:", process.env.STRIPE_PRO_PRICE_ID);
  console.log(
    "🗄️ DATABASE_URL:",
    process.env.DATABASE_URL ? "Configurada" : "NÃO CONFIGURADA"
  );

  console.log("\n🔧 Verificando se o servidor está rodando...");

  try {
    const response = await fetch("http://localhost:3000");
    console.log("✅ Servidor respondendo:", response.status);

    if (response.status === 200) {
      console.log("✅ Aplicação carregando corretamente");
    } else {
      console.log("⚠️ Status inesperado:", response.status);
    }
  } catch (error) {
    console.log("❌ Servidor não está rodando ou não responde");
    console.log("💡 Execute: npm run dev");
  }

  console.log("\n📝 Instruções para testar:");
  console.log("1. Certifique-se de que o servidor está rodando: npm run dev");
  console.log("2. Acesse: http://localhost:3000");
  console.log("3. Faça login se necessário");
  console.log("4. Vá para: http://localhost:3000/billing");
  console.log("5. Clique no botão 'Fazer Upgrade'");
  console.log("6. Verifique o console do navegador (F12) para erros");
  console.log("7. Verifique o console do servidor para logs");

  console.log("\n🐛 Possíveis problemas:");
  console.log("- Variáveis de ambiente não configuradas");
  console.log("- Servidor não rodando");
  console.log("- Erro de autenticação");
  console.log("- Erro de CORS");
  console.log("- Erro de JavaScript no navegador");
  console.log("- Erro de rede");
}

debugWebApp().catch(console.error);
