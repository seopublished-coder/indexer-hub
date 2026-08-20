const https = require('https');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const BLOG_ID = process.env.BLOGGER_BLOG_ID;

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token'
    }).toString();

    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(params)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.access_token) resolve(json.access_token);
            else reject(new Error('No access token: ' + data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(params);
    req.end();
  });
}

function createBloggerPost(accessToken, targetUrl) {
  return new Promise((resolve, reject) => {
    let domain = targetUrl;
    try {
      domain = new URL(targetUrl).hostname;
    } catch (e) {}

    const body = JSON.stringify({
      title: `Recently Discovered: ${domain}`,
      content: `<p>A new page was recently discovered for indexing.</p><p>Source: <a href="${targetUrl}" rel="noopener">${targetUrl}</a></p>`
    });

    const req = https.request(
      {
        hostname: 'www.googleapis.com',
        path: `/blogger/v3/blogs/${BLOG_ID}/posts/`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Only POST allowed');
    return;
  }

  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'url is required' });
      return;
    }

    const accessToken = await getAccessToken();
    const post = await createBloggerPost(accessToken, url);

    res.status(200).json({ success: true, postUrl: post.url, id: post.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
