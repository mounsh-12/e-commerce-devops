
FROM nginxinc/nginx-unprivileged:alpine

# Apply available Alpine security updates
USER root
RUN apk upgrade --no-cache

# Copy application files as root-owned resources
COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY script.js /usr/share/nginx/html/script.js

# Copy Nginx configuration as a root-owned resource
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run Nginx without root privileges
USER nginx

# Nginx listens on port 8080
EXPOSE 8080

# Container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
