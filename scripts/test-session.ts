import { config } from "dotenv";
import { getSession } from "../src/lib/session";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testSession() {
  console.log("🧪 Testando sessão...\n");

  try {
    const session = await getSession();
    console.log("📋 Sessão:", session);

    if (session?.user) {
      console.log("✅ Usuário autenticado:", session.user.email);
    } else {
      console.log("❌ Nenhum usuário autenticado");
    }
  } catch (error) {
    console.error("❌ Erro ao obter sessão:", error);
  }
}

testSession().catch(console.error);
