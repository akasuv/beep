# syntax=docker/dockerfile:1

FROM node:22-slim AS build
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY package.json pnpm-lock.yaml tsconfig.json tsup.config.ts ./
COPY src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm build


FROM node:22-slim AS run
WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PORT=8080

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server/index.js"]

