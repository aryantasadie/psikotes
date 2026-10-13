#!/usr/bin/env bash
set -e

PUBLIC_IP=$(curl -s ifconfig.me || echo "139.190.102.5")
DEFAULT_SSLIP="$(echo $PUBLIC_IP | tr '.' '-').sslip.io"
DOMAIN_NAME=${1:-$DEFAULT_SSLIP}
EMAIL_ADDR=${2:-"admin@${DOMAIN_NAME}"}

echo "======================================================"
echo "🔒 MENGAKTIFKAN SSL HTTPS GRATIS UNTUK: ${DOMAIN_NAME}"
echo "======================================================"

# 1. Update konfigurasi Nginx dengan server_name domain
sudo bash -c "cat << EOF > /etc/nginx/sites-available/psikotes
server {
    listen 80;
    server_name ${DOMAIN_NAME} ${PUBLIC_IP};

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;

        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF"

sudo nginx -t
sudo systemctl reload nginx

# 2. Request sertifikat SSL gratis dari Let's Encrypt via Certbot
sudo certbot --nginx -d "${DOMAIN_NAME}" --non-interactive --agree-tos --register-unsafely-without-email --redirect

# 3. Update NEXTAUTH_URL di .env menjadi https://
if [ -f "/var/www/psikotes-app/.env" ]; then
  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${DOMAIN_NAME}\"|g" /var/www/psikotes-app/.env
fi

# 4. Restart aplikasi di PM2 agar membaca NEXTAUTH_URL terbaru
pm2 restart psikotes

echo "======================================================"
echo "✅ HTTPS BERHASIL DIAKTIFKAN!"
echo "🔒 Buka Website Anda (Kamera & Layar Aktif) di:"
echo "👉 https://${DOMAIN_NAME}"
echo "======================================================"
