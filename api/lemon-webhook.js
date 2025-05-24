// api/lemon-webhook.js
import crypto from 'crypto';

export default async function handler(req, res) {
  // 1) Grab the signature and your secret
  const signature = req.headers['x-ls-signature'];
  const secret    = process.env.LEMON_WEBHOOK_SECRET;
  const payload   = JSON.stringify(req.body);

  // 2) Verify HMAC-SHA256
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (hash !== signature) {
    console.warn('Invalid webhook signature', signature, hash);
    return res.status(400).send('Invalid signature');
  }

  // 3) Handle the event
  const { event, data } = req.body;
  const userId = data.attributes.user_id; // or however you identify the subscriber

  if (event === 'subscription_created' || event === 'subscription_activated') {
    // Mark them subscribed in your DB
    // await db.users.update(userId, { subscribed: true });
  } else if (event === 'subscription_expired' || event === 'subscription_cancelled') {
    // Mark them unsubscribed
    // await db.users.update(userId, { subscribed: false });
  } else if (event === 'payment_failed') {
    // Optionally flag dunning state
    // await db.users.update(userId, { past_due: true });
  } else if (event === 'payment_succeeded') {
    // Clear any dunning flags
    // await db.users.update(userId, { past_due: false, subscribed: true });
  }

  // 4) Ack the webhook
  res.status(200).send('OK');
}
