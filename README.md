# Garcia Pedro Teleka — Site do Escritor + Loja

Next.js 14 (App Router) + React + Tailwind CSS + Supabase.

## Arrancar

```bash
npm install
cp .env.example .env.local   # preencher as chaves do Supabase
npm run dev
```

Sem Supabase configurado, o site mostra dados de demonstração e o botão "Comprar" abre o WhatsApp.

## Configurar o Supabase (uma vez)

1. Crie um projeto em supabase.com.
2. **Authentication → Users → Add user**: crie o utilizador do autor (email + palavra-passe, marque *Auto Confirm User*).
3. **SQL Editor**, por esta ordem:
   1. `supabase/schema.sql` — site, segurança, Storage. Antes de executar, **descomente a linha `insert into public.admins`** e ponha o email do autor.
   2. `supabase/loja.sql` — carrinho, pedidos, pagamentos, entregas, stock e livros digitais.
4. **Project Settings → API**: copie *Project URL* e a chave *anon* para `.env.local`.
5. Para livros digitais: copie também a chave **service_role** para `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` (só no servidor; nunca a partilhe nem a ponha em variáveis `NEXT_PUBLIC_`).
6. **Authentication → Providers → Email**: desative "Allow new users to sign up".
7. Reinicie `npm run dev` (apague a pasta `.next` se atualizou de uma versão anterior).

Se aparecer "Sem permissão": execute `supabase/make_admin.sql` com o seu email.

## Como o cliente compra (sem criar conta)

1. Escolhe os livros e carrega em **Comprar** (vão para o carrinho; o carrinho fica guardado no navegador).
2. Preenche nome, telefone e, se houver livros físicos, escolhe **levantamento** ou **entrega** (com zona e preço).
3. Escolhe a forma de pagamento e confirma. Recebe um **código** (ex.: `GPT-0042`).
4. Vê as instruções de pagamento e pode **enviar o comprovativo** (foto/PDF) na hora.
5. Acompanha o pedido a qualquer momento em **Acompanhar pedido** com o código + telefone.
6. Livros digitais: o **download** aparece no pedido assim que o autor confirma o pagamento.

O preço, o stock e as taxas são sempre validados na base de dados (o cliente não consegue alterá-los).

## Área reservada do autor

No cabeçalho (**Área do Autor**) ou no rodapé (**Área reservada**). Entra só com as credenciais do autor. Abas:

- **Resumo** — pedidos novos, vendas do mês e totais, pedidos por estado, livros mais vendidos, alertas de stock baixo.
- **Pedidos** — lista com filtros e pesquisa; abrir um pedido mostra cliente, itens, entrega, comprovativo; botões para confirmar pagamento, iniciar preparação, concluir ou cancelar (repõe o stock), nota interna, **falar com o cliente no WhatsApp** com mensagem pronta e **exportar para Excel (CSV)**. Chega um aviso em tempo real a cada novo pedido.
- **Livros** — formato (físico / digital / ambos), preços, ficheiro digital privado, controlo de stock, capa, amostra, destaque.
- **Pagamentos** — IBAN, Multicaixa Express, dinheiro, outros (com instruções; ativar/desativar).
- **Entregas** — levantamento, entregas e **zonas com preços**.
- **Vídeos**, **Galeria**, **Informações** — conteúdo do site.

## Segurança

- Leitura pública só do que é público; escrita só para emails da tabela `admins` (RLS + `is_admin()`).
- Pedidos: o cliente só cria/consulta via funções seguras (`create_order`, `get_order`, `attach_proof`); ninguém lê a tabela de pedidos diretamente.
- Comprovativos e livros digitais ficam em armazenamento **privado**; o download só é libertado pelo servidor se o pedido estiver pago.
- Proteção básica contra spam (campo escondido). Para tráfego grande, ative também o CAPTCHA do Supabase Auth ou limite de pedidos.

## Estrutura

- `app/page.tsx` — site público · `app/api/download` — download seguro de livros digitais
- `components/shop/` — carrinho, checkout, acompanhamento de pedido
- `components/admin/` — login, painel, pedidos, resumo, gestores
- `components/ui/` — barra de progresso, toasts, janelas
- `lib/` — Supabase, dados, loja, estados dos pedidos
- `supabase/` — `schema.sql`, `loja.sql`, `make_admin.sql`

## Instalar como app (PWA)

O site pode ser instalado no telemóvel e no computador:

- **Android / Chrome / Edge**: aparece um convite "Instale o app" e o botão **Instalar app** no menu e no rodapé.
- **iPhone / iPad**: o botão **Instalar app** mostra o passo a passo (Safari → Partilhar → Adicionar ao ecrã principal).
- Requer **HTTPS** (Vercel já fornece). O service worker só é ativo em produção (`npm run build && npm start` ou deploy).
- Ficheiros: `app/manifest.ts`, `public/sw.js`, `public/offline.html`, `public/icons/*`, `components/pwa/PWAProvider.tsx`.
- Páginas e dados vêm sempre da rede (stock/preços atuais); sem internet mostra uma página "Sem ligação".

## Segurança das chaves

Nunca envie o `.env` para o GitHub (já está no `.gitignore`). Use `.env.local` localmente e as *Environment Variables* na Vercel.
