
FROM nginx:alpine

# Update Alpine packages to include available security fixes
RUN apk upgrade --no-cache

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy E-commerce application files
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

