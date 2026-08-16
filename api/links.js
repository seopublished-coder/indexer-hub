const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data: entries } = await supabase
    .from('hub_entries')
    .select('hub_slug, added_at')
    .order('added_at', { ascending: false })
    .limit(500);

  const links = (entries || [])
    .map((e) => `https://${req.headers.host}/hub/${e.hub_slug}`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hub Links List</title>
  <style>
    body { font-family: monospace; background: #0f1117; color: #e6e6e6; padding: 20px; }
    textarea { width: 100%; height: 400px; background: #1a1d27; color: #e6e6e6; border: 1px solid #2a2d3a; padding: 10px; font-family: monospace; font-size: 13px; }
    button { background: #6c5ce7; color: white; border: none; border-radius: 8px; padding: 12px 20px; font-size: 15px; cursor: pointer; margin-top: 10px; }
    p { color: #8a8d9a; }
  </style>
</head>
<body>
  <h2>Hub Links (${(entries || []).length})</h2>
  <p>Ye saari links copy karke Search Console mein ek ek karke "URL Inspection" mein paste karke "Request Indexing" karo.</p>
  <textarea id="links" readonly>${links}</textarea>
  <br>
  <button onclick="copyAll()">Copy All</button>
  <script>
    function copyAll() {
      const el = document.getElementById('links');
      el.select();
      document.execCommand('copy');
      alert('Copied!');
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
