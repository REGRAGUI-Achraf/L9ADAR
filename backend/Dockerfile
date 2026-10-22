FROM node:24-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

COPY src ./src

RUN mkdir -p /app/media && chown -R node:node /app

USER node
EXPOSE 3000

# Apply migrations first. If they fail, the container stops instead of running on a broken database.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
