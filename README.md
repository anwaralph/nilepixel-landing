# Nile Pixel AI Web Development Bootcamp: registration page

A one-page site where people register for the free 3-day AI Web Development Bootcamp.
Each registration is saved to a Brevo list and the person gets an automatic confirmation email.

## Files
- `index.html`: the landing page and registration form
- `api/subscribe.js`: a Vercel serverless function. It checks the form, saves the contact to Brevo, and sends the confirmation email. The Brevo API key stays on the server and never appears on the page.

## What the form saves
First name, last name, email, age range, education level, coding level, skills, laptop access, city, Telegram username, and the traffic source.
Brevo contact attributes (Text type) used: `AGE_RANGE`, `EDUCATION`, `CODING_LEVEL`, `SKILLS`, `CITY`, `TELEGRAM`, `LAPTOP`, `SOURCE`.
The function tries to create them automatically on the first registration. If they are missing in Brevo, create them by hand under Contacts > Settings > Contact attributes.

## Setup
1. **Brevo list:** Contacts > Lists > create a list (for example "Bootcamp signups") and note its List ID.
2. **Brevo API key:** account menu > SMTP & API > API keys > generate a key. Copy it once and keep it private.
3. **Brevo sender:** Senders, Domains & Dedicated IPs > Senders > add and verify the address the confirmation emails come from.
4. **Deploy:** push this folder to GitHub and import the repo into Vercel (framework: Other, no build command).
5. **Environment variables** (Vercel > Project > Settings > Environment Variables):

   | Name | Value |
   |---|---|
   | `BREVO_API_KEY` | your Brevo API key |
   | `BREVO_LIST_ID` | the list ID (a number) |
   | `BREVO_SENDER_EMAIL` | the verified sender address |
   | `BREVO_SENDER_NAME` | for example `Nile Pixel Technologies` (optional) |
   | `TELEGRAM_URL` | the Telegram channel invite link |

6. **Redeploy** after adding or changing any variable. Changes take effect only on a new deployment.
7. **Test:** register with an email you can open. Check that the confirmation arrives and the contact appears in the Brevo list with its answers.

Never put the API key in any file in this repo.

## Tracking channels
Share links with a `src` tag to see which channel brings registrations:
`/?src=linkedin`, `/?src=facebook`, `/?src=telegram`, `/?src=community`.
The tag is saved in the `SOURCE` attribute.

## How emails work
- **Confirmation email:** sent automatically when someone registers with a new email address. Repeat registrations do not trigger another email.
- **Later emails** (cohort details, Google Meet links, recordings, homework): create a campaign in Brevo, choose the list or segment as recipients, and use Schedule to send at a set date and time.
- Brevo's free plan allows about 300 emails per day. Confirmations count toward that total.

## Notes
- Registration answers live in Brevo, not in this repository.
- The page uses Google Fonts. Everything else is in `index.html`.
