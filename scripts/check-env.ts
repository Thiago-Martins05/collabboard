import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

function checkEnvironmentVariables() {
  console.log("🔧 Verificando variáveis de ambiente...\n");

  const requiredVars = [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PRO_PRICE_ID",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "DATABASE_URL",
  ];

  const optionalVars = ["STRIPE_WEBHOOK_SECRET"];

  console.log("📋 Variáveis obrigatórias:");
  let allRequiredPresent = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: NÃO CONFIGURADA`);
      allRequiredPresent = false;
    }
  }

  console.log("\n📋 Variáveis opcionais:");
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`⚠️ ${varName}: NÃO CONFIGURADA (opcional)`);
    }
  }

  console.log("\n📊 Resumo:");
  if (allRequiredPresent) {
    console.log("✅ Todas as variáveis obrigatórias estão configuradas");
  } else {
    console.log("❌ Algumas variáveis obrigatórias estão faltando");
    console.log("Configure as variáveis no arquivo .env");
  }

  // Verificar se as URLs estão corretas
  console.log("\n🌐 Verificando URLs:");
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    console.log(`✅ NEXTAUTH_URL: ${nextAuthUrl}`);
  } else {
    console.log("❌ NEXTAUTH_URL não configurada");
  }
}

checkEnvironmentVariables();
