// jwt-challenge/app.js
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Multiple secrets for different attack vectors
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_2024';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'super_admin_secret_key_xyz';
const WEAK_SECRET = 'secret'; // Intentionally weak for brute force

// Rate limiting simulation
const rateLimitStore = new Map();

// Obfuscated function names and logic
const verifyAuthToken = (token, bypassChecks = false) => {
  try {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || !decoded.header || !decoded.payload) {
      return null;
    }

    // Multi-layer algorithm validation
    const alg = decoded.header.alg;

    // Hidden backdoor - only works with specific timestamp
    if (alg === 'none' && decoded.payload.iat &&
        decoded.payload.iat === 1234567890 && bypassChecks) {
      return decoded.payload;
    }

    // Algorithm confusion vulnerabilities
    if (alg === 'HS256') {
      return jwt.verify(token, JWT_SECRET);
    } else if (alg === 'RS256') {
      // Simulate RS256 but actually use HS256 validation
      return jwt.verify(token, JWT_SECRET);
    } else if (alg === 'HS512') {
      // Different secret for HS512
      return jwt.verify(token, WEAK_SECRET);
    }

    return null;
  } catch (err) {
    return null;
  }
};

// Enhanced user system with roles and permissions
const userDatabase = {
  'guest': { password: 'guest', role: 'guest', permissions: ['read'] },
  'user': { password: 'password123', role: 'user', permissions: ['read', 'write'] },
  'admin': { password: 'super_secret_admin_password', role: 'admin', permissions: ['read', 'write', 'admin'] },
  'service': { password: 'service_account_2024!', role: 'service', permissions: ['read', 'write', 'service'] },
  'root': { password: 'hidden_root_access_key', role: 'root', permissions: ['*'] }
};

// Rate limiting function
const checkRateLimit = (req, endpoint) => {
  const key = `${req.ip}_${endpoint}`;
  const now = Date.now();

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 });
    return true;
  }

  const limit = rateLimitStore.get(key);
  if (now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (limit.count >= 10) {
    return false;
  }

  limit.count++;
  return true;
};

// Login endpoint with enhanced security
app.post('/login', (req, res) => {
  if (!checkRateLimit(req, 'login')) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const { username, password } = req.body;

  // Input validation
  if (!username || !password || username.length > 50 || password.length > 100) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  const user = userDatabase[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Multi-tier token generation
  let secret = JWT_SECRET;
  if (user.role === 'admin') {
    secret = ADMIN_SECRET;
  } else if (user.role === 'service') {
    secret = WEAK_SECRET;
  }

  const payload = {
    username,
    role: user.role,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'jwt-challenge-server',
    sub: username
  };

  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  res.json({ token, hint: 'Different users may have different secrets...' });
});

// Profile endpoint
app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.json({
    user: decoded,
    server_time: Date.now(),
    permissions: decoded.permissions || ['read']
  });
});

// Multi-tier admin system
app.get('/admin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (decoded.role !== 'admin' && decoded.role !== 'root') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Additional check for admin permissions
  if (!decoded.permissions || !decoded.permissions.includes('admin')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  res.json({
    message: 'Admin access granted!',
    flag_part_1: 'FLAG{jwt_',
    hint: 'This is only part of the flag. You need root access for the rest.',
    available_endpoints: ['/admin/users', '/admin/logs', '/super-admin'],
    secret_data: 'Sensitive admin information'
  });
});

// Hidden super admin endpoint
app.get('/super-admin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyAuthToken(token, true); // Enable bypass checks
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (decoded.role !== 'root') {
    return res.status(403).json({ error: 'Root access required' });
  }

  // Additional timestamp check
  if (!decoded.iat || decoded.iat !== 1234567890) {
    return res.status(403).json({ error: 'Invalid timestamp' });
  }

  res.json({
    message: 'Root access granted!',
    flag_part_2: 'security_is_',
    hint: 'Still not complete. Check the service endpoint.',
    root_privileges: true
  });
});

// Service endpoint requiring specific algorithm
app.get('/service', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Decode to check algorithm
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || decoded.header.alg !== 'HS512') {
    return res.status(400).json({ error: 'Service endpoint requires HS512 algorithm' });
  }

  const verified = verifyAuthToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (verified.role !== 'service' && verified.role !== 'root') {
    return res.status(403).json({ error: 'Service access required' });
  }

  res.json({
    message: 'Service access granted!',
    flag_part_3: 'hard_to_break}',
    hint: 'Congratulations! You found all parts of the flag.',
    complete_flag: 'FLAG{jwt_security_is_hard_to_break}'
  });
});

// Obfuscated debug endpoint
app.get('/debug/jwt', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = jwt.decode(token, { complete: true });

  // Selective information disclosure
  const response = {
    header: decoded.header,
    payload: {
      ...decoded.payload,
      // Hide sensitive fields
      password: undefined,
      secret: undefined
    },
    algorithms_supported: ['HS256', 'RS256', 'HS512', 'none'],
    hints: [
      'Different users may use different secrets',
      'Some algorithms are weaker than others',
      'Timestamps might be important',
      'Check for hidden endpoints',
      'Service accounts have special privileges'
    ]
  };

  res.json(response);
});

