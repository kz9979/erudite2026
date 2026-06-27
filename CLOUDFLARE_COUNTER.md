# ERUDITE real guest counter

The footer counter uses a Cloudflare Worker and D1. It counts one unique guest per browser by storing a random ID in `localStorage`. Reloading the page updates the visit timestamp but does not increase the unique total.

## Historical baseline

`BASELINE_COUNT = "200"` represents an estimated 200 guests from the roughly 40 days before this counter was introduced (five guests per day). This is explicitly an estimate, not an imported analytics measurement. The displayed total is this baseline plus new unique browser records stored in D1.

## Deploy once

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run cf:login` and authorize the ERUDITE Cloudflare account.
4. Run `npm run cf:create-db`.
5. Copy the returned D1 database ID into `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
6. Run `npm run cf:init-remote`.
7. Make sure `erudite26.com` is an active zone in the same Cloudflare account.
8. Run `npm run cf:deploy`.

The Worker config attaches the custom domain `counter.erudite26.com`. Confirm it works:

```text
https://counter.erudite26.com/health
```

Expected response:

```json
{"ok":true}
```

The webpage is already configured to call `https://counter.erudite26.com/api/guest`.

## What “unique” means

This is a real shared global count stored in D1. A guest is unique per browser profile. Clearing site storage, using private browsing, or changing browser/device creates a new guest ID. No name, email, phone number, or raw IP address is stored.

## Local test

Run:

```powershell
npm run cf:init-local
npm run cf:dev
```

Then send a POST request to the local Worker using a valid visitor ID.
