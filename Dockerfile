FROM node:24 AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build
RUN npm install precompress && ./node_modules/.bin/precompress -t gz,br -e '**.gz,**.br,**.map,**.woff2' dist
RUN find dist -type f -name '*.map' -delete


FROM ghcr.io/polyfea/spa-base AS galleon-shell

EXPOSE 7105

COPY --from=build /workspace/dist/                              /spa/public/
COPY --from=build /workspace/node_modules/lit/                  /spa/public/imports/lit/
COPY --from=build /workspace/node_modules/lit-html/             /spa/public/imports/lit-html/
COPY --from=build /workspace/node_modules/lit-element/          /spa/public/imports/lit-element/
COPY --from=build /workspace/node_modules/@lit/reactive-element/ /spa/public/imports/@lit/reactive-element/
COPY --from=build /workspace/node_modules/tslib/                /spa/public/imports/tslib/

ENV OTEL_SERVICE_NAME=galleon-lit-grid-shell
ENV SPA_BASE_FALLBACK_DISABLED=true
ENV SPA_BASE_JSON_LOGGING=true

LABEL org.opencontainers.image.title="Galleon Lit Grid Shell"
LABEL org.opencontainers.image.description="K8s-native CSS Grid shell for the Polyfea ecosystem"
