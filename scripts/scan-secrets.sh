#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Procurando padrões comuns de Stripe..."
grep -RIn --color=always -E 'sk_(test|live)_[0-9A-Za-z]+' || true
echo "✅ Se nada apareceu acima, ok no working tree."
