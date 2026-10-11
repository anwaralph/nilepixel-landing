// Vercel serverless function: adds a signup to your Brevo list.
// Needs env vars: BREVO_API_KEY and BREVO_LIST_ID (see README.md).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, src, company } = req.body || {};
  if (company) return res.status(200).json({ ok: true }); // honeypot: bots fill this in

  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey || !listId) return res.status(500).json({ error: 'Server not configured' });

  const attributes = {};
  if (name) attributes.FIRSTNAME = String(name).trim().slice(0, 60);
  if (src) attributes.SOURCE = String(src).trim().slice(0, 40);

  const send = (attrs) =>
    fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: clean, attributes: attrs, listIds: [listId], updateEnabled: true }),
    });

  try {
    let r = await send(attributes);
    // If the SOURCE attribute doesn't exist in Brevo yet, save the email without attributes
    if (r.status === 400 && Object.keys(attributes).length) r = await send({});
    if (r.ok) return res.status(200).json({ ok: true });
    console.error('Brevo error', r.status, await r.text());
    return res.status(502).json({ error: 'Could not save contact' });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: 'Could not save contact' });
  }
};
