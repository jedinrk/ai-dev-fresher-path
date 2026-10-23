FROM node:24-alpine AS build
WORKDIR /app
COPY package.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm install
COPY client client
COPY server server
RUN npm run build --workspace client

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY server/package.json server/
RUN npm install --workspace server --omit=dev
COPY server server
COPY content content
COPY --from=build /app/client/dist client/dist

EXPOSE 3000
CMD ["node", "server/src/index.js"]
