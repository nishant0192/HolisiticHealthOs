# services/api-gateway/Dockerfile
# ------------------------------------------------
    FROM node:18-alpine AS build
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build   # tsc
    
    FROM node:18-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    COPY --from=build /app/package*.json ./
    RUN npm ci --omit=dev
    COPY --from=build /app/dist ./dist
    RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
    USER nodejs
    EXPOSE 3000
    CMD ["node", "dist/index.js"]
    