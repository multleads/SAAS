# Guia: Criar Banco de Dados no Supabase

## 📋 Passo 1: Criar Conta no Supabase

1. Acesse https://supabase.com
2. Clique em "Sign Up"
3. Faça login com GitHub ou Google
4. Crie um novo projeto:
   - Escolha uma organização
   - Defina um nome para o projeto (ex: "saas-multleads")
   - Escolha região (recomendado: América do Sul - São Paulo)
   - Defina uma senha para o banco de dados
   - Clique em "Create new project"

## ⏳ Passo 2: Aguardar Inicialização

- Isso pode levar 1-2 minutos
- Você receberá um email de confirmação

## 🔑 Passo 3: Obter Credenciais

Após o projeto ser criado:

1. Vá para **Settings** → **API**
2. Copie:
   - `Project URL` (ex: https://xyzabc.supabase.co)
   - `anon public` (chave pública para o frontend)
   - `service_role` (chave privada para o backend - SEGREDO!)

## 💾 Passo 4: Executar o Schema SQL

1. Na dashboard do Supabase, clique em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo completo do arquivo `database/schema.sql`
4. Clique em **RUN** (botão azul no canto superior direito)
5. Você verá mensagens de sucesso para cada tabela criada

## 📝 Passo 5: Configurar Variáveis de Ambiente

No seu projeto, crie um arquivo `.env.local`:

```bash
# Backend
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key-aqui

# Frontend
REACT_APP_SUPABASE_URL=https://xyzabc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

## 🔐 Passo 6: Configurar Autenticação (Opcional)

Se quiser usar autenticação do Supabase:

1. Vá para **Authentication** → **Providers**
2. Habilite os provedores que quiser (Email, Google, GitHub, etc)
3. Defina a URL de redirecionamento de callback

## 🧪 Passo 7: Testar a Conexão

### No Backend (Node.js):

```bash
npm install @supabase/supabase-js
```

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Teste
const { data, error } = await supabase
  .from('admin')
  .select('*')
  .limit(1);

console.log(data, error);
```

### No Frontend (React):

```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

// Teste
const { data, error } = await supabase
  .from('cliente')
  .select('*')
  .limit(1);
```

## 📊 Passo 8: Verificar Dados

1. Na dashboard, clique em **Table Editor**
2. Selecione cada tabela para ver os dados
3. Você deve ver a empresa de teste e o admin criados

## 🚀 Próximos Passos

1. **Atualizar Controllers**: Modifique os controllers do backend para usar Supabase ao invés de Prisma/PostgreSQL local

2. **Criar Funções RPC**: Use o Supabase para criar procedures customizadas se necessário

3. **Backup Automático**: Configure backups na seção Settings → Backups

4. **Monitoramento**: Use o painel de logs para monitorar queries

## 🔗 Conexão Rápida

```typescript
// Exemplo completo para atualizar um cliente
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function registrarCliente(dados: any) {
  const { data, error } = await supabase
    .from('cliente')
    .insert([
      {
        produto_id: dados.produto_id,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        estado: dados.estado,
        cidade: dados.cidade,
        whatsapp: dados.whatsapp,
        termos_aceitos: true
      }
    ])
    .select();

  if (error) {
    throw new Error(`Erro ao registrar: ${error.message}`);
  }

  return data[0];
}
```

## 📞 Suporte

- **Documentação**: https://supabase.com/docs
- **Discord Community**: https://discord.supabase.io
- **Status Page**: https://status.supabase.com

---

**Dicas de Segurança:**
- ⚠️ Nunca exponha a `service_role` key publicamente
- ✅ Use `anon key` no frontend
- ✅ Use `service_role` apenas no backend com variáveis privadas
- ✅ Configure RLS para proteger dados sensíveis
