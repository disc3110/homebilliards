# BigCommerce inspection scripts

`inspect-bigcommerce.mjs` makes read-only requests to BigCommerce and writes a local snapshot under `artifacts/bigcommerce-inspection/`.

## Setup

Copy the backend example and add the real server-side credentials:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Required values:

- `BIGCOMMERCE_STORE_HASH`
- `BIGCOMMERCE_STOREFRONT_PRIVATE_TOKEN` for Storefront GraphQL introspection (preferred for server-to-server use)
- `BIGCOMMERCE_STOREFRONT_TOKEN` is accepted only as a compatibility fallback
- `BIGCOMMERCE_ACCESS_TOKEN` for Management Catalog REST samples

Never put either token in the storefront or commit the `.env` file.

## Run

Inspect both APIs:

```bash
npm run inspect:bigcommerce
```

Inspect only one API or change the sample size:

```bash
npm run inspect:bigcommerce -- --mode graphql
npm run inspect:bigcommerce -- --mode catalog --limit 10
```

The script does not create, edit, or delete BigCommerce data. Its output can contain private catalog information and is ignored by Git.
