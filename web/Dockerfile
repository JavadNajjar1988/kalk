FROM node:20-alpine AS dashboard_builder
WORKDIR /src
COPY front_dashboard/package.json front_dashboard/package-lock.json ./front_dashboard/
RUN cd front_dashboard && npm ci
COPY front_dashboard ./front_dashboard
# The backup JSON file ships with broken syntax in the source repo and is
# not referenced by code, but Rollup scans data/json/*.json via dynamic
# imports, so we replace it with a valid empty stub for the production build.
RUN echo '{ "nodes": [] }' > /src/front_dashboard/src/modules/definition-editor/data/json/specialty_training_backup.json
# Use a minimal production-only Vite config to avoid the project's manualChunks
# entries that point at non-existent modules.
COPY web/vite.config.dashboard.build.mjs /src/front_dashboard/vite.config.build.mjs
RUN cd front_dashboard && npx vite build --config vite.config.build.mjs

FROM node:20-alpine AS kalknegar_builder
WORKDIR /src
COPY front_kalknegar/package.json front_kalknegar/package-lock.json ./front_kalknegar/
RUN cd front_kalknegar && npm ci
COPY front_kalknegar ./front_kalknegar
# In this repo, kalknegar sets base '/kalknegar/' when NODE_ENV=development.
RUN cd front_kalknegar && NODE_ENV=development npm run build-only

FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=dashboard_builder /src/front_dashboard/dist /usr/share/nginx/html
COPY --from=kalknegar_builder /src/front_kalknegar/dist /usr/share/nginx/html/kalknegar
EXPOSE 3000
