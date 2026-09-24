# Node.js / GoDaddy deployment

1. Use a hosting plan that supports persistent Node.js applications (Node 22.13+), inbound HTTP and outbound SMTP.
2. Copy `.env.example` to `.env.local` or set environment variables in hosting settings. Never upload local test credentials.
3. Configure SMTP_HOST, SMTP_PORT (587 with STARTTLS or 465 with implicit TLS), SMTP_USER, SMTP_PASS and FEEDBACK_FROM_EMAIL using your email provider. The sender must be authorized by that provider.
4. Set FEEDBACK_TO_EMAIL=feedback@bibichik.com. This is the only recipient setting and applies to every outlet.
5. Set SITE_URL to your exact public HTTPS origin without a trailing slash.
6. Run npm install, npm run build and npm start. Configure the host reverse proxy/process manager to forward traffic to the application's PORT and restart it after deployment.

SMTP credentials are read only by the server. No hosting-provider-specific API is used. Do not prefix credentials with NEXT_PUBLIC_. TLS certificate validation is enabled; the app refuses unencrypted SMTP.

## Outlet links

Central branding and routes live in config/outlets.ts. Set GOOGLE_REVIEW_URL_SS2, GOOGLE_REVIEW_URL_SUNWAY_163 and GOOGLE_REVIEW_URL_ABURII to verified HTTPS review links. SS2 retains the previously supplied Google URL. Sunway and Aburii links have not been supplied; their Google button remains absent until configured, avoiding sending customers to another outlet. WEBSITE_URL_BIBICHIK and WEBSITE_URL_ABURII are optional.

Routes: /review/bibichik-ss2, /review/bibichik-sunway-163, /review/aburii-yakiniku. Existing short aliases remain supported.

## Sending and protection

The browser submits to /api/feedback. The server validates rating 1–3, categories, optional contact, length limits and honeypot. Outlet metadata and submission time are generated server-side. HTML is escaped. Emails include available fields; the current form does not collect separate food/service/environment scores, so none are fabricated.

The app keeps no review history. Temporary in-process counters and hashed submission identifiers provide throttling and 15-minute retry deduplication. These reset on restart and are not shared across multiple Node processes. Default limit is 30 requests/minute per process. Set TRUSTED_CLIENT_IP_HEADER only if your reverse proxy reliably overwrites that header; it enables a 5 requests/minute per-client limit. For multi-instance production, enforce additional limits at the reverse proxy.

SMTP rejection shows the existing error state. Acceptance shows the existing thank-you state. SMTP acceptance cannot prove inbox delivery; ambiguous network failures may still have delivered mail. No automatic delivery retry is performed.

## Checks

Run node scripts/test-feedback.mjs, node scripts/test-smtp.mjs and npm run build. Run ESLint directly with `node node_modules/eslint/bin/eslint.js app components config lib tests scripts`. The previously requested `lint: next lint` script is retained, although Next.js 16 no longer supports that command.

The local SMTP test creates a temporary localhost certificate and captures messages in memory. It does not contact the restaurant inbox. After production SMTP is configured, send one labelled test for each outlet and verify receipt in feedback@bibichik.com.
