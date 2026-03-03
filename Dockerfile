FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build


FROM nginx:1.27-alpine
# Custom nginx config with gzip & caching
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built React app to Nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html
# Copy entrypoint script for runtime env injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
