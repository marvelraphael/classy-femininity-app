// api/check-sub.js
import { createClient } from '@supabase/supabase-js';
import { parse }        from 'cookie';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1) Parse cookies
  const cookies = parse(req.headers.cookie || '');
  const userId  = cookies.userId;

  // 2) If no userId, just return subscribed: false (200 OK)
  if (!userId) {
    return res.status(200).json({ subscribed: false });
  }

  // 3) Otherwise check your DB
  const { data, error } = await supabase
    .from('users')
    .select('subscribed')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ check-sub error:', error);
    // Still return 200 but mark as unsubscribed on error
    return res.status(200).json({ subscribed: false });
  }

  // 4) Return the true flag
  res.status(200).json({ subscribed: !!data.subscribed });
}
