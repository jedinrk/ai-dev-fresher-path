FROM node:24-slim AS client-build
WORKDIR /app
COPY package.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm install --workspace client
COPY client client
RUN npm run build --workspace client

FROM node:24-slim AS server-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY server/package.json server/
RUN npm install --workspace server --omit=dev

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=server-deps /app/node_modules node_modules
COPY --from=server-deps /app/package.json ./
COPY server server
COPY content content
COPY --from=client-build /app/client/dist client/dist

EXPOSE 3000
CMD ["node", "server/src/index.js"]
