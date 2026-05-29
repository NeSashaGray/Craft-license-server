const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { admin_password } = req.body;
  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ ok: false, error: 'Нет доступа' });
  }

  const key = 'CRAFT-' + crypto.randomBytes(8).toString('hex').toUpperCase();

  await supabase.from('licenses').insert({ key, active: true });

  return res.status(200).json({ ok: true, key });
}


{
  "name": "craft-license-server",
  "version": "1.0.0",
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0"
  }
}
