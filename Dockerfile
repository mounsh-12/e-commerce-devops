
FROM nginxinc/nginx-unprivileged:alpine

# Apply available Alpine security updates
USER root
RUN apk upgrade --no-cache

# Copy application files with appropriate ownership
COPY --chown=nginx:nginx index.html /usr/share/nginx/html/index.html
COPY --chown=nginx:nginx style.css /usr/share/nginx/html/style.css
COPY --chown=nginx:nginx script.js /usr/share/nginx/html/script.js

# Copy custom Nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Switch back to the unprivileged Nginx user
USER nginx

# Nginx listens on 8080
EXPOSE 8080

# Container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
