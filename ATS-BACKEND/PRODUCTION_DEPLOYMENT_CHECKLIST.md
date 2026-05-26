# Production Deployment Checklist - Laravel Cloud

**Last Updated:** May 11, 2026  
**Status:** ✅ Ready for deployment

---

## Pre-Deployment: Local Testing

- [ ] Run tests: `php artisan test`
- [ ] Check code quality: `php artisan pint --check`
- [ ] Clear cache: `php artisan config:clear && php artisan cache:clear`
- [ ] Generate fresh APP_KEY: `php artisan key:generate --show`

---

## Laravel Cloud Environment Setup

### 1. **Critical: APP_KEY**
- [ ] Generate a new production key locally: `php artisan key:generate --show`
- [ ] Copy the output (format: `base64:xxx...`)
- [ ] Set in Laravel Cloud Environment Variables:
  ```
  APP_KEY=<paste_your_key_here>
  ```

### 2. **Database Configuration**
```
DB_CONNECTION=mysql
DB_HOST=<Laravel Cloud MySQL Host>
DB_PORT=3306
DB_DATABASE=ats_production
DB_USERNAME=<strong_username>
DB_PASSWORD=<very_strong_password>
```
- [ ] Database created and accessible
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Seed data: `php artisan db:seed --class=AdminUserSeeder --force`

### 3. **Authentication & Security**
```
APP_DEBUG=false                          # NEVER set to true
SESSION_DRIVER=cookie
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
AUTH_TOKEN_COOKIE=ats_auth_token
```
- [ ] Frontend URL matches `SANCTUM_STATEFUL_DOMAINS`
- [ ] Backend URL matches `SANCTUM_STATEFUL_DOMAINS`
- [ ] Verified CORS is restricted to frontend domain

### 4. **Logging & Monitoring**
```
LOG_CHANNEL=stderr              # Laravel Cloud standard
LOG_LEVEL=error                 # Only log errors in production
LOG_DEPRECATIONS_CHANNEL=null
```
- [ ] Access Laravel Cloud logs to verify no errors on startup

### 5. **Frontend Integration**
```
FRONTEND_URL=https://ats-czm.vercel.app
SANCTUM_STATEFUL_DOMAINS=ats-czm.vercel.app,ats-backend-main-ld11xy.free.laravel.cloud
```
- [ ] Frontend can reach backend API
- [ ] CORS errors resolved
- [ ] Authentication cookies working

### 6. **Email Configuration** (if using paid tier)
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=tls
MAIL_USERNAME=<your-email@gmail.com>
MAIL_PASSWORD=<app_password>
MAIL_FROM_ADDRESS=<noreply@yourdomain.com>
MAIL_FROM_NAME=ATS
```
- [ ] Test email delivery (or disable on free tier - already disabled)
- [ ] Verify sender address is whitelisted

### 7. **File Storage**
```
FILESYSTEM_DISK=local          # or s3 if using AWS
CV_STORAGE_DISK=s3             # For CV files (S3 recommended)
```
- [ ] Public storage symlink created: `php artisan storage:link`
- [ ] S3 bucket configured (if using S3):
  ```
  AWS_ACCESS_KEY_ID=<key>
  AWS_SECRET_ACCESS_KEY=<secret>
  AWS_DEFAULT_REGION=ap-southeast-1
  AWS_BUCKET=<bucket-name>
  AWS_USE_PATH_STYLE_ENDPOINT=false
  ```

### 8. **Caching & Sessions**
```
CACHE_STORE=redis
CACHE_PREFIX=ats_cache_
REDIS_HOST=<Laravel Cloud Redis>
REDIS_PASSWORD=null
REDIS_PORT=6379
```
- [ ] Redis connection verified
- [ ] Cache working correctly

### 9. **Queue Configuration** (if needed)
```
QUEUE_CONNECTION=redis
```
- [ ] Queue worker running (if applicable)

### 10. **Security Headers & HTTPS**
- [ ] HTTPS enabled on backend domain
- [ ] Redirect HTTP → HTTPS
- [ ] `APP_URL=https://ats-backend-main-ld11xy.free.laravel.cloud`
- [ ] Verified no credentials in error messages

