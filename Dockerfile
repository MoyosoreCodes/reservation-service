FROM node:20-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["sh", "-c", "npm run migration:run && npm run start"]

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "npm run migration:run && npm run start"]