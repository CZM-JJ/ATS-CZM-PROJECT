# Deploying to Laravel Cloud

This backend is configured to run on a persistent cloud host with a separate frontend.

## Required environment variables

Set these in Laravel Cloud:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://<your-laravel-cloud-domain>`
- `FRONTEND_URL=https://<your-vercel-frontend-domain>`
- `AUTH_TOKEN_COOKIE=ats_auth_token`
- `SANCTUM_STATEFUL_DOMAINS=<your-vercel-frontend-domain>,<your-laravel-cloud-domain>`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_DOMAIN=null`
- `SESSION_SAME_SITE=none`
- `SESSION_ENCRYPT=true`
- `CV_STORAGE_DISK=s3`
- `AWS_ACCESS_KEY_ID=<your-s3-access-key>`
- `AWS_SECRET_ACCESS_KEY=<your-s3-secret-key>`
- `AWS_DEFAULT_REGION=<your-s3-region>`
- `AWS_BUCKET=<your-s3-bucket>`
- `AWS_USE_PATH_STYLE_ENDPOINT=false` (set `true` only if your provider needs it)

## Deploy steps

1. Create a Laravel Cloud project and connect the GitHub repository.
2. Set the environment variables above.
3. Deploy the backend.
4. Run the app once, then verify the following endpoints:
   - `POST /api/login`
   - `GET /api/me`
   - `GET /api/applicants/{id}/cv`
5. Upload a CV and confirm it persists after a redeploy.

## Notes

- The app uses an HttpOnly auth cookie plus Sanctum token fallback, so the frontend must send credentials on requests.
- CV files should live on S3 or another persistent disk. Do not use the default local `public` disk in production.
- If you need to refresh cached config after changing env vars, run:

```bash
php artisan config:clear
php artisan cache:clear
```
