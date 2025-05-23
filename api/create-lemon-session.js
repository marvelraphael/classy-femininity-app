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

  // *** NEW: attributes-only JSON:API payload ***
  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        store_id:     storeId,
        variant_id:   variantId,
        embed:        true,
        redirect_url: `${appUrl}/reader.html?book=${book}&subscribed=1`,
        cancel_url:   `${appUrl}/reader.html?book=${book}`
      }
    }
  };

  try {
    const response = await fetch(
      "https://api.lemonsqueezy.com/v1/checkouts",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type":  "application/vnd.api+json",
          "Accept":        "application/vnd.api+json"
        },
        body: JSON.stringify(payload)
      }
    );

    const text = await response.text();
    console.error("🛠️ Lemon status:", response.status);
    console.error("🛠️ Lemon body snippet:", text.slice(0,200));

    if (!response.ok) {
      return res
        .status(502)
        .json({ error: `Lemon ${response.status}: ${text.slice(0,200)}…` });
    }

    const json = JSON.parse(text);
    const url  = json.data.attributes.url;
    return res.status(200).json({ url });
  }
  catch (err) {
    console.error("❌ create-session exception", err);
    return res.status(500).json({ error: err.message });
  }
}
