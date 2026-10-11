# Nile Pixel bootcamp landing page (Brevo + Vercel)

Files: `index.html` (the page) and `api/subscribe.js` (sends signups to Brevo; keeps your API key off the page).

## 1. Brevo setup (free plan)
1. Log in to Brevo > **Contacts > Lists** > create a list, e.g. "Bootcamp signups". Note its **List ID** (shown next to the list name).
2. **Contacts > Settings > Contact attributes** > add a **Text** attribute named `SOURCE` (tracks where each signup came from). Optional: if you skip it, emails are still saved.
3. Top-right menu > **SMTP & API > API keys** > generate a key. Copy it once; keep it private.

## 2. Deploy on Vercel
1. Push this folder to a GitHub repo, then import it in Vercel (or run `npx vercel` in this folder).
2. In Vercel > Project > **Settings > Environment Variables** add:
   - `BREVO_API_KEY` = your key
   - `BREVO_LIST_ID` = your list ID (a number)
3. Redeploy. Open the site, sign up with your own email, and check it appears in the Brevo list.

## 3. Track your channels
Share links with a `src` tag so you can see what converts:
- `https://yoursite.vercel.app/?src=linkedin`
- `?src=facebook`, `?src=telegram`, `?src=community`

## 4. Later (Week 3)
Brevo free sends 300 emails/day, so email each 250-person cohort on a separate day. Segment contacts into Cohort A-D lists inside Brevo before sending the welcome emails.
