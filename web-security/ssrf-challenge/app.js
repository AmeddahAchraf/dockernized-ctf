const express = require('express');
const fetch = require('node-fetch');
const { URL } = require('url');
const crypto = require('crypto');
const { Buffer } = require('buffer');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Challenge flags
const FLAGS = {
  SSRF_BASIC: process.env.FLAG_SSRF_BASIC || 'CTF{ssrf_localhost_bypass_success}',
  SSRF_ADVANCED: process.env.FLAG_SSRF_ADVANCED || 'CTF{ssrf_internal_network_pwned}',
  SSRF_EXPERT: process.env.FLAG_SSRF_EXPERT || 'CTF{ssrf_cloud_metadata_extracted}',
  WEBHOOK_EXPLOIT: process.env.FLAG_WEBHOOK || 'CTF{webhook_ssrf_chain_attack}'
};

// Simulated internal network responses
const INTERNAL_RESPONSES = {
  '192.168.1.100': {
    service: 'Internal Database Admin',
    flag: FLAGS.SSRF_ADVANCED,
    data: { users: 1337, admin_panel: '/admin/dashboard' }
  },
  '10.0.0.50': {
    service: 'Jenkins CI/CD',
    flag: FLAGS.SSRF_EXPERT,
    build_secrets: 'super_secret_api_key_12345'
  }
};

// Rate limiting (bypassable)
const rateLimiter = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < 60000); // 1 minute window

  if (recentRequests.length >= 10) {
    return false;
  }

  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}

// Enhanced URL fetcher with multiple bypass opportunities
app.post('/fetch', async (req, res) => {
  const { url, method = 'GET', headers = {} } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!url) {
    return res.status(400).json({
      error: 'URL is required',
      hint: 'Try different URL formats and schemes'
    });
  }

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      hint: 'Rate limiting can sometimes be bypassed...'
    });
  }

  try {
    const parsedUrl = new URL(url);

    const blockedHosts = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1',
      '192.168.1.100', '10.0.0.50'
    ];

    const blockedSchemes = ['file', 'ftp'];

    if (blockedSchemes.includes(parsedUrl.protocol.slice(0, -1))) {
      return res.status(400).json({
        error: 'Blocked protocol',
        hint: 'Some protocols are blocked, but are there alternatives?'
      });
    }

    if (blockedHosts.some(host => parsedUrl.hostname.includes(host))) {
      return res.status(400).json({
        error: 'Access to internal hosts is blocked',
        hint: 'Try different IP representations: hex, octal, decimal...'
      });
    }

    if (parsedUrl.hostname === '192.168.1.100' || parsedUrl.hostname === '10.0.0.50') {
      const response = INTERNAL_RESPONSES[parsedUrl.hostname];
      return res.json({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(response, null, 2),
        source: 'internal_network'
      });
    }

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'SSRF-Challenge/2.0',
        ...headers
      }
    });

    const data = await response.text();
    res.json({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: data,
      source: 'external'
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      hint: 'Check your URL format and try different approaches'
    });
  }
});

// Internal metadata service
app.get('/internal/metadata', (req, res) => {
  res.json({
    message: 'Internal metadata service',
    flag: FLAGS.SSRF_BASIC,
    service_info: {
      version: '1.0.0',
      endpoints: ['/health', '/config', '/secrets'],
      last_updated: new Date().toISOString()
    }
  });
});

app.get('/internal/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    hint: 'Check other internal endpoints...'
  });
});

app.get('/internal/secrets', (req, res) => {
  res.json({
    message: 'Secret configuration endpoint',
    flag: FLAGS.SSRF_ADVANCED,
    secrets: {
      database_url: 'postgresql://admin:secret@internal-db:5432/ctf',
      api_key: 'sk-' + crypto.randomBytes(32).toString('hex'),
      jwt_secret: 'super_secret_jwt_key_' + Math.random()
    }
  });
});

// Cloud metadata simulation
app.get('/latest/meta-data/:path*', (req, res) => {
  const path = req.params.path + (req.params[0] || '');

  const metadata = {
    'instance-id': 'i-1234567890abcdef0',
    'ami-id': 'ami-0123456789abcdef0',
    'security-groups': 'sg-12345678',
    'iam/security-credentials/': 'ctf-challenge-role',
    'iam/security-credentials/ctf-challenge-role': {
      flag: FLAGS.SSRF_EXPERT,
      AccessKeyId: 'AKIAI' + crypto.randomBytes(15).toString('hex').toUpperCase(),
      SecretAccessKey: crypto.randomBytes(32).toString('base64'),
      Token: 'IQoJ' + crypto.randomBytes(200).toString('base64'),
      Expiration: new Date(Date.now() + 3600000).toISOString()
    }
  };

  if (metadata[path]) {
    res.json(metadata[path]);
  } else {
    res.status(404).json({ error: 'Metadata not found' });
  }
});

