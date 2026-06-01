# 🚀 Hostinger VPS Deployment Guide (ATS-CZM)

This guide provides step-by-step instructions for hosting the Applicant Tracking System (ATS-CZM) on a Hostinger VPS using a LEMP stack (Linux, Nginx, MySQL, PHP).

## 📋 Prerequisites
- **VPS OS:** Ubuntu 22.04 or 24.04 (Recommended).
- **DNS:** Your domain pointed to the VPS IP address.
- **SSH Access:** Root access to your server.

---

## Step 1: Server Preparation
Connect to your VPS via SSH and update the system:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip zip nginx
```

---

## Step 2: Backend Setup (Laravel)

### 1. Install PHP 8.2 & Extensions
Laravel 12 requires PHP 8.2+.
```bash
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-curl php8.2-xml php8.2-mbstring php8.2-zip php8.2-bcmath php8.2-gd
```

### 2. Install & Configure MySQL
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation # Follow prompts to set root password
```
Create the database for your ATS:
```bash
sudo mysql -u root -p
# Inside MySQL shell:
CREATE DATABASE ats_db;
CREATE USER 'ats_user'@'localhost' IDENTIFIED BY 'YourStrongPassword';
GRANT ALL PRIVILEGES ON ats_db.* TO 'ats_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 4. Deploy Laravel Code
```bash
cd /var/www
sudo git clone <your-repo-url> ats-czm
sudo chown -R $USER:$USER /var/www/ats-czm
cd /var/www/ats-czm/backend

composer install --optimize-autoloader --no-dev
cp .env.example .env
nano .env
```
**Update these keys in `.env`:**
- `APP_URL=https://api.yourdomain.com`
- `DB_DATABASE=ats_db`
- `DB_USERNAME=ats_user`
- `DB_PASSWORD=YourStrongPassword`
- `MAIL_...` (Refer to Gmail SMTP settings)

**Finalize Backend:**
```bash
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan optimize

# Set Permissions (CRITICAL)
sudo chown -R www-data:www-data /var/www/ats-czm/backend/storage
sudo chown -R www-data:www-data /var/www/ats-czm/backend/bootstrap/cache
```

---

## Step 3: Frontend Setup (React + Vite)

### 1. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Deploy & Build Frontend
```bash
cd /var/www/ats-czm/frontend
npm install
nano .env
```
**Update `.env`:**
- `VITE_API_BASE_URL=https://api.yourdomain.com` (Must match the backend URL)

**Build for production:**
```bash
npm run build
```
This creates a `dist` folder which we will serve via Nginx.

---

## Step 4: Nginx Configuration

You need two server blocks: one for the API and one for the Frontend.

### 1. Backend Config (`/etc/nginx/sites-available/ats-api`)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/ats-czm/backend/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }
}
```

### 2. Frontend Config (`/etc/nginx/sites-available/ats-frontend`)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/ats-czm/frontend/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Enable sites and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/ats-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ats-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 5: SSL (HTTPS) & Security
It is mandatory to use HTTPS to avoid "Mixed Content" errors between your React frontend and Laravel API.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## 🛠️ Summary Checklist
| Component | Action | Path/Command |
| :--- | :--- | :--- |
| **Backend** | Set Permissions | `chown -R www-data:www-data storage` |
| **Backend** | Optimize | `php artisan optimize` |
| **Frontend** | Build | `npm run build` |
| **Nginx** | SPA Routing | `try_files $uri $uri/ /index.html` |
| **SSL** | Security | `sudo certbot --nginx` |
| **CORS** | Config | Check `SANCTUM_STATEFUL_DOMAINS` in `.env` |
