# cPanel Database API

This folder is a standalone PHP application. It is **not** part of the
Next.js build and is never deployed to Vercel - upload this folder directly
to your cPanel hosting account.

Full step-by-step deployment instructions (creating the MySQL database,
running the migration, uploading via File Manager/FTP, setting `config.php`,
and wiring `DATABASE_API_URL` / `DATABASE_API_SECRET` on the Vercel side) are
in the main project [`README.md`](../README.md#deploying-the-database-api-to-cpanel).

Quick reference:

1. Create a MySQL database + user in cPanel, run `migrations/001_init.sql`.
2. Copy `config.example.php` to `config.php` and fill in real DB credentials,
   a long random `api_secret`, and your production app's origin.
3. Upload this entire folder to your hosting (e.g. `public_html/ai-checker-api/`).
4. `config.php` is git-ignored - it never leaves your server.
5. Test with:
   ```bash
   curl -X POST "https://yourdomain.com/ai-checker-api/api.php?action=admin.stats" \
     -H "Content-Type: application/json" \
     -H "X-Api-Secret: YOUR_SECRET" \
     -d "{}"
   ```
