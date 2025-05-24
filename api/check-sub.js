// api/check-sub.js
import { createClient } from '@supabase/supabase-js';
import { parse }        from 'cookie';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1) Read & parse the cookie header
  const cookies = parse(req.headers.cookie || '');
  const userId  = cookies.userId;
  if (!userId) {
    // no userId cookie → not logged in or not subscribed yet
    return res.status(401).json({ subscribed: false });
  }

  // 2) Lookup in Supabase
  const { data, error } = await supabase
    .from('users')
    .select('subscribed')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ check-sub error:', error);
    return res.status(500).json({ error: error.message });
  }

  // 3) Return the flag
  res.status(200).json({ subscribed: !!data.subscribed });
}
