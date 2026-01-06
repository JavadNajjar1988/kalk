# راهنمای دسترسی گرافیکی به دیتابیس

## 🎯 روش‌های دسترسی گرافیکی به PostgreSQL

---

## 1️⃣ VS Code Extensions (پیشنهادی)

### روش 1: SQLTools (پیشنهادی - قبلاً تنظیم شده!)

#### نصب:
1. در VS Code، به Extensions بروید (`Ctrl+Shift+X`)
2. جستجو کنید: `SQLTools`
3. نصب کنید: `mtxr.sqltools` (توسط Matheus Teixeira)
4. جستجو کنید: `SQLTools PostgreSQL`
5. نصب کنید: `mtxr.sqltools-driver-pg` (PostgreSQL Driver)

#### اتصال:
1. `Ctrl+Shift+P` → `SQLTools: Add New Connection`
2. انتخاب `PostgreSQL`
3. اطلاعات زیر را وارد کنید:

```
Name: kalk
Server: localhost
Port: 5432
Database: kalk
Username: postgres
Password: postgres
```

#### استفاده:
- مشاهده جداول: کلیک روی آیکون SQLTools در sidebar → باز کردن اتصال → Tables
- اجرای Query: `Ctrl+Shift+P` → `SQLTools: New Query`
- مشاهده داده‌ها: راست کلیک روی جدول → `Show Table Records`

---

### روش 2: PostgreSQL Extension رسمی Microsoft

#### نصب:
1. `SQLTools` - `mtxr.sqltools`
2. `SQLTools PostgreSQL/Redshift` - `mtxr.sqltools-driver-pg`

#### اتصال:
1. `Ctrl+Shift+P` → `SQLTools: Add New Connection`
2. انتخاب `PostgreSQL`
3. وارد کردن اطلاعات:

```json
{
  "name": "Kalk PostgreSQL",
  "driver": "PostgreSQL",
  "server": "localhost",
  "port": 5432,
  "database": "kalk",
  "username": "postgres",
  "password": "postgres"
}
```

---

## 2️⃣ pgAdmin (ابزار رسمی PostgreSQL)

### نصب:
```powershell
# با Chocolatey
choco install pgadmin4

# یا دانلود از:
# https://www.pgadmin.org/download/
```

### اتصال:
1. اجرای pgAdmin
2. راست کلیک روی `Servers` → `Register` → `Server`
3. در تب `General`:
   - Name: `Kalk Database`
4. در تب `Connection`:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kalk`
   - Username: `postgres`
   - Password: `postgres`
5. Save

---

## 3️⃣ DBeaver (رایگان و قدرتمند)

### نصب:
```powershell
# با Chocolatey
choco install dbeaver

# یا دانلود از:
# https://dbeaver.io/download/
```

### اتصال:
1. اجرای DBeaver
2. `Database` → `New Database Connection`
3. انتخاب `PostgreSQL`
4. وارد کردن:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kalk`
   - Username: `postgres`
   - Password: `postgres`
5. Test Connection → Finish

---

## 4️⃣ TablePlus (زیبا و سریع)

### نصب:
```powershell
# با Chocolatey
choco install tableplus

# یا دانلود از:
# https://tableplus.com/
```

### اتصال:
1. اجرای TablePlus
2. `Create a new connection` → `PostgreSQL`
3. وارد کردن:
   - Name: `Kalk`
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: `postgres`
   - Database: `kalk`
4. Connect

---

## 🔧 تنظیمات Connection برای Docker

### نکته مهم:
اگر دیتابیس در Docker است، از `localhost` استفاده کنید (نه `db`) چون پورت `5432` به host map شده است.

### بررسی پورت:
```powershell
# بررسی اینکه پورت 5432 در دسترس است
docker compose ps db
# باید ببینید: 0.0.0.0:5432->5432/tcp
```

---

## 📋 اطلاعات اتصال

| پارامتر | مقدار |
|---------|-------|
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database** | `kalk` |
| **Username** | `postgres` |
| **Password** | `postgres` |

---

## 🚀 دستورات سریع

### تست اتصال از Command Line:
```powershell
# با Docker
docker compose exec db psql -U postgres -d kalk

# یا از host (اگر psql نصب دارید)
psql -h localhost -p 5432 -U postgres -d kalk
```

### مشاهده جداول:
```sql
-- لیست تمام جداول
\dt

-- ساختار یک جدول
\d users

-- مشاهده داده‌ها
SELECT * FROM users LIMIT 10;
```

---

## 💡 توصیه‌ها

### برای توسعه روزانه:
- **VS Code Extension**: `PostgreSQL Client 2` (ساده و سریع)

### برای کارهای پیچیده:
- **DBeaver**: (رایگان، قدرتمند، پشتیبانی از چند دیتابیس)

### برای UI زیبا:
- **TablePlus**: (رایگان برای استفاده شخصی)

### برای تیم:
- **pgAdmin**: (رسمی PostgreSQL، رایگان)

---

## ⚠️ نکات امنیتی

1. **رمز عبور**: در production از رمز قوی‌تر استفاده کنید
2. **فایل `.env`**: هرگز در Git commit نکنید
3. **دسترسی**: فقط به localhost محدود کنید

---

## 🎯 خلاصه

| ابزار | نوع | قیمت | پیشنهاد برای |
|-------|-----|------|--------------|
| **VS Code Extension** | Extension | رایگان | توسعه روزانه |
| **pgAdmin** | Desktop App | رایگان | تیم‌ها |
| **DBeaver** | Desktop App | رایگان | کارهای پیچیده |
| **TablePlus** | Desktop App | رایگان/پولی | UI زیبا |

---

## 📝 مثال استفاده با VS Code Extension

1. نصب `PostgreSQL Client 2`
2. اتصال به `localhost:5432`
3. مشاهده جداول در sidebar
4. اجرای Query با `Ctrl+Shift+P` → `PostgreSQL: New Query`
5. مشاهده داده‌ها با راست کلیک روی جدول → `View Data`

---

## 🔗 لینک‌های مفید

- [PostgreSQL Client 2](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-postgresql-client2)
- [SQLTools](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools)
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)
- [TablePlus](https://tableplus.com/)

