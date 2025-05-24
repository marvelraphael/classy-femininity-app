console.log('🔔 [Webhook] Event received:', req.body.event, 'for user:', req.body.data.attributes.user_id);
}
// api/lemon-webhook.js

const { buffer } = require('micro');
const crypto     = require('crypto');

/**
 * Disable Vercel's default body parser so we can verify the raw payload.
 */
module.exports.config = {
  api: {
    bodyParser: false
  }
};

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 1) Read raw request body
    const rawBody   = (await buffer(req)).toString('utf8');
    const signature = req.headers['x-ls-signature'];
    const secret    = process.env.LEMON_WEBHOOK_SECRET;
    
    // 2) Compute HMAC-SHA256 and compare
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    if (expected !== signature) {
      console.warn('⚠️ Invalid webhook signature', { expected, signature });
      return res.status(400).end('Invalid signature');
    }

    // 3) Parse JSON after verification
    const payload = JSON.parse(rawBody);
    console.log('🔔 Webhook event received:', payload.event);

    // 4) Handle specific events
    const { event, data } = payload;
    const userId = data.attributes.user_id; // adjust if your payload uses a different key

    switch (event) {
      case 'subscription_created':
      case 'subscription_activated':
        // TODO: mark user as subscribed in your database
        console.log(`→ Mark user ${userId} SUBSCRIBED`);
        break;
      case 'subscription_expired':
      case 'subscription_cancelled':
        // TODO: mark user as unsubscribed
        console.log(`→ Mark user ${userId} UNSUBSCRIBED`);
        break;
      case 'payment_failed':
        // TODO: handle dunning state
        console.log(`→ Payment failed for user ${userId}`);
        break;
      case 'payment_succeeded':
        // TODO: clear any dunning flags / re-activate subscription
        console.log(`→ Payment succeeded for user ${userId}`);
        break;
      default:
        console.log(`→ Unhandled event type: ${event}`);
    }

    // 5) Respond 200 OK
    return res.status(200).end('OK');
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.status(500).end('Internal Server Error');
  }
};
