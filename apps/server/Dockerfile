FROM node:24.22.0-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY patches ./patches
COPY packages/protocol ./packages/protocol
COPY packages/database ./packages/database
COPY packages/application ./packages/application
COPY packages/api ./packages/api
COPY apps/server ./apps/server

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm exec turbo run build --filter=@usepreface/server
RUN pnpm --filter @usepreface/server deploy --prod --legacy /out/server

FROM node:24.22.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/server ./
RUN chmod +x dist/main.js && ln -s /app/dist/main.js /usr/local/bin/preface
USER node
EXPOSE 8080
ENTRYPOINT ["node", "dist/main.js"]
CMD ["serve"]
