# ---- Build Stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --silent

# Copy source and build the React app
COPY . .
# REACT_APP_API_URL is injected at build time via docker-compose ARG
ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# ---- Runtime Stage (Nginx) ----
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built React app
COPY --from=build /app/build .

# Copy nginx config for React Router (handle client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
