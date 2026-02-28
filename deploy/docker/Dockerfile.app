# ============================================================
# Stage 1: Install dependencies
# ============================================================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ============================================================
# Stage 2: Build the application
# ============================================================
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for public env vars needed at build time
ARG PUBLIC_POCKETBASE_URL=http://localhost:8090
ENV PUBLIC_POCKETBASE_URL=$PUBLIC_POCKETBASE_URL

RUN npm run build
RUN npm prune --production

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["node", "build"]
