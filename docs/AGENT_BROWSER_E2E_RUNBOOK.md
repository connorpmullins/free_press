# Agent Browser E2E Runbook

This runbook defines the plain-English browser flows any Cursor agent should execute to validate that Warrant is working end-to-end.

Use this as the default manual certification checklist after meaningful code changes.

## Scope

- Validate core user journeys in a real browser against local dev.
- Catch runtime/UI regressions that unit tests miss.
- Confirm key integrations (Stripe Checkout, Stripe Customer Portal, Stripe Connect onboarding) are reachable.

## Preconditions

Before running flows, confirm:

1. Local app is running at `http://localhost:3000`.
2. Local services are running (Postgres, Redis, Meilisearch, Mailpit).
3. Database is migrated + seeded.
4. `.env` is configured with working Stripe test values:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_MONTHLY_PRICE_ID`
   - `STRIPE_ANNUAL_PRICE_ID`

If setup is uncertain, first call `GET /api/system/integrations` and verify Stripe/Redis/Meilisearch are configured.

## Test Accounts

Use these seeded identities:

- Admin: `admin@warrant.ink`
- Journalist: `elena.vasquez@example.com`
- Reader (subscribed): `reader@example.com`
- Reader (free, for paywall testing): `free-reader@example.com`
- Additional journalists: `james.wright@example.com`, `priya.kapoor@example.com`, `carlos.rivera@example.com`

For browser login during testing:

- **Interactive (easiest):** Open `http://localhost:3000/auth/dev-login` and click any account. One click logs you in and redirects to the appropriate dashboard. Dev only — not available in production.
- **Programmatic (for curl/scripts):**
  ```bash
  curl -X POST http://localhost:3000/api/auth/login/test \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@warrant.ink"}'
  # Returns: {"data":{"token":"<token>"}}
  # Then open: http://localhost:3000/auth/verify?token=<token>
  ```
- **Playwright E2E tests** use `e2e/helpers/auth.ts` which automates the programmatic flow.

## Flow 1: Public Smoke Test

Goal: verify public pages and basic nav render.

1. Open `/`.
2. Confirm header nav items render (`Feed`, `Search`, `Feedback`).
3. Confirm homepage CTA links render (`Read the Feed`, `Subscribe Now`).
4. Open footer legal links:
   - `/terms`
   - `/privacy`
   - `/transparency`
   - `/integrity`
5. Confirm each page returns content, not 404/blank.

Pass criteria:
- All pages render with no fatal console errors.

## Flow 2: Reader + Paywall + Subscribe

Goal: verify reader auth, paywall-to-checkout flow, dynamic payment methods, and post-checkout success page.

1. Log in as `free-reader@example.com` (unsubscribed) via dev-login.
2. Open `/feed`.
3. Open a published article from feed.
4. If paywall appears, click `Subscribe Now` in article or go to `/subscribe`.
5. On `/subscribe`, click `Subscribe Monthly`.
6. Confirm browser navigates to Stripe Checkout (`checkout.stripe.com`) and a `cs_test_...` session is created.
7. On the Stripe Checkout page, confirm multiple payment method options are shown (not just card). The page should display express checkout options (Apple Pay, Google Pay, Link, etc.) depending on what is enabled in the Stripe Dashboard.
8. After completing checkout (or navigating directly), confirm `/subscribe/success?session_id=cs_test_...` renders:
   - "Welcome aboard!" heading
   - Plan/email/billing details box (when `session_id` is present)
   - "Start Reading" button (links to `/feed`)
   - "Manage Subscription" button (links to `/settings`)
9. Confirm `/subscribe/success` (without `session_id`) still renders gracefully with generic confirmation and both CTA buttons.

Pass criteria:
- No 500 from `/api/subscribe`.
- Checkout session opens successfully with dynamic payment methods.
- Success page renders with session details when `session_id` is present.
- Success page degrades gracefully without `session_id`.

