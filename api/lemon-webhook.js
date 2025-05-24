// api/lemon-webhook.js
import { buffer } from 'micro';
import crypto      from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Disable Vercel’s built-in body parser so we can verify the raw payload
export const config = { api: { bodyParser: false } };

// Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 1) Grab raw body
    const rawBody = await buffer(req);

    // 2) Verify signature header
    const sigHeader = req.headers['x-signature'] || req.headers['X-Signature'];
    if (!sigHeader) {
      console.warn('❌ Webhook: Missing X-Signature header');
      return res.status(400).send('Missing signature header');
    }

    // 3) Compute expected HMAC
    const expected = crypto
      .createHmac('sha256', process.env.LEMON_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(sigHeader, 'hex')
    )) {
      console.warn('❌ Webhook: Invalid signature', sigHeader, expected);
      return res.status(400).send('Invalid signature');
    }

    // 4) Parse JSON
    const json = JSON.parse(rawBody.toString());
    console.log('🔔 Webhook payload:', JSON.stringify(json));

    // 5) Extract event & user_id safely
    const event = json.event;
    const userId = json.data?.attributes?.user_id;
    if (!userId) {
      console.warn('❌ Webhook: Missing data.attributes.user_id');
      return res.status(400).send('Missing user_id');
    }
    const userKey = userId.toString();

    // 6) Update Supabase
    if (['subscription_created','subscription_activated'].includes(event)) {
      await supabase
        .from('users')
        .upsert({ id: userKey, subscribed: true });
    } else if (['subscription_expired','subscription_cancelled'].includes(event)) {
      await supabase
        .from('users')
        .update({ subscribed: false })
        .eq('id', userKey);
    } else {
      console.log(`ℹ️ Webhook: Unhandled event type "${event}"`);
    }

    // 7) Acknowledge success
    return res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.status(500).send('Server error');
  }
}
