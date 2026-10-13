#!/usr/bin/env bash
set -e

echo "======================================================"
echo "🚀 MEMULAI INSTALASI OTOMATIS SERVER CBT PSIKOTES HRP"
echo "======================================================"

# 1. Buat Swap Memory 4GB (Agar RAM 2GB tidak pernah penuh saat build)
if [ ! -f /swapfile ]; then
  echo "📦 [1/7] Membuat Swap Memory 4GB..."
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "✅ Swap 4GB berhasil diaktifkan!"
else
  echo "✅ [1/7] Swap Memory sudah aktif."
fi

# 2. Update Ubuntu & Install Paket Dasar + Keamanan (Nginx, UFW, Fail2Ban, Certbot)
echo "📦 [2/7] Mengupdate sistem & menginstall Nginx, Git, Firewall, Fail2Ban..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl git nginx ufw fail2ban build-essential certbot python3-certbot-nginx

# 3. Install Node.js 20 LTS & PM2
if ! command -v node &> /dev/null; then
  echo "📦 [3/7] Menginstall Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
else
  echo "✅ [3/7] Node.js sudah terinstall ($(node -v))."
fi

sudo npm install -g pm2

# 4. Clone / Update Repository dari GitHub
echo "📦 [4/7] Mengunduh kode aplikasi dari GitHub..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

if [ ! -d "/var/www/psikotes-app" ]; then
  git clone https://github.com/aryantasadie/psikotes.git /var/www/psikotes-app
else
  cd /var/www/psikotes-app
  git pull origin main
fi

cd /var/www/psikotes-app

# Deteksi IP Publik VPS otomatis
PUBLIC_IP=$(curl -s ifconfig.me || echo "139.190.102.5")
DOMAIN_NAME=${1:-$PUBLIC_IP}

if [[ "$DOMAIN_NAME" == "$PUBLIC_IP" ]]; then
  APP_URL="http://${PUBLIC_IP}"
else
  APP_URL="https://${DOMAIN_NAME}"
fi

# Buat file .env jika belum ada
if [ ! -f "/var/www/psikotes-app/.env" ]; then
  echo "⚙️ Membuat konfigurasi .env..."
  cat <<EOF > /var/www/psikotes-app/.env
DATABASE_URL="postgresql://postgres.wevtbcuigimgcfjzvyvn:2MdPYXvw%21_6wM%23j@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=10"
DIRECT_URL="postgresql://postgres.wevtbcuigimgcfjzvyvn:2MdPYXvw%21_6wM%23j@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="rahasianegara123!@#_hrpublik_production_2026"
NEXTAUTH_URL="${APP_URL}"
NODE_ENV="production"
EOF
fi

# Buat folder private_uploads
mkdir -p /var/www/psikotes-app/private_uploads/keamanan

# 5. Install Dependencies & Build Next.js
echo "🔨 [5/7] Menginstall dependencies & melakukan build aplikasi Next.js..."
npm install
npx prisma generate
npx next build

# 6. Jalankan dengan PM2
echo "🚀 [6/7] Menjalankan server aplikasi dengan PM2..."
pm2 delete psikotes 2>/dev/null || true
pm2 start npm --name "psikotes" -- start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true

# 7. Konfigurasi Nginx Reverse Proxy (Support Live Stream SSE & Upload) + Firewall
echo "🌐 [7/7] Mengatur Nginx & Keamanan Firewall..."
sudo bash -c "cat << 'EOF' > /etc/nginx/sites-available/psikotes
server {
    listen 80;
    server_name _;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Wajib untuk Live Stream Kamera (SSE) agar real-time tanpa delay
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF"

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/psikotes /etc/nginx/sites-enabled/psikotes
sudo nginx -t
sudo systemctl restart nginx

# Aktifkan Firewall UFW & Fail2Ban
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

echo "======================================================"
echo "✅ INSTALASI SELESAI! WEBSITE PSIKOTES SUDAH AKTIF!"
echo "🌐 Akses Website Anda di: ${APP_URL}"
echo "======================================================"