## Flow 2b: Subscription Management (Customer Portal)

Goal: verify subscribers can manage their subscription via Stripe's hosted billing portal.

1. Log in as `reader@example.com` (subscribed) via dev-login.
2. Open `/settings`.
3. Confirm subscription card shows:
   - "Active" badge and plan badge (e.g., "MONTHLY")
   - Renewal date
   - "Manage Subscription" button
4. Click "Manage Subscription".
5. Confirm `POST /api/subscribe/portal` returns success (check network tab or observe redirect).
6. Confirm browser redirects to Stripe's billing portal (`billing.stripe.com` or `billing.stripe.com/p/session/...`).
7. Log in as `free-reader@example.com` (unsubscribed) and open `/settings`.
8. Confirm subscription card shows "No active subscription." and a "Subscribe" button linking to `/subscribe` — **not** the "Manage Subscription" button.

Pass criteria:
- `POST /api/subscribe/portal` returns 200 with portal URL for subscribed users.
- `POST /api/subscribe/portal` returns 404 for users without a Stripe customer ID.
- "Manage Subscription" button only appears for active subscribers.
- Portal redirect URL is valid.

## Flow 3: Journalist Dashboard + Write Page

Goal: verify journalist tooling works and editor mounts correctly.

1. Log in as `elena.vasquez@example.com`.
2. Open `/journalist/dashboard`.
3. Confirm dashboard tabs and article list render.
4. Open `/journalist/write`.
5. Confirm editor UI is visible:
   - title + summary inputs
   - rich text toolbar (bold/italic/headings/list/etc)
   - source fields
   - `Save Draft` and `Publish` buttons
6. Enter title + summary + source title.

Pass criteria:
- `/journalist/write` is not blank.
- No Tiptap SSR/hydration fatal errors in console.

## Flow 3b: Draft → Edit → Publish with Image

Goal: verify that a draft article with image content can be loaded back into the editor, edited, and published without errors or data loss.

1. While logged in as journalist, create a draft article via the API or the Write page with:
   - Title (≥5 chars), summary, content text (≥100 chars), at least one source with a title.
   - Include an `image` node in the Tiptap JSON content (e.g., `{"type":"image","attrs":{"src":"https://example.com/test.jpg","alt":"Test"}}`).
2. Open `/journalist/dashboard` and click the draft title (links to `/journalist/write?edit=<id>`).
3. Confirm the editor loads the draft content:
   - Title and summary fields are populated.
   - The rich-text editor shows the article text **and** the image (visible as an `<img>` in the editor).
   - Source fields are populated from the saved draft.
4. (Optional) Edit the content — add text, modify the summary, etc.
5. Click `Publish`.
6. Confirm:
   - `PATCH /api/articles/<id>` fires first (saves current editor state) and returns 200.
   - `POST /api/articles/<id>/publish` fires next and returns 200.
   - Browser redirects to `/journalist/dashboard`.
7. Open the published article from the dashboard.
8. Confirm the image renders inline within the article body.

Pass criteria:
- Editor loads full draft content including images on `/journalist/write?edit=<id>`.
- Publish saves editor changes before calling the publish endpoint.
- No crash, blank page, or 5xx during the flow.
- Published article renders the image correctly.

## Flow 3d: Article Management (Delete, Edit Published, Withdraw)

Goal: verify journalists can delete drafts, edit published articles, and withdraw published articles.

1. Log in as `elena.vasquez@example.com`.
2. Open `/journalist/dashboard`.
3. Confirm action buttons are visible:
   - **Edit** (pencil icon) on published and draft articles.
   - **Delete** (trash icon) on draft articles only.
   - **Withdraw** (X-circle icon) on published articles only.
4. **Delete a draft:**
   - Click the trash icon on a draft article.
   - Confirm the deletion dialog appears with the article title.
   - Click "Delete".
   - Confirm the article disappears from the list and a success toast appears.
