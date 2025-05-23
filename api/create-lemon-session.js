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
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/stores/${storeId}/checkout_sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type':  'application/json',
          Accept:          'application/json'
        },
        body: JSON.stringify({
          variant_id:   variantId,
          accept_terms: true,
          success_url:  `${appUrl}/reader.html?book=${book}&subscribed=1`,
          cancel_url:   `${appUrl}/reader.html?book=${book}`
        })
      }
    );

    const text = await response.text();
    console.error('Lemon status:', response.status);
    console.error('Lemon body (snippet):', text.slice(0,200));

    if (!response.ok) {
      return res.status(502).json({ error: `Lemon ${response.status}: ${text.slice(0,200)}…` });
    }

    const data = JSON.parse(text);
    return res.status(200).json({ url: data.data.attributes.hosted_url });

  } catch (err) {
    console.error('create-session exception', err);
    return res.status(500).json({ error: err.message });
  }
}
