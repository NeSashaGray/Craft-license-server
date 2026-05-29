const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = req.body;
  if (typeof body === 'string') body = JSON.parse(body);
  const { key, hwid, device_info } = body || {};

  if (!key || !hwid) return res.status(400).json({ ok: false, error: 'Нет ключа или HWID' });

  // Получаем IP и геолокацию
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  let location = 'unknown';
  try {
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=ru&fields=country,city,isp`);
    const geo = await geoRes.json();
    if (geo.city) location = `${geo.country}, ${geo.city} · ${geo.isp}`;
  } catch(e) {}

  const full_info = `${device_info || 'unknown'} · IP: ${ip} · ${location}`;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) return res.status(403).json({ ok: false, error: 'Ключ не найден' });
  if (!data.active) return res.status(403).json({ ok: false, error: 'Ключ деактивирован' });

  if (!data.hwid) {
    await supabase.from('licenses').update({
      hwid,
      device_info: full_info,
      activated_at: new Date().toISOString()
    }).eq('key', key);
    return res.status(200).json({ ok: true });
  }

  if (data.hwid !== hwid) return res.status(403).json({ ok: false, error: 'Ключ привязан к другому устройству' });

  return res.status(200).json({ ok: true });
