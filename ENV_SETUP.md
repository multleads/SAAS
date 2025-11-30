# Como Preencher o Arquivo `.env`

## 📋 Passo 1: Obter Credenciais do Supabase

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá para **Settings** → **API**
4. Você verá 3 valores importantes:

### **Project URL**
```
https://seu-projeto.supabase.co
```
- Copie e cole em: `SUPABASE_URL=`

### **API Keys**

#### anon (public) key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Use no frontend: `REACT_APP_SUPABASE_ANON_KEY=`
- Use no backend: `SUPABASE_ANON_KEY=`

#### service_role (secret) key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- ⚠️ **SEGREDO!** Nunca exponha publicamente
- Use apenas no backend: `SUPABASE_SERVICE_ROLE_KEY=`

## 🔐 Passo 2: Gerar JWT_SECRET

No terminal, execute:
```bash
openssl rand -base64 32
```

Copie a saída e cole em:
```
JWT_SECRET=sua-chave-gerada-aqui
```

## 📝 Passo 3: Configurar URLs

### Frontend
```
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SITE_URL=https://appmultleads.netlify.app
```

### Backend
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
PORT=3001
NODE_ENV=development
JWT_SECRET=sua-chave-secreta
```

## 🔗 Exemplo Completo de `.env`

```bash
# Supabase
SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoic2VydmljZV9yb2xlIn0.XXXXXXXXXXXX
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoiYW5vbiJ9.XXXXXXXXXX

# Frontend
REACT_APP_SUPABASE_URL=https://abcdefghij.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoiYW5vbiJ9.XXXXXXXXXX
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SITE_URL=https://appmultleads.netlify.app

# Backend
PORT=3001
NODE_ENV=development
JWT_SECRET=7k+A9mL2xQ8pN1vR3cF5dJ4wM6bG9hS2tU1yX3zC5nV7

# Email (Opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

## ✅ Como Usar

### Backend
1. Coloque o arquivo `.env` na raiz do projeto backend
2. O Node.js carregará automaticamente com `dotenv`

### Frontend
1. Coloque o arquivo `.env.local` na pasta `frontend/`
2. Restart o servidor React para as variáveis serem carregadas

## 🔒 Segurança - NÃO FAÇA ISSO!

❌ **Nunca faça commit do `.env` com dados reais:**
```bash
git add .env  # ❌ NÃO FAÇA
git commit -m "Add env variables"
```

✅ **Sempre use `.env.example`:**
```bash
git add .env.example  # ✅ OK
git commit -m "Add env example"
```

## 📦 Como Usar em Produção

### Variáveis de Ambiente na Cloud

**Heroku:**
```bash
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=...
```

**Vercel:**
1. Projeto → Settings → Environment Variables
2. Adicione cada variável
3. Selecione os ambientes (Preview, Production, Development)

**Railway:**
1. Project → Variables
2. Copie e cole cada variável

**DigitalOcean / AWS / Azure:**
- Procure por "Secrets" ou "Environment Variables"
- Configure para sua aplicação

## 🧪 Testar a Conexão

### Backend
```bash
cd backend
npm install  # se ainda não instalou
# Verificar se carrega .env
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### Frontend
```bash
cd frontend
npm start  # Se as variáveis estão corretas, exibirá no console
```

## 🚨 Troubleshooting

### Erro: "Cannot read property 'SUPABASE_URL' of undefined"
- Verifique se o arquivo `.env` está na raiz do projeto
- Reinicie o servidor Node.js
- Verifique se o nome da variável está correto

### Erro: "ENOENT: no such file or directory"
- Confirme que `.env.local` está em `frontend/`
- Restart o servidor React com `npm start`

### Erro: "Invalid token"
- Confirme que copiou a chave completa (sem espaços extras)
- Verifique se está usando `service_role` no backend e `anon` no frontend

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [dotenv npm](https://www.npmjs.com/package/dotenv)
- [Create React App - Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
