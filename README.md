## Discipline

Веб-приложение для спортсменов с регистрацией, челленджами, батлами и личным профилем.

## Локальный запуск

Сначала установи зависимости и запусти dev-сервер:

```bash
npm install
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Создай `.env.local` на основе [.env.example](/Users/a1/Documents/Projects/sport-app/.env.example:1):

```bash
cp .env.example .env.local
```

Обязательная переменная:

```bash
SESSION_SECRET=your-long-random-secret
DATABASE_URL=postgresql://sport_user:your-password@127.0.0.1:5432/sport_app
```

## Продакшн-деплой на VPS

Домен проекта:

```bash
alex-cosh.ru
```

IP сервера:

```bash
72.56.236.19
```

### 1. Подготовка сервера

```bash
sudo apt update
sudo apt install -y curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Загрузка проекта

```bash
sudo mkdir -p /var/www/sport-app
sudo chown -R $USER:$USER /var/www/sport-app
git clone <YOUR_REPOSITORY_URL> /var/www/sport-app
cd /var/www/sport-app
```

Если проект уже на сервере:

```bash
cd /var/www/sport-app
git pull
```

### 3. Настройка окружения

```bash
cp .env.example .env.local
nano .env.local
```

Заполни:

```bash
SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgresql://sport_user:replace-with-your-db-password@127.0.0.1:5432/sport_app
```

### 4. Сборка и запуск

```bash
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

После запуска приложение будет слушать `127.0.0.1:3000`.

### 5. Конфиг Nginx

Создай файл:

```bash
sudo nano /etc/nginx/sites-available/sport-app
```

Содержимое:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name alex-cosh.ru www.alex-cosh.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Активируй сайт:

```bash
sudo ln -s /etc/nginx/sites-available/sport-app /etc/nginx/sites-enabled/sport-app
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL

```bash
sudo certbot --nginx -d alex-cosh.ru -d www.alex-cosh.ru
```

### 7. Обновление приложения

```bash
cd /var/www/sport-app
git pull
npm install
npm run build
pm2 restart sport-app
```

## Что уже реализовано

- регистрация пользователя
- серверная cookie-сессия
- личный профиль
- локальное хранение пользователей в `data/users.json`

## Важно

- текущее хранилище пользователей файловое и подходит для первого этапа
- для реального роста проекта лучше перейти на PostgreSQL
- перед продакшном обязательно задай сильный `SESSION_SECRET`

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
