FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund
COPY apps apps
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM caddy:2.11.8-alpine@sha256:f6228111e5fafa1a5238258d0858e103f10599b8d1659a146e7726681a002bb9 AS gateway
FROM axllent/mailpit@sha256:ed9b00c609e77e99c79b93f1178255ebc271868920f2c69a8d166bd5634ed10d AS mailbox
FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
WORKDIR /app
COPY --from=gateway /usr/bin/caddy /usr/local/bin/caddy
COPY --from=mailbox /mailpit /usr/local/bin/mailpit
COPY --from=build /app /app
COPY data/question-bank.initial.json data/
COPY deploy deploy
USER node
ENV NODE_ENV=production
EXPOSE 10000
CMD ["bash", "deploy/start-demo.sh"]