5. **Edit a published article:**
   - Click the edit (pencil) icon on a published article.
   - Confirm browser navigates to `/journalist/write?edit=<id>`.
   - Confirm the editor shows "Update Article" button (not "Publish").
   - Confirm the "Save Draft" button is NOT shown.
   - Confirm a "Change Note" textarea is visible and labeled as required.
   - Enter a change note and click "Update Article".
   - Confirm `PATCH /api/articles/<id>` returns 200.
   - Confirm redirect to dashboard with success toast.
6. **Withdraw a published article:**
   - Click the withdraw (X-circle) icon on a published article.
   - Confirm the withdrawal dialog appears with reason textarea.
   - Enter a reason (≥10 chars) and click "Withdraw".
   - Confirm `POST /api/articles/<id>/withdraw` returns 200.
   - Confirm the article status changes to "REMOVED" in the dashboard.
7. **Tombstone view:**
   - Navigate to the withdrawn article's URL (e.g., `/article/<slug>`).
   - Confirm the page shows "Article Withdrawn" heading.
   - Confirm the author name and original publication date are shown.
   - Confirm a "Back to feed" button is present.

Pass criteria:
- Delete only works on drafts — not published.
- Edit on published requires a change note.
- Withdrawal sets status to REMOVED and shows tombstone.
- No 5xx errors during any action.

## Flow 3e: Issue Correction

Goal: verify journalists can issue corrections from the article detail page and the `CORRECTION_ISSUED` label appears.

1. Log in as `elena.vasquez@example.com`.
2. Open a published article authored by this journalist (e.g., from `/journalist/dashboard` → published tab → click article title).
3. Scroll to the "Issue a Correction" section.
4. Confirm the section is visible with:
   - Severity dropdown (Typo, Clarification, Factual Error, Material Error, Retraction).
   - Correction details textarea.
   - "Submit Correction" button (disabled until ≥10 chars entered).
5. Select severity "TYPO", enter correction text (≥10 chars).
6. Click "Submit Correction".
7. Confirm `POST /api/corrections` returns 201.
8. Confirm a success toast appears and the corrections card refreshes at the top of the article (below the author, above the article body).
9. Confirm a "CORRECTION ISSUED" integrity label badge appears on the article.

Pass criteria:
- Correction form is only visible to the article's author.
- Correction appears at the top of the article body.
- `CORRECTION_ISSUED` badge renders after submission.
- No 5xx errors.

## Flow 3c: Journalist Revenue Page (formerly 3b)

Goal: verify revenue reporting page loads.

1. While logged in as journalist, open `/journalist/revenue`.
2. Confirm "Revenue" heading renders.
3. Confirm "Paid" and "Pending" summary cards render.
4. Confirm revenue history section is visible (may be empty if no entries).

Pass criteria:
- Page loads without errors.
- No auth redirect.

## Flow 4: Journalist Settings + Stripe Connect

Goal: verify payout onboarding path.

**Prerequisite:** The `Set Up Connect` button is disabled unless `verificationStatus === "VERIFIED"`. If the seeded journalist is not verified, the button will be disabled. The Identity verification section should still be visible with a "Start Verification" button.

1. While logged in as journalist, open `/settings`.
2. Find Identity Verification section and confirm it shows status or "Start Verification" button.
3. Find payout/Stripe Connect section.
4. If journalist is verified, click `Set Up Connect`.
5. Confirm request to `/api/profile/connect` succeeds and onboarding URL/redirect is returned.

Pass criteria:
- `POST /api/profile/connect` returns success (if verified) or 403 (if not verified).
- Settings page shows both Identity and Connect sections for journalists.

## Flow 5: Admin Dashboard + Flag Moderation

Goal: verify admin actions can be executed from UI.

