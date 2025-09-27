# syntax = docker/dockerfile:1

# Usa la versión de Node.js que necesitas
ARG NODE_VERSION=20.19.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

# Establece el entorno de producción
ENV NODE_ENV="production"

# Etapa de construcción para instalar dependencias
FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package-lock.json package.json ./
RUN npm ci

COPY . .

# Etapa final de producción
FROM base

# Copia la aplicación y las dependencias de la etapa de construcción
COPY --from=build /app /app

# 🗑️ ELIMINADO: Ya no necesitamos crear el directorio /data ni el volumen para SQLite

# Expone el puerto que nuestra app usa internamente
EXPOSE 3000

# 🗑️ ELIMINADO: ¡La línea que sobrescribía nuestra DATABASE_URL!

# ✅ CORREGIDO: El comando de arranque simple y estándar para una app de Node.js
CMD [ "node", "server.js" ]