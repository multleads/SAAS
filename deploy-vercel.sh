#!/bin/bash

echo "🚀 DEPLOY AUTOMATIZADO - MULTLEADS FRONTEND"
echo "=============================================="
echo ""

cd "/Users/diogosilva/Library/CloudStorage/OneDrive-Pessoal/9 AGENT/frontend"

echo "📦 Criando pacote para deploy..."

# Criar arquivo .vercelignore
cat > .vercelignore << 'EOF'
node_modules
.next/cache
.env*.local
.DS_Store
*.log
EOF

echo "✅ Pacote preparado!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Acesse: https://vercel.com/new"
echo "2. Faça login com GitHub ou email"
echo "3. Clique em 'Browse' e selecione a pasta:"
echo "   /Users/diogosilva/Library/CloudStorage/OneDrive-Pessoal/9 AGENT/frontend"
echo ""
echo "4. Configure:"
echo "   - Framework: Next.js"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo ""
echo "5. IMPORTANTE - Adicione variável de ambiente:"
echo "   Nome: NEXT_PUBLIC_API_URL"
echo "   Valor: http://talkagents.br.com/public_html/api"
echo ""
echo "6. Clique em DEPLOY"
echo ""
echo "⏱️  Deploy levará ~2 minutos"
echo ""

# Abrir Vercel no navegador
open "https://vercel.com/new" 2>/dev/null || echo "Abra manualmente: https://vercel.com/new"

echo "✨ Pronto! Siga as instruções acima."
