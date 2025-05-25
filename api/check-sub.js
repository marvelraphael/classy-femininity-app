// api/check-sub.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1) Read customer_id from header
  const customerId = req.headers['x-customer-id'];
  if (!customerId) {
    // no customer → treat as unsubscribed
    return res.status(200).json({ subscribed: false });
  }

  // 2) Look up subscription flag
  const { data, error } = await supabase
    .from('users')
    .select('subscribed')
    .eq('id', customerId)
    .single();

  if (error) {
    console.error('❌ check-sub error:', error);
    return res.status(200).json({ subscribed: false });
  }

  // 3) Return subscription status
  res.status(200).json({ subscribed: !!data.subscribed });
}
