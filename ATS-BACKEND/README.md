# ATS Backend

Laravel API for the Applicant Tracking System.

## Production target

The backend is intended to run on Laravel Cloud with the frontend on Vercel.

See [LARAVEL_CLOUD.md](LARAVEL_CLOUD.md) for the current deployment guide.

## CV storage

Applicant CV uploads must use persistent storage in production. See [docs/CV_STORAGE.md](docs/CV_STORAGE.md).

## Local development

Use the standard Laravel commands for local development and testing.

```bash
php artisan serve
php artisan migrate
php artisan test
```
