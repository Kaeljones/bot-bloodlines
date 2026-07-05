# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npm ci

COPY src ./src

RUN npm run build
RUN npx prisma generate

# --- Production Stage ---
FROM node:22-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

ENV NODE_ENV=production

CMD ["node", "dist/app.js"]
