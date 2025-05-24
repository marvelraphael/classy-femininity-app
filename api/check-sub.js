// api/check-sub.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1) Identify user (e.g. from a secure cookie or header)
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ subscribed: false });

  // 2) Fetch subscription flag
  const { data, error } = await supabase
    .from('users')
    .select('subscribed')
    .eq('id', userId)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ subscribed: data.subscribed });
}
