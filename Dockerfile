FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/*config* ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./

EXPOSE 3002

CMD ["npm", "run", "start"]
