# ------------------------------------------------
#  Integration‑Service
# ------------------------------------------------
    FROM node:18-alpine AS build
    WORKDIR /app
    
    COPY ../../tsconfig.json ./
    COPY package*.json ./
    RUN npm ci --ignore-scripts
    
    COPY . .
    RUN npm run build --if-present
    
    FROM node:18-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    
    COPY --from=build /app/package*.json ./
    RUN npm ci --omit=dev
    COPY --from=build /app/dist ./dist
    
    RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
    USER nodejs
    
    EXPOSE 3003
    CMD ["node", "dist/index.js"]
    