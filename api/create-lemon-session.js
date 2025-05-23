// api/create-lemon-session.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { variantId } = req.body;
  const book          = req.query.book;
  const storeId       = process.env.LEMON_STORE_ID;
  const apiKey        = process.env.LEMON_SECRET_KEY;
  const appUrl        = process.env.APP_URL;

  try {
    const r = await fetch(
      `https://api.lemonsqueezy.com/v1/stores/${storeId}/checkout/sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variant_id:   variantId,
          accept_terms: true,
          success_url:  `${appUrl}/reader.html?book=${book}&subscribed=1`,
          cancel_url:   `${appUrl}/reader.html?book=${book}`
        })
      }
    );
    const json = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(json));
    res.status(200).json({ url: json.data.attributes.hosted_url });
  } catch (err) {
    console.error('create-session error', err);
    res.status(500).json({ error: err.message });
  }
}