1. Log in as `admin@warrant.ink`.
2. Open `/admin`.
3. Open `/admin/flags` (from action link or direct URL).
4. Confirm pending flags list loads.
5. Add a review note and click `Dismiss` (or `Uphold`) on a pending flag.
6. Confirm moderation request succeeds (`PATCH /api/admin/flags`).

Pass criteria:
- Admin pages load without auth issues.
- Flag action returns success and reflects updated status.

## Flow 6: Access Control Sanity

Goal: verify protected routes still require auth/role.

1. In a fresh unauthenticated browser context, attempt:
   - `/journalist/dashboard`
   - `/journalist/write`
   - `/admin`
   - `/admin/flags`
2. Confirm redirect/block behavior (login or unauthorized route), not data leakage.

Pass criteria:
- No protected content is visible unauthenticated.
- Admin routes are not accessible by non-admin users.

## Flow 7: Media in Articles

Goal: verify that image and video content renders correctly in articles.

### 7a: Video Embed Rendering

1. Log in as subscribed reader and open an article that contains a video embed (e.g., `/article/consolidated-petrochemicals-sabine-river-contamination` or `/article/clearview-ai-racial-bias-facial-recognition`).
2. Scroll to the embedded video.
3. Confirm a responsive YouTube iframe renders (16:9 aspect ratio, no layout overflow).
4. Confirm the iframe `src` points to `https://www.youtube.com/embed/...`.

Pass criteria:
- Video iframe renders inline within the article body.
- No CSP errors in the console related to `frame-src`.
- Video does not break article layout.

### 7b: Image Rendering

1. Open an article with an inline image (e.g., `/article/amazon-warehouse-wage-theft-investigation` or `/article/insulin-pricing-pbm-coordination-investigation`).
2. Confirm the image renders within the article body with rounded corners and responsive sizing.

Pass criteria:
- Image loads successfully (no broken image icon).
- Image is contained within the article width.

### 7c: Editor Media Buttons

1. Log in as journalist and open `/journalist/write`.
2. Confirm the toolbar contains an "Upload image" button (camera icon) and an "Embed video" button (film icon).
3. Click "Embed video" and enter a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`).
4. Confirm a video embed block appears in the editor.
5. Click "Upload image" — confirm a file picker dialog opens and the image uploads successfully (requires `BLOB_READ_WRITE_TOKEN` to be configured).

Pass criteria:
- Both media toolbar buttons are present and functional.
- Video embed inserts into editor content.
- Image upload triggers native file picker.

## Flow 8: Read Tracking

Goal: verify that article reads are tracked for revenue calculation.

1. Log in as reader and open a published article.
2. Check browser network tab for `POST /api/articles/{id}/read`.
3. Confirm the request returns 200 with `{"data":{"tracked":true}}`.
4. Refresh the page — the same request should still return 200 (de-duplication is internal; the endpoint always returns success).

Pass criteria:
- Read tracking fires automatically when a subscriber views an article.
- No 5xx from the read endpoint.

## Flow 9: Console + Network Hygiene

Run this during all flows:

1. Watch browser console for uncaught runtime errors.
2. Watch network for:
   - unexpected 5xx responses
   - auth endpoints failing (`/api/auth/me`, `/api/auth/verify`)
   - subscription/connect endpoints failing (`/api/subscribe`, `/api/subscribe/portal`, `/api/subscribe/session`, `/api/profile/connect`)

Pass criteria:
- No uncaught exceptions that break user flows.
- No unexplained 5xx in core flows.

## Minimum Release Gate

For a local change to be considered "ready for merge", an agent should report:

1. `npm test` passes (161+ unit tests).
2. `npm run test:e2e` passes (36+ Playwright tests covering Flows 1-8 + 3d/3e).
3. `npm run build` succeeds.
4. No blocker console/runtime errors remain.

## Reporting Format (for future agents)

When done, report:

- Passed flows
- Failed flows (with URL + endpoint + error text)
- Any code fixes applied
- Remaining risk (if any)

Keep reports concise, but include enough detail for quick reproduction.
