# Restaurant review website

Shared Next.js review pages for BiBiChik SS2, BiBiChik Sunway 163 Mall and Aburii Yakiniku. Customer styling and assets are preserved.

Run `npm install`, `npm run build`, then `npm start`. Requires Node.js 22.13 or newer and a Node-capable hosting plan. This is not a static export.

Low ratings send email through the Node server using Nodemailer SMTP. All outlets use the single server setting `FEEDBACK_TO_EMAIL=feedback@bibichik.com`. Positive ratings show the existing thank-you card and the configured outlet Google Review button.

See DEPLOYMENT.md for configuration. Run `node scripts/test-feedback.mjs` for validation tests and `node scripts/test-smtp.mjs` for local SMTP integration tests. The latter never delivers external email.
