// api/lemon-webhook.js
import { buffer }           from 'micro';
import crypto                from 'crypto';
import { createClient }      from '@supabase/supabase-js';

// 1) Turn off Vercel’s default JSON parser
export const config = { api: { bodyParser: false } };

// 2) Supabase client using your SERVICE_ROLE key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 3) Grab the raw request bytes
    const rawBody = await buffer(req);

    // 4) Verify HMAC against the correct header name
    const sigHeader = req.headers['x-signature'] || req.headers['X-Signature'];
    if (!sigHeader) {
      console.warn('❌ Webhook: Missing X-Signature header');
      return res.status(400).send('Missing signature');
    }

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

    // 5) Parse and log
    const payload = JSON.parse(rawBody.toString());
    console.log('🔔 Webhook payload:', JSON.stringify(payload));

    // 6) Pull out the event name and customer_id
    const eventName  = payload.meta?.event_name;
    const custId     = payload.data?.attributes?.customer_id;
    if (!eventName || !custId) {
      console.warn('❌ Webhook: Missing event_name or customer_id');
      return res.status(400).send('Bad webhook payload');
    }
    const userKey = String(custId);

    // 7) Update your users table
    if (['subscription_created','subscription_activated','subscription_updated'].includes(eventName)) {
      await supabase
        .from('users')
        .upsert({ id: userKey, subscribed: true });
    } else if (['subscription_expired','subscription_cancelled'].includes(eventName)) {
      await supabase
        .from('users')
        .update({ subscribed: false })
        .eq('id', userKey);
    } else {
      console.log(`ℹ️ Webhook: Ignoring event "${eventName}"`);
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.status(500).send('Server error');
  }
}
