// api/lemon-webhook.js
import { buffer } from 'micro';
import crypto      from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const raw = await buffer(req);
  const sig = req.headers['x-ls-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.LEMON_WEBHOOK_SECRET)
    .update(raw)
    .digest('hex');

  if (sig !== expected) {
    console.warn('Invalid signature', sig, expected);
    return res.status(400).send('Invalid signature');
  }

  const { event, data } = JSON.parse(raw);
  const userId = data.attributes.user_id.toString();

  if (['subscription_created','subscription_activated'].includes(event)) {
    await supabase.from('users').upsert({ id: userId, subscribed: true });
  } else if (['subscription_expired','subscription_cancelled'].includes(event)) {
    await supabase.from('users').update({ subscribed: false }).eq('id', userId);
  }

  res.status(200).send('OK');
}
