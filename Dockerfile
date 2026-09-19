FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

# Non-root kullanıcı oluştur ve container'ı bu kullanıcıyla çalıştır
# (node:20-alpine imajında zaten "node" adında hazır bir kullanıcı var)
RUN mkdir -p logs src/logs && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "src/server.js"]