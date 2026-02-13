# Infra Blockers Checklist

Date: 2026-02-13

This checklist tracks P0 production infra dependencies required for secure launch.

## Resend
- [ ] Custom sending domain verified in Resend
- [ ] `EMAIL_FROM` updated to verified domain address
- [ ] Non-owner test inbox receives login magic link

## Redis
- [ ] Production Redis instance provisioned
- [ ] `REDIS_URL` set in Vercel for Production + Preview
- [ ] Login and flag throttling path confirmed active

## Meilisearch
- [ ] Production Meilisearch instance provisioned
- [ ] `MEILISEARCH_HOST` + `MEILISEARCH_API_KEY` set in Vercel
- [ ] `npm run search:backfill` executed against production content set

## Verification Endpoint
- Integration status endpoint: `/api/system/integrations`
