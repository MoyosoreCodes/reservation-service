FROM node:20-alpine AS base
WORKDIR /app

# =====================
# Dependencies stage
# =====================
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm i

# =====================
# Development stage
# =====================
FROM base AS development
COPY package.json package-lock.json ./
RUN npm i
COPY . .
CMD ["sh", "-c", "npm run migration:run && npm run start"]

# =====================
# Build stage
# =====================
FROM base AS build
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npm run build

# =====================
# Production stage
# =====================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
COPY docker-entrypoint.sh .
ENTRYPOINT ["./docker-entrypoint.sh"]