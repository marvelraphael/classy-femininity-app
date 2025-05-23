// api/create-lemon-session.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { variantId } = req.body;                          // Incoming from the front end
  const book          = req.query.book;                     // preserve ?book=1
  const storeId       = process.env.LEMON_STORE_ID;         // e.g. "183182"
  const apiKey        = process.env.LEMON_SECRET_KEY;       // your sk_live_… or sk_test_…
  const appUrl        = process.env.APP_URL;                // "https://your-app.vercel.app"

  // Build the JSON:API–compliant payload
  const payload = {
    data: {
      type: "checkouts",
      relationships: {
        store: {
          data: { type: "stores", id: storeId }
        },
        variant: {
          data: { type: "variants", id: variantId }
        }
      },
      attributes: {
        embed: true,  // opens the overlay instead of a full redirect
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
      return res.status(502).json({ error: `Lemon ${response.status}: ${text.slice(0,200)}…` });
    }

    // Parse JSON:API response
    const json = JSON.parse(text);
    const url  = json.data.attributes.url;  // the embedded checkout URL

    return res.status(200).json({ url });
  }
  catch (err) {
    console.error("❌ create-session exception", err);
    return res.status(500).json({ error: err.message });
  }
}
