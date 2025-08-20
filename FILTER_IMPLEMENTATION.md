# Módulo 4 — Busca e Filtros

## 🎯 Objetivo

Implementar um sistema de filtro rápido que permite buscar cards por título, descrição e labels.

## ✨ Funcionalidades Implementadas

### 🔍 **Filtro de Busca**

- **Input de busca** no header do board
- **Busca em tempo real** - filtra conforme você digita
- **Busca em múltiplos campos**:
  - Título do card
  - Descrição do card
  - Nome das labels

### 🎨 **Highlight de Resultados**

- **Destaque visual** do texto que corresponde à busca
- **Highlight em amarelo** para melhor visibilidade
- **Case-insensitive** - não diferencia maiúsculas/minúsculas

### ⌨️ **Atalhos de Teclado**

- **Ctrl+K** (ou Cmd+K no Mac) para focar no campo de busca
- **Enter** para navegar pelos resultados
- **Escape** para limpar o filtro

### 📊 **Indicadores Visuais**

- **Contador de resultados**: mostra quantos cards foram encontrados
- **Badge de status**: indica quando o filtro está ativo
- **Botão de limpar**: remove o filtro rapidamente

## 🏗️ Arquitetura

### Componentes Criados

#### `src/components/board/board-filter.tsx`

```typescript
// Componente principal do filtro
export function BoardFilter({
  searchTerm,
  onSearchChange,
  onClear,
  resultCount,
  totalCount,
}: BoardFilterProps);

// Componente para destacar texto
export function HighlightedText({
  text,
  searchTerm,
  className,
}: HighlightedTextProps);
```

### Integração no Kanban

#### `src/app/(app)/boards/[boardId]/kanban.tsx`

- **Estado de filtro**: `searchTerm`
- **Lógica de filtragem**: `cardMatchesFilter()`
- **Colunas filtradas**: `filteredColumns`
- **Contadores**: `totalCards` e `filteredCards`

## 🔧 Como Funciona

### 1. **Estado de Filtro**

```typescript
const [searchTerm, setSearchTerm] = React.useState("");
```

### 2. **Função de Filtragem**

```typescript
const cardMatchesFilter = React.useCallback(
  (card: CardDTO) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();

    // Busca no título
    if (card.title.toLowerCase().includes(term)) return true;

    // Busca na descrição
    if (card.description?.toLowerCase().includes(term)) return true;

    // Busca nas labels
    if (card.cardLabels) {
      for (const cardLabel of card.cardLabels) {
        const label = labels.find((l) => l.id === cardLabel.labelId);
        if (label && label.name.toLowerCase().includes(term)) return true;
      }
    }

    return false;
  },
  [searchTerm, labels]
);
```

### 3. **Colunas Filtradas**

```typescript
const filteredColumns = React.useMemo(() => {
  if (!searchTerm.trim()) return columns;

  return columns.map((col) => ({
    ...col,
    cards: col.cards.filter(cardMatchesFilter),
  }));
}, [columns, searchTerm, cardMatchesFilter]);
```

### 4. **Highlight de Texto**

```typescript
const regex = new RegExp(`(${searchTerm})`, "gi");
const parts = text.split(regex);

return (
  <span className={className}>
    {parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    )}
  </span>
);
```

## 🎨 Interface do Usuário

### Header do Board

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Buscar cards... (Ctrl+K)] [X] [Filtrado: 5/12] [Tempo real ativo] │
│ Alterações são sincronizadas automaticamente                │
│ Mostrando 5 de 12 cards                                     │
└─────────────────────────────────────────────────────────────┘
```

### Cards com Highlight

```
┌─────────────────────────────────────┐
│ Implementar API de usuários         │ ← "API" destacado
│ Criar endpoints para CRUD de...     │
│ [Bug] [Frontend] [Backend]          │ ← Labels destacadas
└─────────────────────────────────────┘
```

## 🧪 Como Testar

### 1. **Busca por Título**

- Digite "api" no campo de busca
- Cards com "API" no título devem aparecer destacados

### 2. **Busca por Descrição**

- Digite "endpoint" no campo de busca
- Cards com "endpoint" na descrição devem aparecer

### 3. **Busca por Label**

- Digite "bug" no campo de busca
- Cards com label "Bug" devem aparecer

### 4. **Atalhos de Teclado**

- Pressione **Ctrl+K** para focar no campo
- Digite algo e veja a filtragem em tempo real
- Pressione **Escape** para limpar

### 5. **Contadores**

- Observe o badge mostrando "X/Y" cards
- Verifique o texto "Mostrando X de Y cards"

## 🚀 Próximos Passos (Opcionais)

### Melhorias Futuras

- **Filtros avançados**: por data, responsável, etc.
- **Busca por regex**: para usuários avançados
- **Histórico de buscas**: últimas pesquisas realizadas
- **Filtros salvos**: salvar filtros favoritos
- **Busca global**: buscar em todos os boards
- **Sugestões**: autocomplete baseado em títulos existentes

## 📝 Notas Técnicas

### Performance

- **Filtragem client-side**: rápida e responsiva
- **Memoização**: `useMemo` para evitar recálculos desnecessários
- **Debounce**: pode ser adicionado para otimizar buscas longas

### Acessibilidade

- **ARIA labels**: para leitores de tela
- **Navegação por teclado**: Tab, Enter, Escape
- **Contraste**: highlight amarelo visível em modo escuro

### Responsividade

- **Mobile-friendly**: input se adapta a telas pequenas
- **Touch-friendly**: botões com tamanho adequado
- **Flexível**: layout se ajusta ao conteúdo