// Misleading public key endpoint
app.get('/public-key', (req, res) => {
  const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
fGnJm6gOdrj8ym3rFkEjWT2btf7LTfcWCfPHgNZfWWrJJrOFZ8fNUHJBZdJCE8J3
3YZwTFFjjJJjlRg6QJJkQfSHJiCnCOhFKMjSQnfwWVPZKCHoYiKrNrQwE+VkF2Mh
rF/OZuKXVgPgFrHAYKiNlnkdOmQJlFJAyXNqnhJ3GCqNVwMCjPHPFgYMGKB/hUMJ
kz6b0HKgHdYQCELYQNKgBnKTFONJ6/dXJsQnMQ5sKe9qmAjpSVWE8xdqUfBxdJPt
DWOzKQrOUHDdTHgGcJt4GcJBuUoZEsxkTKhHGIFD7qGOFVSrqWcaJFKgEjMUwPzY
6wIDAQAB
-----END PUBLIC KEY-----`;

  res.json({
    publicKey,
    note: 'This key might not be what you think it is...',
    algorithm: 'RS256',
    hint: 'Algorithm confusion attacks are still possible'
  });
});

// Hidden users endpoint
app.get('/admin/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded || decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const users = Object.keys(userDatabase).map(username => ({
    username,
    role: userDatabase[username].role,
    permissions: userDatabase[username].permissions
  }));

  res.json({
    users,
    hint: 'Notice the service and root accounts...',
    note: 'Different accounts might use different secrets'
  });
});

// Endpoint discovery hint
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /admin/
Disallow: /debug/
Disallow: /super-admin
Disallow: /service
Disallow: /admin/users
Disallow: /admin/logs

# Hidden endpoints for security testing
# Remember: security through obscurity is not security
`);
});

