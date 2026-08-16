const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { slug } = req.query;

  const { data: entry } = await supabase
    .from('hub_entries')
    .select('target_url, added_at')
    .eq('hub_slug', slug)
    .single();

  if (!entry) {
    res.status(404).send('Not found');
    return;
  }

  let domain = entry.target_url;
  try {
    domain = new URL(entry.target_url).hostname;
  } catch (e) {}

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recently Indexed: ${domain}</title>
  <meta name="robots" content="index, follow">
</head>
<body>
  <article>
    <h1>Recently Indexed: ${domain}</h1>
    <p>This page tracks a newly submitted URL for search engine discovery, added on ${new Date(entry.added_at).toLocaleDateString()}.</p>
    <p>Source: <a href="${entry.target_url}" rel="noopener">${entry.target_url}</a></p>
  </article>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
