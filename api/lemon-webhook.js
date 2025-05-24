// api/lemon-webhook.js
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1) Verify Lemon signature
  const expected = crypto
    .createHmac('sha256', process.env.LEMON_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (req.headers['x-ls-signature'] !== expected) {
    return res.status(400).send('Invalid signature');
  }

  const { event, data } = req.body;
  const userId = data.attributes.user_id.toString();

  // 2) Upsert or update subscription flag
  if (['subscription_created','subscription_activated'].includes(event)) {
    await supabase
      .from('users')
      .upsert({ id: userId, subscribed: true });
  }
  else if (['subscription_expired','subscription_cancelled'].includes(event)) {
    await supabase
      .from('users')
      .update({ subscribed: false })
      .eq('id', userId);
  }

  return res.status(200).send('OK');
}
