// api/lemon-webhook.js
import { buffer } from 'micro';
import crypto      from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Disable Vercel’s automatic body parsing so we can get the raw payload
export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1) grab the raw bytes
  const rawBody = await buffer(req);

  // 2) read the signature from the correct header
  const signature = req.headers['x-signature'] || req.headers['X-Signature'];
  if (!signature) {
    console.warn('❌ Missing X-Signature header');
    return res.status(400).send('Missing signature');
  }

  // 3) compute the expected HMAC
  const expected = crypto
    .createHmac('sha256', process.env.LEMON_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex')
      )
  ) {
    console.warn('❌ Invalid signature', signature, 'vs', expected);
    return res.status(400).send('Invalid signature');
  }

  // 4) parse & handle
  const { event, data } = JSON.parse(rawBody.toString());
  const userId = data.attributes.user_id.toString();

  if (['subscription_created','subscription_activated'].includes(event)) {
    await supabase
      .from('users')
      .upsert({ id: userId, subscribed: true });
  } else if (['subscription_expired','subscription_cancelled'].includes(event)) {
    await supabase
      .from('users')
      .update({ subscribed: false })
      .eq('id', userId);
  }

  return res.status(200).send('OK');
}
