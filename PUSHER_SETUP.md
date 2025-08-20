# Configuração do Pusher para Tempo Real

Para habilitar a funcionalidade de tempo real no CollabBoard, você precisa configurar o Pusher.

## 1. Criar conta no Pusher

1. Acesse [pusher.com](https://pusher.com)
2. Crie uma conta gratuita
3. Crie um novo app

## 2. Configurar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Pusher Configuration
PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

Substitua os valores pelos dados do seu app no Pusher:

- `your_app_id`: ID do app (ex: 1234567)
- `your_key`: Chave pública (ex: a1b2c3d4e5f6g7h8i9j0)
- `your_secret`: Chave secreta (ex: k1l2m3n4o5p6q7r8s9t0)
- `your_cluster`: Cluster (ex: us2, eu, ap1)

## 3. Testar a funcionalidade

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Abra duas janelas do navegador na mesma board
3. Faça alterações em uma janela e veja se aparecem na outra em tempo real

## Funcionalidades implementadas

- ✅ Criação de colunas em tempo real
- ✅ Criação de cards em tempo real
- ✅ Edição de colunas e cards em tempo real
- ✅ Exclusão de colunas e cards em tempo real
- ✅ Reordenação de colunas e cards em tempo real
- ✅ Indicador visual de conexão
- ✅ Fallback para router.refresh() em caso de falha
