 server {
      listen 80;
      server_name YOUR_SERVER_IP;

      # Serve frontend static files
      root /home/deploy/BrewSecure/brewsecure/dist;
      index index.html;

      # SPA fallback
      location / {
          try_files $uri $uri/ /index.html;
      }

      # Proxy API calls to Express
      location /api {
          proxy_pass http://localhost:3001;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }

      # Proxy Swagger docs
      location /api-docs {
          proxy_pass http://localhost:3001;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
      }
  }
