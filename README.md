# Bot de Apostas Sociais no Discord

Apostas sem dinheiro real entre amigos, com fichas virtuais, ranking e loja de resgate por pontos de prestígio.

## Setup

1. `npm install`
2. Copie `.env.example` para `.env` e preencha:
   - `DISCORD_TOKEN` / `DISCORD_CLIENT_ID` — em https://discord.com/developers/applications
   - `DISCORD_GUILD_ID` — ID do seu servidor (modo desenvolvedor no Discord > clicar direito no servidor > Copiar ID)
   - `DATABASE_URL` — string de conexão do Postgres (Railway gera isso automaticamente)
3. Rode o `schema.sql` no seu banco Postgres:
   ```
   psql $DATABASE_URL -f schema.sql
   ```
4. Registre os comandos: `npm run deploy-commands`
5. Suba o bot: `npm start`

## Deploy no Railway

1. Crie um projeto no Railway, adicione um serviço Postgres.
2. Adicione um serviço a partir deste repositório (GitHub) ou via CLI.
3. Configure as variáveis de ambiente do `.env.example` no serviço do bot (`DATABASE_URL` o Railway já injeta automaticamente ao linkar o Postgres).
4. Rode `npm run deploy-commands` uma vez (localmente ou via Railway shell) para registrar os comandos.
5. O `npm start` sobe o bot.

## Comandos

| Comando | Descrição | Quem usa |
|---|---|---|
| `/saldo` | Mostra fichas e prestígio | Todos |
| `/criar-evento` | Cria um evento de apostas | Admin |
| `/apostar` | Aposta fichas em uma opção | Todos |
| `/eventos` | Lista eventos abertos e pool atual | Todos |
| `/resultado` | Marca vencedor e liquida apostas | Admin |
| `/ranking` | Top 10 por fichas ou prestígio | Todos |
| `/loja` | Lista produtos resgatáveis | Todos |
| `/resgatar` | Troca prestígio por produto | Todos |

## Mecânica

- **Odds:** pari-mutuel — pool dividido proporcionalmente entre vencedores.
- **Prestígio:** 10% de todo ganho em fichas vira prestígio automaticamente (não gastável em apostas, só na loja).
- **Prêmios:** resgate por desempenho (loja), não por sorteio — qualquer usuário com prestígio suficiente pode resgatar.
- **Entrega:** resgates ficam `pending` — a logística de entrega do produto físico é combinada manualmente pelo grupo, fora do bot.

## Ainda não implementado (próximos passos sugeridos)

- Atribuição automática do cargo "líder da semana" no Discord (precisa de `GuildMembers` intent + lógica de agregação semanal do ledger)
- Comando `/ajuda` explicando a mecânica pari-mutuel
- Comando admin para popular a tabela `products`
- Cron/job para fechar automaticamente eventos vencidos que ninguém liquidou manualmente
