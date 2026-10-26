# SlotBack in one container: production build of the Next.js app.
# Used by docker-compose.yml for the local demo. Netlify does not use this file.

# The full Debian image already ships OpenSSL 3, which Prisma's migration engine needs.
FROM node:22-bookworm AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# Claim links, QR codes and page metadata use this URL. Pass the same value at runtime.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM build AS runtime
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# Apply migrations, then serve. The demo salon is created on the first demo login.
CMD ["sh", "-c", "pnpm db:deploy && pnpm start"]