// Webhook validator
app.post('/webhook/validate', async (req, res) => {
  const { callback_url, validation_secret } = req.body;

  if (!callback_url) {
    return res.status(400).json({
      error: 'callback_url is required',
      hint: 'Webhooks can be used for blind SSRF attacks'
    });
  }

  try {
    const payload = {
      validation_token: 'webhook_token_' + crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      challenge: validation_secret || 'default_secret'
    };

    const response = await fetch(callback_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': crypto.createHmac('sha256', 'webhook_secret').update(JSON.stringify(payload)).digest('hex')
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();

    if (responseData.includes('webhook_validation_success')) {
      res.json({
        message: 'Webhook validation successful',
        flag: FLAGS.WEBHOOK_EXPLOIT,
        status: response.status,
        response: responseData
      });
    } else {
      res.json({
        message: 'Webhook validation sent',
        status: response.status,
        hint: 'Make your webhook return "webhook_validation_success" for a special reward'
      });
    }

  } catch (error) {
    res.status(500).json({
      error: error.message,
      hint: 'Webhook validation failed - check your endpoint'
    });
  }
});

// Image proxy
app.get('/proxy/image', async (req, res) => {
  const { url, resize, format } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'URL parameter is required',
      hint: 'Image proxy can access any URL...'
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ImageProxy/1.0 (SSRF-Challenge)'
      }
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.set('Content-Type', contentType);
    res.set('X-Original-URL', url);
    res.set('X-Proxy-Status', 'success');
    res.set('X-Image-Size', buffer.length);
    if (resize) res.set('X-Resize-Param', resize);
    if (format) res.set('X-Format-Param', format);

    res.send(buffer);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      hint: 'Image proxy failed - try different URLs or formats'
    });
  }
});

// Admin panel
app.get('/admin/dashboard', (req, res) => {
  res.json({
    message: 'Admin Dashboard',
    flag: FLAGS.SSRF_BASIC,
    admin_info: {
      current_users: 42,
      system_health: 'optimal',
      last_login: new Date().toISOString(),
      secret_endpoint: '/admin/secrets'
    }
  });
});

// Debug endpoint
app.get('/debug/network', (req, res) => {
  res.json({
    message: 'Network debug information',
    internal_hosts: [
      '192.168.1.100 - Database Server',
      '10.0.0.50 - Jenkins CI/CD',
      '169.254.169.254 - Cloud Metadata'
    ],
    hint: 'These internal hosts might be interesting to explore...'
  });
});

