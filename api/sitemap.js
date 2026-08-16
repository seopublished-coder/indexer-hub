const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data: entries } = await supabase
    .from('hub_entries')
    .select('hub_slug, added_at')
    .order('added_at', { ascending: false })
    .limit(5000);

  const urls = (entries || [])
    .map(
      (e) => `
  <url>
    <loc>https://${req.headers.host}/hub/${e.hub_slug}</loc>
    <lastmod>${e.added_at}</lastmod>
    <changefreq>daily</changefreq>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xml);
};
