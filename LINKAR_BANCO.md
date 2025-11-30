# 🔗 Como Linkar o Banco com o Projeto

## 📋 Dados Extraídos da Sua Connection String

```
postgresql://postgres:D30h70$!@db.bhmnvzhryfnucktsugsl.supabase.co:5432/postgres
```

Foram extraídos:
- **Host**: `db.bhmnvzhryfnucktsugsl.supabase.co`
- **Usuário**: `postgres`
- **Senha**: `D30h70$!`
- **Banco**: `postgres`
- **Porta**: `5432`
- **Projeto**: `bhmnvzhryfnucktsugsl`

## ✅ Arquivo `.env` foi atualizado

O arquivo `backend/.env` já contém:
```
DATABASE_URL=postgresql://postgres:D30h70$!@db.bhmnvzhryfnucktsugsl.supabase.co:5432/postgres
SUPABASE_URL=https://bhmnvzhryfnucktsugsl.supabase.co
```

## 🚀 Próximos Passos

### 1️⃣ No Dashboard do Supabase

1. Acesse: https://app.supabase.com
2. Abra seu projeto
3. Vá para **SQL Editor** → **New Query**
4. Cole o conteúdo completo de `database/schema.sql`
5. Clique em **RUN** (botão azul no canto superior direito)

### 2️⃣ Aguarde a execução

Você verá as mensagens:
- ✅ Tabelas criadas
- ✅ Índices criados
- ✅ Views criadas
- ✅ Dados de teste inseridos

### 3️⃣ Verifique no Supabase

1. Vá para **Table Editor** (lado esquerdo)
2. Você deve ver 5 tabelas:
   - ✅ `admin`
   - ✅ `empresa`
   - ✅ `produto`
   - ✅ `cliente`
   - ✅ `verificacao`

### 4️⃣ Copie as API Keys

1. Vá para **Settings** → **API**
2. Copie:
   - `Project URL` (já está em `SUPABASE_URL`)
   - `anon public` (cole em `REACT_APP_SUPABASE_ANON_KEY`)
   - `service_role` (já deve estar em `SUPABASE_SERVICE_ROLE_KEY`)

3. Atualize o arquivo `backend/.env`:
```bash
SUPABASE_URL=https://bhmnvzhryfnucktsugsl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ✨ Banco de dados está pronto!

Agora você pode usar em seu código:

### Backend (Node.js)
```typescript
import { SupabaseService } from './services/SupabaseService';

// Login admin
const admin = await SupabaseService.loginAdmin('admin@example.com', 'admin123');

// Criar empresa
const empresa = await SupabaseService.criarEmpresa({
  nome: 'Minha Empresa',
  email: 'empresa@example.com',
  // ... outros dados
});

// Listar produtos
const produtos = await SupabaseService.listarProdutos(empresaId);
```

### Frontend (React)
```typescript
import { supabase } from './config/supabase';

// Buscar clientes
const { data, error } = await supabase
  .from('cliente')
  .select('*')
  .eq('verificado', true);
```

## 📊 Dados de Teste Inseridos

Após executar o SQL, você terá:

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@example.com | admin123 |
| Empresa | empresa@example.com | empresa123 |

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- ✅ Arquivo `.env` nunca será commitado (está em `.gitignore`)
- ✅ Senhas de teste devem ser alteradas em produção
- ✅ Use variáveis de ambiente para chaves privadas
- ✅ Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend

## 📝 Arquivos Criados

- ✅ `backend/.env` - Variáveis de ambiente configuradas
- ✅ `backend/scripts/init-db.js` - Script para inicializar banco
- ✅ `backend/scripts/test-db.js` - Script para testar conexão
- ✅ `backend/src/config/supabase.ts` - Cliente Supabase
- ✅ `backend/src/services/SupabaseService.ts` - Serviço para CRUD
- ✅ `database/schema.sql` - Schema completo
- ✅ `DATABASE_SETUP.md` - Este guia

## 🎯 Próximas Ações

1. ✅ Execute o SQL no Supabase Dashboard
2. ✅ Copie as API Keys para `backend/.env`
3. ✅ Teste a conexão: `npm run db:test`
4. ✅ Inicialize o banco: `npm run db:init` (opcional, se não executar via dashboard)
5. ✅ Comece a usar `SupabaseService` no seu backend
6. ✅ Chame `supabase.from()` no seu frontend

## 🚨 Se Receber Erro "Table already exists"

É normal! O schema usa `ON CONFLICT DO NOTHING` para evitar duplicatas. Significa que as tabelas já foram criadas com sucesso.

## ✅ Tudo Pronto!

Seu SaaS está linkado ao Supabase e pronto para:
- 🗄️ Armazenar dados em PostgreSQL
- 🔐 Autenticar usuários (Admin, Empresa, Cliente)
- 📊 Gerenciar produtos e logos/banners
- ⚡ Escalar sem limites

Happy coding! 🚀