// Main page (updated route from above)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SSRF Challenge - Advanced URL Fetcher</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .header p {
          font-size: 1.2em;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .panel {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 10px;
          padding: 25px;
          margin-bottom: 25px;
          transition: transform 0.3s ease;
        }
        .panel:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .panel h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.3em;
        }
        .input-group {
          margin-bottom: 15px;
        }
        .input-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #495057;
        }
        input[type="text"], select {
          width: 100%;
          max-width: 500px;
          padding: 12px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s ease;
        }
        input[type="text"]:focus, select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }
        .btn-primary {
          background: #3498db;
          color: white;
        }
        .btn-primary:hover {
          background: #2980b9;
          transform: translateY(-1px);
        }
        .btn-secondary {
          background: #95a5a6;
          color: white;
        }
        .btn-secondary:hover {
          background: #7f8c8d;
        }
        .btn-danger {
          background: #e74c3c;
          color: white;
        }
        .btn-danger:hover {
          background: #c0392b;
        }
        .result {
          background: #2c3e50;
          color: #ecf0f1;
          padding: 20px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          white-space: pre-wrap;
          overflow-x: auto;
          max-height: 400px;
          overflow-y: auto;
        }
        .hints {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
        }
        .hints h3 {
          color: #856404;
          margin-bottom: 15px;
        }
        .hints ul {
          color: #856404;
          padding-left: 20px;
        }
        .hints li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .flag-counter {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
        }
        .flag-counter h4 {
          color: #155724;
          margin-bottom: 5px;
        }
        .progress-bar {
          width: 100%;
          height: 10px;
          background: #e9ecef;
          border-radius: 5px;
          overflow: hidden;
          margin-top: 10px;
        }
        .progress-fill {
          height: 100%;
          background: #28a745;
          transition: width 0.3s ease;
          width: 0%;
        }
        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 2px solid #dee2e6;
        }
        .tab {
          padding: 15px 25px;
          cursor: pointer;
          border: none;
          background: none;
          font-size: 16px;
          font-weight: 600;
          color: #6c757d;
          transition: all 0.3s ease;
        }
        .tab.active {
          color: #3498db;
          border-bottom: 2px solid #3498db;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
        @media (max-width: 768px) {
          .button-group {
            flex-direction: column;
          }
          button {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔍 SSRF Challenge Lab</h1>
          <p>Advanced Server-Side Request Forgery Testing Environment</p>
        </div>
        
        <div class="content">
          <div class="flag-counter">
            <h4>🏆 Progress: <span id="flagCount">0</span>/4 Flags Captured</h4>
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
          </div>
          
          <div class="tabs">
            <button class="tab active" data-tab="fetch">URL Fetcher</button>
            <button class="tab" data-tab="webhook">Webhook Validator</button>
            <button class="tab" data-tab="proxy">Image Proxy</button>
            <button class="tab" data-tab="tools">Debug Tools</button>
          </div>
          
          <div id="fetch" class="tab-content active">
            <div class="panel">
              <h3>🌐 Advanced URL Fetcher</h3>
              <div class="input-group">
                <label for="fetchUrl">Target URL:</label>
                <input type="text" id="fetchUrl" placeholder="https://httpbin.org/get" 
                       value="https://httpbin.org/get">
              </div>
              <div class="input-group">
                <label for="fetchMethod">HTTP Method:</label>
                <select id="fetchMethod">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div class="button-group">
                <button class="btn-primary" onclick="fetchUrl()">🚀 Fetch URL</button>
                <button class="btn-secondary" onclick="testInternal()">🔍 Test Internal</button>
                <button class="btn-danger" onclick="testMetadata()">☁️ Test Metadata</button>
              </div>
            </div>
          </div>
          
          <div id="webhook" class="tab-content">
            <div class="panel">
              <h3>🔗 Webhook Validator</h3>
              <div class="input-group">
                <label for="webhookUrl">Callback URL:</label>
                <input type="text" id="webhookUrl" placeholder="https://webhook.site/unique-id" 
                       value="https://httpbin.org/post">
              </div>
              <div class="input-group">
                <label for="validationSecret">Validation Secret:</label>
                <input type="text" id="validationSecret" placeholder="optional_secret">
              </div>
              <div class="button-group">
                <button class="btn-primary" onclick="validateWebhook()">✅ Validate Webhook</button>
                <button class="btn-secondary" onclick="testBlindSSRF()">🕵️ Test Blind SSRF</button>
              </div>
            </div>
          </div>
          
          <div id="proxy" class="tab-content">
            <div class="panel">
              <h3>🖼️ Image Proxy Service</h3>
              <div class="input-group">
                <label for="imageUrl">Image URL:</label>
                <input type="text" id="imageUrl" placeholder="https://httpbin.org/image/png" 
                       value="https://httpbin.org/image/png">
              </div>
              <div class="input-group">
                <label for="imageFormat">Format:</label>
                <select id="imageFormat">
                  <option value="">Original</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
              <div class="button-group">
                <button class="btn-primary" onclick="proxyImage()">🔄 Proxy Image</button>
                <button class="btn-secondary" onclick="testImageSSRF()">🎯 Test SSRF</button>
              </div>
            </div>
          </div>
          
          <div id="tools" class="tab-content">
            <div class="panel">
              <h3>🛠️ Debug Tools</h3>
              <div class="button-group">
                <button class="btn-primary" onclick="getNetworkInfo()">🌐 Network Info</button>
                <button class="btn-secondary" onclick="testEndpoints()">🔍 Test Endpoints</button>
                <button class="btn-danger" onclick="clearResult()">🗑️ Clear Results</button>
              </div>
            </div>
          </div>
          
          <div class="panel">
            <h3>📊 Results</h3>
            <div id="result" class="result">Ready to test SSRF vulnerabilities...</div>
          </div>
          
          <div class="panel hints">
            <h3>💡 Challenge Hints & Techniques</h3>
            <ul>
              <li><strong>Basic SSRF:</strong> Try accessing localhost and 127.0.0.1 directly</li>
              <li><strong>Bypass Techniques:</strong> Use different IP representations (hex: 0x7f000001, octal: 0177.0.0.1, decimal: 2130706433)</li>
              <li><strong>URL Schemes:</strong> Test file://, ftp://, gopher://, dict:// protocols</li>
              <li><strong>Internal Networks:</strong> Explore 192.168.1.100 and 10.0.0.50 for hidden services</li>
              <li><strong>Cloud Metadata:</strong> Try accessing 169.254.169.254 (AWS/GCP metadata endpoint)</li>
              <li><strong>Blind SSRF:</strong> Use webhook validation for out-of-band data extraction</li>
              <li><strong>DNS Rebinding:</strong> Use services like http://localtest.me to bypass filters</li>
              <li><strong>HTTP Methods:</strong> Try different HTTP methods (POST, PUT, DELETE)</li>
              <li><strong>Rate Limiting:</strong> Some endpoints have rate limiting - can you bypass it?</li>
              <li><strong>Header Injection:</strong> Try injecting custom headers via URL parameters</li>
            </ul>
          </div>
        </div>
      </div>
      
      <script>
        var flagsFound = new Set();
        
        function updateProgress() {
          var flagCount = flagsFound.size;
          document.getElementById('flagCount').textContent = flagCount;
          document.getElementById('progressFill').style.width = (flagCount / 4) * 100 + '%';
        }
        
        function checkForFlags(response) {
          var responseText = JSON.stringify(response);
          var flagPattern = /CTF\\{[^}]+\\}/g;
          var matches = responseText.match(flagPattern);
          
          if (matches) {
            matches.forEach(function(flag) {
              if (!flagsFound.has(flag)) {
                flagsFound.add(flag);
                showNotification('🏆 Flag Found: ' + flag);
              }
            });
            updateProgress();
          }
        }
        
        function showNotification(message) {
          var notification = document.createElement('div');
          notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000; animation: slideIn 0.3s ease;';
          notification.textContent = message;
          document.body.appendChild(notification);
          
          setTimeout(function() {
            notification.remove();
          }, 5000);
        }
        
        function switchTab(tabName) {
          document.querySelectorAll('.tab-content').forEach(function(content) {
            content.classList.remove('active');
          });
          document.querySelectorAll('.tab').forEach(function(tab) {
            tab.classList.remove('active');
          });
          document.getElementById(tabName).classList.add('active');
          document.querySelector('.tab[data-tab="' + tabName + '"]').classList.add('active');
        }
        
        // Add event listeners for tabs
        document.querySelectorAll('.tab').forEach(function(tab) {
          tab.addEventListener('click', function() {
            var tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
          });
        });
        
        async function fetchUrl() {
          var url = document.getElementById('fetchUrl').value;
          var method = document.getElementById('fetchMethod').value;
          
          try {
            var response = await fetch('/fetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: url, method: method })
            });
            
            var data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            checkForFlags(data);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
        
        async function validateWebhook() {
          var callback_url = document.getElementById('webhookUrl').value;
          var validation_secret = document.getElementById('validationSecret').value;
          
          try {
            var response = await fetch('/webhook/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ callback_url: callback_url, validation_secret: validation_secret })
            });
            
            var data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            checkForFlags(data);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
        
        async function proxyImage() {
          var url = document.getElementById('imageUrl').value;
          var format = document.getElementById('imageFormat').value;
          
          try {
            var params = new URLSearchParams({ url: url });
            if (format) params.append('format', format);
            
            var response = await fetch('/proxy/image?' + params.toString());
            
            if (response.ok) {
              var headers = {};
              response.headers.forEach(function(value, key) {
                headers[key] = value;
              });
              
              var result = {
                message: 'Image proxied successfully',
                status: response.status,
                headers: headers,
                size: response.headers.get('X-Image-Size') || 'unknown'
              };
              
              document.getElementById('result').textContent = JSON.stringify(result, null, 2);
              checkForFlags(result);
            } else {
              var data = await response.json();
              document.getElementById('result').textContent = JSON.stringify(data, null, 2);
              checkForFlags(data);
            }
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
        
        function testInternal() {
          document.getElementById('fetchUrl').value = 'http://localhost:3000/internal/metadata';
          fetchUrl();
        }
        
        function testMetadata() {
          document.getElementById('fetchUrl').value = 'http://169.254.169.254/latest/meta-data/iam/security-credentials/';
          fetchUrl();
        }
        
        function testBlindSSRF() {
          document.getElementById('webhookUrl').value = 'http://localhost:3000/internal/secrets';
          validateWebhook();
        }
        
        function testImageSSRF() {
          document.getElementById('imageUrl').value = 'http://localhost:3000/internal/metadata';
          proxyImage();
        }
        
        async function getNetworkInfo() {
          try {
            var response = await fetch('/debug/network');
            var data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            checkForFlags(data);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
        
        async function testEndpoints() {
          var endpoints = [
            '/internal/health',
            '/internal/secrets',
            '/admin/dashboard',
            '/latest/meta-data/instance-id'
          ];
          
          var results = [];
          
          for (var endpoint of endpoints) {
            try {
              var response = await fetch('/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'http://localhost:3000' + endpoint })
              });
              
              var data = await response.json();
              results.push({
                endpoint: endpoint,
                status: data.status || 'error',
                accessible: !data.error
              });
              
              checkForFlags(data);
            } catch (error) {
              results.push({
                endpoint: endpoint,
                status: 'error',
                accessible: false,
                error: error.message
              });
            }
          }
          
          document.getElementById('result').textContent = JSON.stringify({
            message: 'Endpoint scan results',
            results: results
          }, null, 2);
        }
        
        function clearResult() {
          document.getElementById('result').textContent = 'Results cleared. Ready for next test...';
        }
        
        // Initialize progress
        updateProgress();
      </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});