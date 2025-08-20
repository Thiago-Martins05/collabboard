import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

console.log("🔍 Testando variáveis de ambiente...\n");

console.log(
  "STRIPE_SECRET_KEY:",
  process.env.STRIPE_SECRET_KEY ? "✅ Configurada" : "❌ Não configurada"
);
console.log(
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:",
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? "✅ Configurada"
    : "❌ Não configurada"
);
console.log(
  "NEXTAUTH_URL:",
  process.env.NEXTAUTH_URL ? "✅ Configurada" : "❌ Não configurada"
);

if (process.env.STRIPE_SECRET_KEY) {
  console.log(
    "\n🔑 Chave Stripe (primeiros 20 chars):",
    process.env.STRIPE_SECRET_KEY.substring(0, 20) + "..."
  );
}

if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.log(
    "🔑 Chave Pública (primeiros 20 chars):",
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20) + "..."
  );
}
