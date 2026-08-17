# Cloud Run proving image for the existing Kurukoo application.
# The model is never downloaded during image build; configure local inference at runtime.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    KURUKOO_DISABLE_LISTEN=false \
    KURUKOO_SMOLLM2_LOCAL=false \
    SMOLLM2_MODEL=HuggingFaceTB/SmolLM2-1.7B-Instruct \
    SMOLLM2_FALLBACK_MODEL=HuggingFaceTB/SmolLM2-1.7B-Instruct \
    SMOLLM2_DTYPE=q4 \
    HF_HOME=/tmp/huggingface \
    HF_HUB_CACHE=/tmp/huggingface
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/views ./views
COPY --from=build /app/locales ./locales
COPY --from=build /app/models ./models
RUN mkdir -p /tmp/huggingface /tmp/uploads
EXPOSE 8080
CMD ["npm", "start"]
