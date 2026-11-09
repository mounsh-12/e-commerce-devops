
FROM nginxinc/nginx-unprivileged:alpine

USER root

# Apply available Alpine security updates
RUN apk upgrade --no-cache

# Copy application files
COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY script.js /usr/share/nginx/html/script.js

# Copy local product images
COPY images/ /usr/share/nginx/html/images/

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run as non-root user
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
