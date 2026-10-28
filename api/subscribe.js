// Vercel serverless function: saves a registration to Brevo and emails a confirmation.
// Env vars: BREVO_API_KEY, BREVO_LIST_ID (required)
//           BREVO_SENDER_EMAIL (a sender verified in Brevo), BREVO_SENDER_NAME, TELEGRAM_URL (for the confirmation email)
const AGE = ['Under 18', '18-24', '25-34', '35+'];
const EDU = ['High school', 'Diploma or college', 'Undergraduate', 'Masters or higher', 'Other'];
const LEVEL = ['No coding yet', 'Beginner', 'Intermediate', 'Advanced'];
const SKILLS = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Databases', 'Python', 'Git', 'None yet'];
const LAPTOP = ['Yes', 'No', 'Can borrow'];
const CUSTOM_ATTRS = ['AGE_RANGE', 'EDUCATION', 'CODING_LEVEL', 'SKILLS', 'CITY', 'TELEGRAM', 'LAPTOP', 'SOURCE'];
const API = 'https://api.brevo.com/v3';
let attrsReady = false;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Creates the custom contact attributes in Brevo the first time, if they are missing.
async function ensureAttributes(headers) {
  if (attrsReady) return;
  try {
    const r = await fetch(`${API}/contacts/attributes`, { headers });
    if (!r.ok) return;
    const have = new Set(((await r.json()).attributes || []).map((a) => a.name));
    let ok = true;
    for (const name of CUSTOM_ATTRS) {
      if (have.has(name)) continue;
      const c = await fetch(`${API}/contacts/attributes/normal/${name}`, { method: 'POST', headers, body: JSON.stringify({ type: 'text' }) });
      if (!c.ok) { ok = false; console.error('Create attribute failed', name, c.status, await c.text()); }
    }
    attrsReady = ok;
  } catch (e) { console.error(e); }
}

async function sendConfirmation(headers, email, first) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) { console.error('BREVO_SENDER_EMAIL not set, confirmation email skipped'); return false; }
  const tg = process.env.TELEGRAM_URL;
  const text = [
    `Hi ${first},`, '',
    'You are registered for the free 3-day AI Web Development Bootcamp by NilePixel Technologies.', '',
    tg ? `Next step: join our Telegram channel for updates, ground rules and questions:\n${tg}\n` : '',
    'What happens next:',
    '- Cohort A goes live on Saturday, November 7 and runs for three consecutive days (November 7 to 9) on Google Meet.',
    '- Sign-ups close on November 4. After that we email you your cohort, dates and Telegram group link.',
    '- We email the Google Meet link, and post it on Telegram, one hour before each session.',
    '- After each session we email the recording and homework.', '',
    'See you there,', 'NilePixel Technologies team',
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;color:#1B2A41;line-height:1.6;max-width:560px">
<p>Hi ${esc(first)},</p>
<p>You are registered for the free <b>3-day AI Web Development Bootcamp</b> by NilePixel Technologies.</p>
${tg ? `<p><b>Next step:</b> join our Telegram channel for updates, ground rules and questions:<br><a href="${esc(tg)}">${esc(tg)}</a></p>` : ''}
<p><b>What happens next</b></p>
<ul><li><b>Cohort A</b> goes live on <b>Saturday, November 7</b> and runs for three consecutive days (November 7 to 9) on Google Meet.</li>
<li>Sign-ups close on <b>November 4</b>. After that we email you your cohort, dates and Telegram group link.</li>
<li>We email the Google Meet link, and post it on Telegram, one hour before each session.</li>
<li>After each session we email the recording and homework.</li></ul>
<p>See you there,<br>NilePixel Technologies team</p></div>`;
  const r = await fetch(`${API}/smtp/email`, {
    method: 'POST', headers,
    body: JSON.stringify({
      sender: { name: process.env.BREVO_SENDER_NAME || 'NilePixel Technologies', email: senderEmail },
      to: [{ email, name: first }],
      subject: 'You are registered: free AI Web Development Bootcamp',
      htmlContent: html, textContent: text,
    }),
  });
  if (!r.ok) console.error('Confirmation email failed', r.status, await r.text());
  return r.ok;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const b = req.body || {};
  if (b.company) return res.status(200).json({ ok: true }); // honeypot: bots fill this in

  const email = String(b.email || '').trim().toLowerCase();
  const name = String(b.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const skills = (Array.isArray(b.skills) ? b.skills : []).filter((x) => SKILLS.includes(x));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || name.length < 2 || b.consent !== true ||
      !AGE.includes(b.age) || !EDU.includes(b.education) || !LEVEL.includes(b.level) || !LAPTOP.includes(b.laptop)) {
    return res.status(400).json({ error: 'Invalid registration' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey || !listId) return res.status(500).json({ error: 'Server not configured' });
  const headers = { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' };

  const [first, ...rest] = name.split(' ');
  const tgUser = String(b.telegram || '').trim().replace(/^@/, '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
  const base = { FIRSTNAME: first, LASTNAME: rest.join(' ') };
  const full = {
    ...base,
    AGE_RANGE: b.age, EDUCATION: b.education, CODING_LEVEL: b.level, SKILLS: skills.join(', '),
    CITY: String(b.city || '').trim().slice(0, 60), TELEGRAM: tgUser ? `@${tgUser}` : '',
    LAPTOP: b.laptop, SOURCE: String(b.src || 'direct').slice(0, 40),
  };

  const save = (attributes) => fetch(`${API}/contacts`, {
    method: 'POST', headers,
    body: JSON.stringify({ email, attributes, listIds: [listId], updateEnabled: true }),
  });

  try {
    await ensureAttributes(headers);
    let r = await save(full);
    if (r.status === 400) { console.error('Brevo 400, retrying with name only:', await r.text()); r = await save(base); }
    if (!r.ok) { console.error('Brevo error', r.status, await r.text()); return res.status(502).json({ error: 'Could not save contact' }); }

    // 201 = new contact. Only new contacts get the confirmation, so nobody can trigger repeat emails.
    let emailed = false;
    if (r.status === 201) {
      try { emailed = await sendConfirmation(headers, email, first); } catch (e) { console.error(e); }
    }
    return res.status(200).json({ ok: true, emailed });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: 'Could not save contact' });
  }
};
