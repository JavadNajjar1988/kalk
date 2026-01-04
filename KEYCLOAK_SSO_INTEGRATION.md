# راهنمای ادغام Keycloak SSO

این راهنما نحوه ادغام Keycloak برای احراز هویت SSO را توضیح می‌دهد.

## مزایای استفاده از Keycloak

✅ **SSO (Single Sign-On)**: یک بار لاگین، دسترسی به تمام سیستم‌ها  
✅ **مدیریت کاربران متمرکز**: مدیریت کاربران، نقش‌ها و دسترسی‌ها در یک مکان  
✅ **امنیت بالا**: 2FA/MFA، Rate Limiting، Account Lockout  
✅ **Audit Logging**: لاگ کامل تمام فعالیت‌های احراز هویت  
✅ **OAuth2/OpenID Connect**: استانداردهای صنعتی  
✅ **Session Management**: مدیریت پیشرفته session  
✅ **Social Login**: امکان لاگین با Google, GitHub و غیره  

## معماری

```
┌─────────────┐
│  Frontend   │
│  (React)    │
└──────┬──────┘
       │
       │ 1. Redirect to Keycloak
       ▼
┌─────────────┐
│  Keycloak   │
│  (SSO)      │
└──────┬──────┘
       │
       │ 2. Validate & Issue Token
       ▼
┌─────────────┐
│  Backend    │
│  (FastAPI)  │
└─────────────┘
```

## مراحل نصب و راه‌اندازی

### 1. اضافه کردن Keycloak به Docker Compose

Keycloak به `docker-compose.yml` اضافه شده است.

### 2. راه‌اندازی Keycloak

```bash
# راه‌اندازی Keycloak
docker compose up -d keycloak

# مشاهده لاگ‌ها
docker compose logs -f keycloak
```

### 3. تنظیمات اولیه Keycloak

1. **ورود به کنسول مدیریت Keycloak**:
   - URL: http://localhost:9090
   - Username: `admin`
   - Password: `admin` (در production تغییر دهید!)

2. **ایجاد Realm**:
   - کلیک روی dropdown "master" در بالا سمت چپ
   - "Create Realm"
   - نام: `kalk`

3. **ایجاد Client**:
   - در Realm `kalk`، به "Clients" بروید
   - "Create client"
   - Client ID: `kalk-frontend`
   - Client Protocol: `openid-connect`
   - Root URL: `http://localhost:5173`
   - Valid Redirect URIs: `http://localhost:5173/*`
   - Web Origins: `http://localhost:5173`
   - Access Type: `public` (برای frontend)
   - Standard Flow Enabled: `ON`
   - Direct Access Grants Enabled: `ON` (برای API)

4. **ایجاد Client برای Backend**:
   - Client ID: `kalk-backend`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Service Accounts Enabled: `ON`
   - Valid Redirect URIs: `http://localhost:8000/*`
   - بعد از ایجاد، به تب "Credentials" بروید و "Secret" را کپی کنید

5. **ایجاد Roles**:
   - به "Realm Roles" بروید
   - ایجاد نقش‌ها: `ADMIN`, `OPERATOR`, `USER`

6. **ایجاد کاربر تست**:
   - به "Users" بروید
   - "Add user"
   - Username: `testuser`
   - Email: `test@example.com`
   - Email Verified: `ON`
   - به تب "Credentials" بروید
   - Password: یک رمز عبور قوی تنظیم کنید
   - Temporary: `OFF`
   - به تب "Role Mappings" بروید و نقش `USER` را اضافه کنید

### 4. تنظیمات Backend

متغیرهای محیطی را در `.env` تنظیم کنید:

```env
# Keycloak Settings
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=http://localhost:9090
KEYCLOAK_REALM=kalk
KEYCLOAK_CLIENT_ID=kalk-backend
KEYCLOAK_CLIENT_SECRET=<secret-from-keycloak>
KEYCLOAK_ADMIN_CLI_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_CLI_CLIENT_SECRET=<admin-cli-secret>

# Fallback to local auth if Keycloak is disabled
USE_KEYCLOAK=true
```

### 5. تنظیمات Frontend

در فایل `.env` یا `vite.config.ts`:

```env
VITE_KEYCLOAK_URL=http://localhost:9090
VITE_KEYCLOAK_REALM=kalk
VITE_KEYCLOAK_CLIENT_ID=kalk-frontend
```

## جریان احراز هویت

### Frontend Flow

1. کاربر روی دکمه "Login" کلیک می‌کند
2. Frontend به Keycloak redirect می‌شود
3. کاربر در Keycloak لاگین می‌کند
4. Keycloak یک Authorization Code برمی‌گرداند
5. Frontend این code را با Backend exchange می‌کند
6. Backend token را از Keycloak دریافت می‌کند
7. Frontend token را در memory نگه می‌دارد (نه localStorage!)

### Backend Flow

1. درخواست API با Bearer token می‌آید
2. Backend token را به Keycloak می‌فرستد برای validation
3. Keycloak اطلاعات کاربر و نقش‌ها را برمی‌گرداند
4. Backend دسترسی را بررسی می‌کند

## Migration از سیستم فعلی

سیستم به گونه‌ای طراحی شده که:
- اگر `USE_KEYCLOAK=false` باشد، از سیستم فعلی استفاده می‌کند
- اگر `USE_KEYCLOAK=true` باشد، از Keycloak استفاده می‌کند
- می‌توانید به تدریج migrate کنید

## نکات امنیتی

⚠️ **مهم**: 
- در production حتماً HTTPS استفاده کنید
- رمز عبور admin Keycloak را تغییر دهید
- Client Secret را در `.env` نگه دارید و commit نکنید
- از HttpOnly Cookies برای token استفاده کنید (نه localStorage)

## Troubleshooting

### مشکل: Keycloak در دسترس نیست
- بررسی کنید که container در حال اجرا است: `docker compose ps`
- لاگ‌ها را بررسی کنید: `docker compose logs keycloak`

### مشکل: Redirect URI mismatch
- در Keycloak Client settings، Valid Redirect URIs را بررسی کنید
- باید دقیقاً با URL که از آن redirect می‌شود مطابقت داشته باشد

### مشکل: CORS Error
- در Keycloak Client settings، Web Origins را تنظیم کنید
- در Backend، CORS_ORIGINS را بررسی کنید

## منابع بیشتر

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenID Connect Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth2 Spec](https://oauth.net/2/)

