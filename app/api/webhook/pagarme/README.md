# Configuração do Webhook Pagar.me

## URL do endpoint

```
https://SEU-DOMINIO.vercel.app/api/webhook/pagarme
```

Em desenvolvimento local, use ngrok ou Cloudflare Tunnel para expor localhost.

## Como configurar no painel Pagar.me

1. Acesse **dash.pagar.me** → **Configurações** → **Webhooks**
2. Clique em **"Novo webhook"**
3. **URL**: `https://SEU-DOMINIO.vercel.app/api/webhook/pagarme`
4. **Método**: POST
5. **Eventos** a ativar:
   - `order.paid`
   - `order.payment_failed`
   - `order.canceled`
   - `charge.paid`
   - `charge.payment_failed`
6. Após salvar, copie o **Webhook Secret** gerado
7. Adicione ao `.env.local` e nas variáveis da Vercel:
   ```
   PAGARME_WEBHOOK_SECRET=seu_secret_aqui
   ```

## Eventos tratados

| Evento                     | Ação                                               |
|----------------------------|----------------------------------------------------|
| `order.paid`               | Marca pagamento como `paid`, ativa assinatura      |
| `charge.paid`              | Idem (evento alternativo do Pagar.me)              |
| `order.payment_failed`     | Marca pagamento como `failed`                      |
| `charge.payment_failed`    | Idem                                               |
| `order.canceled`           | Marca pagamento como `failed`                      |
| `subscription.deactivated` | Cancela assinatura (planos recorrentes Pagar.me)   |
| `subscription.canceled`    | Idem                                               |

## Testando localmente com ngrok

```bash
# Instale ngrok: https://ngrok.com
ngrok http 3000

# A URL gerada será algo como:
# https://abc123.ngrok-free.app/api/webhook/pagarme
# Use essa URL no painel Pagar.me (sandbox)
```

## Segurança

- A assinatura HMAC-SHA256 é validada em **todas** as requisições
- Respostas com assinatura inválida retornam `401`
- Idempotência: pagamentos já marcados como `paid` são ignorados
- Sempre retorna `200` ao Pagar.me para evitar retentativas desnecessárias