// Main page with misleading hints
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>JWT Security Challenge</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
          color: #e0e0e0;
          min-height: 100vh;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .header h1 {
          font-size: 2.5rem;
          color: #ff6b6b;
          margin-bottom: 1rem;
          text-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
        }
        
        .header p {
          font-size: 1.1rem;
          color: #b0b0b0;
        }
        
        .difficulty-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: linear-gradient(45deg, #ff6b6b, #ee5a52);
          color: white;
          border-radius: 20px;
          font-weight: bold;
          margin: 1rem 0;
        }
        
        .challenge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }
        
        .challenge-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: 12px;
          padding: 2rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .challenge-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.1);
          border-color: rgba(255, 107, 107, 0.4);
        }
        
        .challenge-card h3 {
          color: #ff6b6b;
          margin-bottom: 1rem;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .input-group {
          margin-bottom: 1rem;
        }
        
        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #b0b0b0;
          font-size: 0.9rem;
        }
        
        input[type="text"], input[type="password"] {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #e0e0e0;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        input[type="text"]:focus, input[type="password"]:focus {
          outline: none;
          border-color: #ff6b6b;
          box-shadow: 0 0 10px rgba(255, 107, 107, 0.2);
        }
        
        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 0.5rem 0.5rem 0.5rem 0;
          background: linear-gradient(45deg, #ff6b6b, #ee5a52);
          color: #fff;
          font-weight: bold;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
        }
        
        .btn-secondary {
          background: linear-gradient(45deg, #ffc107, #ffb300);
          color: #000;
        }
        
        .result {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: 6px;
          padding: 1rem;
          margin-top: 1rem;
          font-family: 'Courier New', monospace;
          white-space: pre-wrap;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .hints {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 2rem;
        }
        
        .hints h3 {
          color: #ffc107;
          margin-bottom: 1rem;
        }
        
        .hints ul {
          list-style-type: none;
          padding-left: 0;
        }
        
        .hints li {
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
          position: relative;
        }
        
        .hints li:before {
          content: "🔥";
          position: absolute;
          left: 0;
        }
        
        .warning {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 2rem;
        }
        
        .warning h3 {
          color: #dc3545;
          margin-bottom: 1rem;
        }
        
        .code-snippet {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: 6px;
          padding: 1rem;
          margin: 1rem 0;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔥 Advanced JWT Security Challenge</h1>
          <p>Multi-layer JWT exploitation challenge - Find all flag parts!</p>
        </div>
        
        <div class="challenge-grid">
          <div class="challenge-card">
            <h3>🔐 Authentication</h3>
            <div class="input-group">
              <label for="username">Username:</label>
              <input type="text" id="username" placeholder="Enter username" value="guest">
            </div>
            <div class="input-group">
              <label for="password">Password:</label>
              <input type="password" id="password" placeholder="Enter password" value="guest">
            </div>
            <button class="btn" onclick="login()">Login</button>
            <button class="btn btn-secondary" onclick="tryAdmin()">Try Admin</button>
          </div>
          
          <div class="challenge-card">
            <h3>👤 Profile Access</h3>
            <p>View your profile and permissions</p>
            <button class="btn" onclick="getProfile()">Get Profile</button>
          </div>
          
          <div class="challenge-card">
            <h3>🛡️ Admin Panel</h3>
            <p>Admin access required - First flag part here</p>
            <button class="btn" onclick="getAdmin()">Access Admin</button>
            <button class="btn btn-secondary" onclick="getUsers()">List Users</button>
          </div>
          
          <div class="challenge-card">
            <h3>🔍 Debug Tools</h3>
            <p>Analyze JWT token structure</p>
            <button class="btn" onclick="debugJWT()">Debug JWT</button>
            <button class="btn btn-secondary" onclick="getPublicKey()">Get Public Key</button>
          </div>
        </div>
        
        <div class="result" id="result">
          Welcome to the Advanced JWT Security Challenge!
          This is a multi-stage challenge requiring multiple attack vectors.
          
          Objective: Find all parts of the flag by exploiting JWT vulnerabilities.
        </div>
        
        <div class="hints">
          <h3>🔥 Advanced Exploitation Hints</h3>
          <ul>
            <li>Multiple user accounts exist - each may use different secrets</li>
            <li>The flag is split across multiple endpoints requiring different access levels</li>
            <li>Algorithm confusion attacks are possible with different secrets</li>
            <li>Some endpoints have hidden requirements (timestamps, algorithms)</li>
            <li>Check robots.txt for endpoint discovery</li>
            <li>Service accounts might have special privileges</li>
            <li>Brute force attacks on weak secrets might be necessary</li>
            <li>The 'none' algorithm has hidden conditions</li>
          </ul>
        </div>
        
        <div class="warning">
          <h3>⚠️ Challenge Requirements</h3>
          <p><strong>Multi-Stage Attack:</strong> This challenge requires chaining multiple vulnerabilities:</p>
          <ul>
            <li>User enumeration and credential discovery</li>
            <li>Algorithm confusion attacks</li>
            <li>Secret key brute forcing</li>
            <li>Timestamp manipulation</li>
            <li>Privilege escalation</li>
            <li>Hidden endpoint discovery</li>
          </ul>
        </div>
      </div>
      
      <script>
        let currentToken = '';
        
        function updateResult(data) {
          document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        }
        
        async function login() {
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          
          try {
            const response = await fetch('/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (data.token) {
              currentToken = data.token;
              updateResult({ message: 'Login successful!', token: data.token, hint: data.hint });
            } else {
              updateResult({ error: 'Login failed', details: data.error });
            }
          } catch (error) {
            updateResult({ error: error.message });
          }
        }
        
        async function tryAdmin() {
          document.getElementById('username').value = 'admin';
          document.getElementById('password').value = 'super_secret_admin_password';
          await login();
        }
        
        async function getProfile() {
          if (!currentToken) {
            updateResult({ error: 'Please login first' });
            return;
          }
          
          try {
            const response = await fetch('/profile', {
              headers: { 'Authorization': 'Bearer ' + currentToken }
            });
            const data = await response.json();
            updateResult(data);
          } catch (error) {
            updateResult({ error: error.message });
          }
        }
        
        async function getAdmin() {
          if (!currentToken) {
            updateResult({ error: 'Please login first' });
            return;
          }
          
          try {
            const response = await fetch('/admin', {
              headers: { 'Authorization': 'Bearer ' + currentToken }
            });
            const data = await response.json();
            updateResult(data);
          } catch (error) {
            updateResult({ error: error.message });
          }
        }
        
        async function getUsers() {
          if (!currentToken) {
            updateResult({ error: 'Please login first' });
            return;
          }
          
          try {
            const response = await fetch('/admin/users', {
              headers: { 'Authorization': 'Bearer ' + currentToken }
            });
            const data = await response.json();
            updateResult(data);
          } catch (error) {
            updateResult({ error: error.message });
          }
        }
        
        async function debugJWT() {
          if (!currentToken) {
            updateResult({ error: 'Please login first' });
            return;
          }
          
          try {
            const response = await fetch('/debug/jwt', {
              headers: { 'Authorization': 'Bearer ' + currentToken }
            });
            const data = await response.json();
            updateResult(data);
          } catch (error) {
            updateResult({ error: error.message });
          }
        }
        
        async function getPublicKey() {
          try {
            const response = await fetch('/public-key');
            const data = await response.json();
            updateResult(data);
          } catch (error) {
            updateResult({ error: error.message });
          }
        }
        
        // Hidden function for advanced users
        async function accessEndpoint(endpoint) {
          if (!currentToken) {
            updateResult({ error: 'Please login first' });
            return;
          }
          
          try {
            const response = await fetch(endpoint, {
              headers: { 'Authorization': 'Bearer ' + currentToken }
            });
            const data = await response.json();
            updateResult(data);
          } catch (error) {
            updateResult({ error: error.message });
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Advanced JWT Challenge running on port 3000');
});