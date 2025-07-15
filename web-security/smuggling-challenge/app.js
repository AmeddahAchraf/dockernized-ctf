// smuggling-challenge/app.js
const express = require('express');
const app = express();

// Custom request parser (vulnerable to HTTP request smuggling)
function parseRequest(req, res, next) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    // Vulnerable: Improper Content-Length handling
    const contentLength = req.headers['content-length'];
    const transferEncoding = req.headers['transfer-encoding'];
    
    if (transferEncoding === 'chunked') {
      // Vulnerable: Both TE and CL processing
      req.body = body;
    } else if (contentLength) {
      req.body = body.slice(0, parseInt(contentLength));
    }
    
    next();
  });
}

app.use(parseRequest);

// Admin endpoint
app.all('/admin', (req, res) => {
  const adminHeader = req.headers['x-admin-access'];
  
  if (adminHeader === 'true') {
    res.json({
      message: 'Admin access granted!',
      flag: process.env.FLAG_SMUGGLING,
      method: req.method,
      body: req.body
    });
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
});

// Public endpoint
app.all('/', (req, res) => {
  res.json({
    message: 'Public endpoint',
    method: req.method,
    headers: req.headers,
    body: req.body
  });
});

// Dashboard app (dashboard/app.js)
const express = require('express');
const dashboardApp = express();

dashboardApp.use(express.static('public'));

dashboardApp.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CTF Web Security Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .challenge { border: 1px solid #ccc; padding: 20px; margin: 20px 0; display: inline-block; width: 300px; }
        .challenge h3 { margin-top: 0; }
        .challenge a { text-decoration: none; color: #333; }
        .challenge:hover { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>CTF Web Security Challenges</h1>
        <p>Welcome to the modern web security CTF! Each challenge focuses on different vulnerabilities.</p>
        
        <div class="challenge">
          <h3>XSS & CSP Bypass</h3>
          <p>Modern DOM-based XSS with CSP bypass techniques</p>
          <a href="http://localhost:3001" target="_blank">Start Challenge</a>
        </div>
        
        <div class="challenge">
          <h3>JWT Authorization</h3>
          <p>JWT vulnerabilities and algorithm confusion attacks</p>
          <a href="http://localhost:3002" target="_blank">Start Challenge</a>
        </div>
        
        <div class="challenge">
          <h3>GraphQL Security</h3>
          <p>GraphQL introspection, injection, and batching attacks</p>
          <a href="http://localhost:3003" target="_blank">Start Challenge</a>
        </div>
        
        <div class="challenge">
          <h3>SSRF & Cloud Metadata</h3>
          <p>Server-side request forgery and cloud metadata access</p>
          <a href="http://localhost:3004" target="_blank">Start Challenge</a>
        </div>
        
        <div class="challenge">
          <h3>Prototype Pollution</h3>
          <p>JavaScript prototype pollution leading to RCE</p>
          <a href="http://localhost:3005" target="_blank">Start Challenge</a>
        </div>
        
        <div class="challenge">
          <h3>Deserialization</h3>
          <p>Unsafe deserialization vulnerabilities</p>
          <a href="http://localhost:3006" target="_blank">Start Challenge</a>
        </div>
        
        <div class="challenge">
          <h3>Race Conditions</h3>
          <p>TOCTOU and concurrent access vulnerabilities</p>
          <a href="http://localhost:3007" target="_blank">Start Challenge</a>
        </div>
        
        <div class="challenge">
          <h3>HTTP Request Smuggling</h3>
          <p>HTTP request smuggling attacks</p>
          <a href="http://localhost:3008" target="_blank">Start Challenge</a>
        </div>
        
        <div style="clear:both; margin-top: 40px;">
          <h2>Flag Format</h2>
          <p>All flags follow the format: <code>CTF{...}</code></p>
          
          <h2>Getting Started</h2>
          <ol>
            <li>Run <code>podman-compose up</code> to start all services</li>
            <li>Visit each challenge URL to explore the vulnerabilities</li>
            <li>Use tools like Burp Suite, curl, or custom scripts</li>
            <li>Look for modern web vulnerabilities and exploitation techniques</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `);
});

dashboardApp.listen(3000, () => {
  console.log('CTF Dashboard running on port 3000');
});