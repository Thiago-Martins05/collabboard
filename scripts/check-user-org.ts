import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function checkUserOrg() {
  console.log("🔍 Verificando usuário e organização...\n");

  try {
    // 1. Buscar todos os usuários
    const users = await db.user.findMany({
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscription: true,
              },
            },
          },
        },
      },
    });

    console.log("👥 Usuários encontrados:", users.length);

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || user.email}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Organizações: ${user.memberships.length}`);

      user.memberships.forEach((membership, mIndex) => {
        console.log(`     ${mIndex + 1}. ${membership.organization.name}`);
        console.log(`        ID: ${membership.organization.id}`);
        console.log(`        Role: ${membership.role}`);
        console.log(
          `        Plano: ${
            membership.organization.subscription?.plan || "FREE"
          }`
        );
        console.log(
          `        Status: ${
            membership.organization.subscription?.status || "FREE"
          }`
        );
      });
    });

    // 2. Verificar qual organização tem plano PRO
    const proOrg = await db.organization.findFirst({
      where: {
        subscription: {
          plan: "PRO",
        },
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
        subscription: true,
      },
    });

    if (proOrg) {
      console.log("\n✅ Organização PRO encontrada:");
      console.log(`   Nome: ${proOrg.name}`);
      console.log(`   ID: ${proOrg.id}`);
      console.log(`   Plano: ${proOrg.subscription?.plan}`);
      console.log(`   Status: ${proOrg.subscription?.status}`);
      console.log(`   Membros:`);
      proOrg.memberships.forEach((member) => {
        console.log(`     - ${member.user.email} (${member.role})`);
      });
    }

    // 3. Verificar organizações FREE
    const freeOrgs = await db.organization.findMany({
      where: {
        OR: [{ subscription: { plan: "FREE" } }, { subscription: null }],
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
        subscription: true,
      },
    });

    if (freeOrgs.length > 0) {
      console.log("\n⚠️ Organizações FREE encontradas:");
      freeOrgs.forEach((org, index) => {
        console.log(`   ${index + 1}. ${org.name}`);
        console.log(`      ID: ${org.id}`);
        console.log(`      Plano: ${org.subscription?.plan || "FREE"}`);
        console.log(`      Membros:`);
        org.memberships.forEach((member) => {
          console.log(`        - ${member.user.email} (${member.role})`);
        });
      });
    }

    console.log("\n💡 Recomendações:");
    console.log("1. Identifique qual usuário está logado na aplicação");
    console.log("2. Verifique se o usuário está na organização correta");
    console.log("3. Se necessário, mova o usuário para a organização PRO");
  } catch (error) {
    console.error("❌ Erro ao verificar usuário/org:", error);
  }
}

checkUserOrg().catch(console.error);
