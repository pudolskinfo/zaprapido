# ZapRápido - MVP WhatsApp SaaS (multi-tenant)

MVP completo para prestadores de serviço (ar-condicionado) com automação via WhatsApp Cloud API, painel operacional e base multi-tenant em Supabase.

## ✅ Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage) com RLS
- Integração WhatsApp Cloud API via webhooks (Node runtime)
- Endpoints prontos para orquestração por n8n

## 📦 Estrutura principal
- `app/(auth)`: login e signup
- `app/(dashboard)`: dashboard, kanban e agenda
- `app/api/whatsapp/*`: webhook e envio outbound
- `app/api/appointments`: criação de agendamentos
- `supabase/migrations`: schema + RLS

## 🧠 Fluxo do bot (comportamento)
1. Primeira interação → envia menu com 3 opções (Limpeza, Instalação, Manutenção).
2. Se usuário responder 1/2/3 → salva `service_type` e pergunta o bairro.
3. Depois pergunta urgência (Hoje/Essa semana/Sem pressa).
4. Ao final → marca lead como `QUALIFIED` e sugere atendimento humano.
5. `handoff_human = true` se usuário mencionar “desconto”/“valor” ou se responder texto livre em etapa que exige número.

## ⚙️ Configuração

### 1) Variáveis de ambiente
Crie o arquivo `.env.local` usando o exemplo:

```bash
cp .env.example .env.local
```

Preencha com suas chaves do Supabase e WhatsApp:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=v20.0
```

### 2) Supabase (schema + RLS)
Execute a migration `supabase/migrations/0001_init.sql` no Supabase SQL Editor.

### 3) Configurar Auth (Supabase)
- Habilite autenticação por email/senha.
- No signup, a API `/api/provision` cria o tenant e perfil do usuário.

### 4) WhatsApp Cloud API
1. Crie o app no Meta Developers.
2. Configure um número de WhatsApp Cloud.
3. No webhook, use:
   - **Callback URL**: `https://<seu-host>/api/whatsapp/webhook`
   - **Verify token**: valor de `WHATSAPP_VERIFY_TOKEN`
4. Ative o campo **messages** na assinatura do webhook.

### 5) Mapear phone_number_id → tenant
Crie registros na tabela `tenant_channels`:

```sql
insert into tenant_channels (tenant_id, phone_number_id, waba_id, display_phone)
values ('<tenant_uuid>', '<phone_number_id>', '<waba_id>', '+55 11 99999-9999');
```

## 🧪 Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 👀 Como visualizar o painel

1. Abra `http://localhost:3000`.
2. Clique em **Criar conta** e registre uma empresa.
3. Após o signup, você será redirecionado para `/dashboard`.
4. Para ver dados reais:
   - Cadastre um `tenant_channels` (mapeando `phone_number_id`).
   - Envie mensagens via webhook para criar leads.
5. Navegação rápida:
   - **Dashboard** → KPIs dos últimos 7 dias.
   - **Leads** → Kanban do funil com status.
   - **Agenda** → lista de agendamentos.

## 🔌 Testes de webhook (curl)

### Verificação (GET)

```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=12345"
```

### Envio de mensagem (POST)

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [
      {
        "changes": [
          {
            "value": {
              "metadata": { "phone_number_id": "123456" },
              "contacts": [
                { "wa_id": "5511999999999", "profile": { "name": "Cliente Teste" } }
              ],
              "messages": [
                {
                  "id": "wamid.HBg...",
                  "from": "5511999999999",
                  "timestamp": "1700000000",
                  "type": "text",
                  "text": { "body": "1" }
                }
              ]
            }
          }
        ]
      }
    ]
  }'
```

## ✅ Como testar (passo a passo)

### 1) Testar o webhook GET (verificação)

```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=12345"
```

### 2) Testar recebimento de mensagem (POST)

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [
      {
        "changes": [
          {
            "value": {
              "metadata": { "phone_number_id": "123456" },
              "contacts": [
                { "wa_id": "5511999999999", "profile": { "name": "Cliente Teste" } }
              ],
              "messages": [
                {
                  "id": "wamid.HBg...",
                  "from": "5511999999999",
                  "timestamp": "1700000000",
                  "type": "text",
                  "text": { "body": "1" }
                }
              ]
            }
          }
        ]
      }
    ]
  }'
```

### 3) Testar envio outbound

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{ "tenantId": "<tenant_uuid>", "to": "5511999999999", "body": "Olá! Confirme seu endereço, por favor." }'
```

### 4) Testar criação de agendamento

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{ "tenantId": "<tenant_uuid>", "leadId": "<lead_uuid>", "startAt": "2025-01-10T10:00:00Z", "status": "scheduled" }'
```

## 📚 Exemplo de payload oficial (WhatsApp)

```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "metadata": { "phone_number_id": "123456" },
            "contacts": [
              { "wa_id": "5511999999999", "profile": { "name": "Cliente" } }
            ],
            "messages": [
              {
                "id": "wamid.HBg...",
                "from": "5511999999999",
                "timestamp": "1712345678",
                "type": "text",
                "text": { "body": "Quero agendar" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 🧩 Endpoints prontos para n8n
- `POST /api/whatsapp/send` → envia mensagem outbound e registra no DB.
- `POST /api/appointments` → cria agendamento e retorna o registro.

## ✅ Deploy
Qualquer ambiente compatível com Next.js 14 (Vercel, Render, etc).

Certifique-se de configurar as variáveis de ambiente e apontar o webhook para `/api/whatsapp/webhook`.
