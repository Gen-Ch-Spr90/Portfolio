# Cloudflare Contact Worker

This Worker receives contact form submissions at `/api/contact` and sends email through Cloudflare's MailChannels integration.

## Why this setup

- Your website posts to your own endpoint.
- Email sending happens server-side, not from the browser.
- No SendGrid/Mailgun API key is required.

## Prerequisites

- Domain managed in Cloudflare (`sprintglobal.org`).
- Wrangler installed and authenticated.

## Files

- `src/index.js`: Request validation, anti-spam honeypot handling, and MailChannels send.
- `wrangler.toml`: Worker config and route mapping.

## Deploy

1. Open terminal in this folder.
2. Authenticate:
   - `npx wrangler login`
3. Deploy:
   - `npx wrangler deploy`
4. Verify route:
   - `https://portfolio.sprintglobal.org/api/contact`

## Required Worker vars

Configured in `wrangler.toml` under `[vars]`:

- `TO_EMAIL`: Inbox to receive contact submissions.
- `FROM_EMAIL`: Sender address on your own domain.
- `SUBJECT_PREFIX`: Prefix for message subjects.
- `ALLOWED_ORIGINS`: Comma-separated origins allowed by CORS.

## Namecheap Private Email compatibility

This works with Namecheap Private Email as the destination inbox (`TO_EMAIL`) or domain mailbox for `FROM_EMAIL`, as long as DNS/email auth is configured correctly.

Recommended DNS/auth:

- SPF for sending domain.
- DKIM for sending domain.
- DMARC policy.

## Local testing

- Start local Worker:
  - `npx wrangler dev`
- Update form endpoint on your local page to point to local Worker URL if needed.

## Notes

- `FROM_EMAIL` should be a valid address on your domain.
- Honeypot (`_honey`) is supported: if filled, Worker returns success and skips email send.
- Worker only allows `POST` and `OPTIONS`.
