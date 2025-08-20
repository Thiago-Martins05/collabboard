# 📧 Guia: Login com Email Simples

Sistema de login com email implementado para facilitar testes no CollabBoard.

## 🎯 Como Funciona

### Características

- ✅ **Login apenas com email** (sem senha)
- ✅ **Cadastro automático** de novos usuários
- ✅ **Nome opcional** no primeiro login
- ✅ **Organização criada automaticamente**
- ✅ **Integração com sistema de billing**

### Segurança

⚠️ **APENAS PARA DESENVOLVIMENTO**: Este sistema não deve ser usado em produção, pois não tem verificação de senha.

## 🚀 Como Usar

### 1. Acessar Página de Login

```
http://localhost:3000/sign-in
```

### 2. Formulário de Email

- **Email**: Digite qualquer email (será criado automaticamente)
- **Nome**: Opcional (pode deixar em branco)
- **Clique em**: "Entrar com Email"

### 3. Emails de Teste Prontos

- `teste1@collabboard.com` (Usuário Teste 1)
- `teste2@collabboard.com` (Usuário Teste 2)
- `admin@collabboard.com` (Admin CollabBoard)
- `test-free@example.com` (Organização FREE para testes)

## 🧪 Cenários de Teste

### Teste 1: Login Básico

1. Acesse `/sign-in`
2. Digite: `teste1@collabboard.com`
3. Clique em "Entrar com Email"
4. Verifique redirecionamento para `/dashboard`

### Teste 2: Novo Usuário

1. Acesse `/sign-in`
2. Digite um email novo: `novo@teste.com`
3. Digite um nome: "Novo Usuário"
4. Sistema cria usuário e organização automaticamente

### Teste 3: Teste de Billing

1. Faça login com qualquer email
2. Vá para `/billing`
3. Teste upgrade FREE → PRO
4. Use email: `test-free@example.com` (já tem org FREE)

## 🔧 Implementação Técnica

### Provider NextAuth

```typescript
CredentialsProvider({
  id: "email-login",
  name: "Email Login",
  credentials: {
    email: { label: "Email", type: "email" },
    name: { label: "Nome", type: "text" },
  },
  async authorize(credentials) {
    // Busca ou cria usuário automaticamente
    const user = await db.user.upsert({
      where: { email: credentials.email },
      update: { name: credentials.name },
      create: { email: credentials.email, name: credentials.name },
    });
    return user;
  },
});
```

### Interface de Login

- Formulário de email no topo
- Divisor visual
- Botões OAuth (GitHub, Google) abaixo

## 📊 Fluxo Completo

```mermaid
graph TD
    A[Acessa /sign-in] --> B[Digita Email]
    B --> C[Clica "Entrar com Email"]
    C --> D[NextAuth valida]
    D --> E[Busca/Cria usuário no DB]
    E --> F[Cria organização se necessário]
    F --> G[Redireciona para /dashboard]
```

## 🎉 Vantagens para Teste

### Facilita Testes

- ✅ Sem necessidade de configurar OAuth
- ✅ Criação instantânea de usuários
- ✅ Múltiplos usuários facilmente
- ✅ Teste de diferentes cenários

### Flexibilidade

- ✅ Qualquer email funciona
- ✅ Nome opcional
- ✅ Organizações automáticas
- ✅ Integração completa com billing

## 🔗 Links Úteis

- **Login**: http://localhost:3000/sign-in
- **Dashboard**: http://localhost:3000/dashboard
- **Billing**: http://localhost:3000/billing
- **Membros**: http://localhost:3000/members

## 📝 Scripts Disponíveis

### Criar Usuários de Teste

```bash
npx tsx scripts/test-email-login.ts
```

### Verificar Usuários

```bash
npx tsx scripts/check-user-org.ts
```

### Testar Billing

```bash
npx tsx scripts/test-free-to-pro-upgrade.ts
```

---

**Agora você pode fazer login facilmente e testar todas as funcionalidades do CollabBoard!** 🚀
