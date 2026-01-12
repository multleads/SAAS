# MultLeads WhatsApp AI - Frontend

## 🚀 Deploy Rápido na Vercel

### Opção 1: Via Interface Web (Recomendado)

1. **Acesse:** https://vercel.com/new
2. **Importe o repositório** (ou faça upload do diretório `frontend/`)
3. **Configure:**
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Adicione a variável de ambiente:**
   ```
   NEXT_PUBLIC_API_URL=http://talkagents.br.com/public_html/api
   ```

5. **Clique em Deploy**

### Opção 2: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

Quando solicitado:
- Set up and deploy? **Y**
- Which scope? (selecione sua conta)
- Link to existing project? **N**
- What's your project's name? **multleads-frontend**
- In which directory is your code located? **.**
- Want to override the settings? **N**

### Opção 3: Deploy Manual em VPS/Servidor

Se preferir hospedar no mesmo servidor do backend:

```bash
# No servidor via SSH
cd /var/www/
git clone [seu-repositorio] multleads-frontend
cd multleads-frontend/frontend

# Instalar dependências
npm install --production

# Criar .env.local
echo "NEXT_PUBLIC_API_URL=http://talkagents.br.com/public_html/api" > .env.local

# Build
npm run build

# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start npm --name "multleads-frontend" -- start
pm2 save
pm2 startup
```

### Configurar Domínio Customizado

Após deploy na Vercel:

1. Vá em **Settings > Domains**
2. Adicione: `app.talkagents.br.com`
3. Configure DNS:
   - Tipo: **CNAME**
   - Nome: **app**
   - Valor: **cname.vercel-dns.com**

## 📝 Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_API_URL=http://talkagents.br.com/public_html/api
```

## ✅ Verificação

Após deploy, teste:
- https://seu-app.vercel.app
- Login com: admin@multleads.com / admin123
- Deve carregar estatísticas do dashboard

## 🔧 Troubleshooting

### Erro de CORS
Adicione o domínio Vercel no backend Laravel:
```php
// config/cors.php
'allowed_origins' => [
    'https://seu-app.vercel.app',
    'https://app.talkagents.br.com'
],
```

### API não conecta
Verifique se a variável `NEXT_PUBLIC_API_URL` está configurada corretamente no Vercel.
