# CV Storage

This project stores applicant CVs using a configurable filesystem disk. On cloud hosts with ephemeral storage (Laravel Cloud containers, Vercel), the local `public` disk is not persistent. To ensure uploaded CVs persist across deploys, configure a persistent disk such as `s3`.

Steps to configure production storage:

1. Provision an S3-compatible bucket (AWS S3, DigitalOcean Spaces, etc.).
2. Set the following environment variables in your production environment (Laravel Cloud):

- `CV_STORAGE_DISK=s3`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION`
- `AWS_BUCKET`
- `AWS_USE_PATH_STYLE_ENDPOINT` (optional; `true` for some providers)

3. Clear config cache after setting env vars:

```bash
php artisan config:clear
php artisan cache:clear
```

4. Deploy and test by uploading a CV and requesting `/api/applicants/{id}/cv`.

If you need help setting environment variables in Laravel Cloud I can prepare the exact values and commands.