---

## Post-Deployment Verification

### API Testing
```bash
# Test public applicant submission
curl -X POST https://ats-backend-main-ld11xy.free.laravel.cloud/api/public/applicants \
  -H "Content-Type: application/json" \
  -d '{
    "first_name":"John",
    "last_name":"Doe",
    "email_address":"john@example.com",
    "contact_number":"555-1234",
    "position_applied_for":"Developer",
    "permanent_address":"123 Main St",
    "current_address":"123 Main St",
    "gender":"Male",
    "civil_status":"Single",
    "birthdate":"1990-01-01",
    "highest_education_level":"Bachelor",
    "last_school_attended":"University",
    "preferred_work_location":"Remote"
  }'

# Expected: 201 Created or 429 Too Many Requests (spam protection)
```

### Authentication Testing
```bash
# Test admin login (replace with real credentials)
curl -X POST https://ats-backend-main-ld11xy.free.laravel.cloud/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jumaejumae113@gmail.com","password":"DK:X5e!eJ4Wjzz."}'

# Expected: 200 OK with token
```

### Health Check
```bash
curl https://ats-backend-main-ld11xy.free.laravel.cloud/up

# Expected: 200 OK with "OK"
```

---

## Common Issues & Solutions

### 501 "Route not defined" for login redirect
✅ **FIXED** - Added route name to login endpoint in `routes/api.php`

### 500 on public applicant submission
✅ **FIXED** - Disabled email notifications for free tier (line 51 in `ApplicantController.php`)

### 401 on login attempts
- Verify user exists in DB: `php artisan tinker`
- Confirm credentials are correct
- Check `APP_KEY` is set

### 429 on repeated form submissions
- This is **intentional** anti-spam protection (5-minute cooldown per email)
- Expected behavior

### Database connection failed
- Verify `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
- Ensure database exists
- Check Laravel Cloud MySQL service is running

### CORS errors on frontend
- Verify `SANCTUM_STATEFUL_DOMAINS` includes frontend domain
- Verify `FRONTEND_URL` is set correctly
- Check CORS middleware allows the origin

---

## Production Optimizations (Already Configured)

✅ Debug mode disabled (`APP_DEBUG=false`)  
✅ Error handling hides stack traces in production  
✅ Logging set to error level only  
✅ Exception logging includes context  
✅ Anti-spam protection on public submissions  
✅ Database query constraints (preventSilentlyDiscardingAttributes)  
✅ HTTPS forced in URLs  
✅ Session encryption enabled  
✅ CSRF protection on web routes  
✅ Tinker disabled in production (via `--no-dev` in composer)  

---

## Maintenance Tasks

### Daily/Weekly
- Monitor error logs: `php artisan tail`
- Check disk space for logs and uploads
- Verify payment/subscription active

### Monthly
- Review and archive old logs
- Update dependencies: `composer update --no-dev`
- Test backup restoration process

### Quarterly
- Security audit of API endpoints
- Review CORS and authentication rules
- Test disaster recovery plan

---

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Laravel Cloud auto-deploys from git
   ```

2. **Database Rollback** (if migration failed)
   ```bash
   php artisan migrate:rollback
   php artisan migrate
   ```

3. **Cache Clear** (if caching issue)
   ```bash
   php artisan cache:clear
   php artisan config:clear
   ```

---

## Support & Documentation

- **Laravel Cloud Docs:** https://laravel.cloud/docs
- **Laravel Deployment:** https://laravel.com/docs/deployment
- **Sanctum Auth:** https://laravel.com/docs/sanctum
- **CORS Config:** check `config/cors.php`

---

**Deployment Status:** 🟢 **READY**  
**Last Verified:** May 11, 2026
