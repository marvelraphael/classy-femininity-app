// api/lemon-webhook.js
import crypto from 'crypto';

export default async function handler(req, res) {
  const signature = req.headers['x-ls-signature'];
  const secret    = process.env.LEMON_WEBHOOK_SECRET;
  const body      = JSON.stringify(req.body);

  // verify HMAC
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (hash !== signature) {
    console.warn('Invalid webhook signature', signature, hash);
    return res.status(400).send('Invalid signature');
  }

  const { event, data } = req.body;
  const userId = data.attributes.user_id;

  // TODO: replace with your DB calls
  if (event === 'subscription_created' || event === 'subscription_activated') {
    // await db.users.update(userId, { subscribed: true });
  } else if (event === 'subscription_expired' || event === 'subscription_cancelled') {
    // await db.users.update(userId, { subscribed: false });
  }

  res.status(200).send('OK');
}
