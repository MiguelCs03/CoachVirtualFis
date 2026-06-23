#!/bin/bash
set -e

echo "=== Construyendo imagen backend ==="
sudo docker build -t coach-backend .

echo ""
echo "=== Deteniendo contenedor anterior (si existe) ==="
sudo docker rm -f coach-backend 2>/dev/null || true

echo ""
echo "=== Iniciando contenedor ==="
sudo docker run -d \
  --name coach-backend \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file .env \
  -e DEBUG=False \
  -e ALLOWED_HOSTS='*' \
  -e FRONTEND_URL='https://coachvirtualfis.netlify.app' \
  -e CORS_ALLOWED_ORIGINS='https://coachvirtualfis.netlify.app' \
  -e CSRF_TRUSTED_ORIGINS='https://coachvirtualfis.netlify.app' \
  -e CORS_ALLOW_ALL_ORIGINS=False \
  coach-backend

echo ""
echo "=== Contenedor corriendo ==="
sudo docker ps
echo ""
echo "=== Logs ==="
sudo docker logs coach-backend --tail 20
