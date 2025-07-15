const express = require('express');
const _ = require('lodash');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Vulnerable merge function
function vulnerableMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (typeof target[key] === 'object' && target[key] !== null) {
        vulnerableMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// User preferences endpoint (vulnerable to prototype pollution)
app.post('/preferences', (req, res) => {
  const { userId, preferences } = req.body;

  if (!userId || !preferences) {
    return res.status(400).json({ error: 'userId and preferences are required' });
  }

  const userData = {
    id: userId,
    settings: {
      theme: 'light',
      notifications: true
    }
  };

  vulnerableMerge(userData, preferences);

  res.json({
    message: 'Preferences updated',
    user: userData
  });
});

// Config update endpoint (vulnerable via lodash merge)
app.post('/config', (req, res) => {
  const { config } = req.body;

  if (!config) {
    return res.status(400).json({ error: 'config is required' });
  }

  const defaultConfig = {
    app: {
      name: 'CTF App',
      version: '1.0.0'
    }
  };

  const mergedConfig = _.merge(defaultConfig, config);

  res.json({
    message: 'Configuration updated',
    config: mergedConfig
  });
});

// Template rendering (vulnerable to prototype pollution RCE)
app.post('/render', (req, res) => {
  const { template, data } = req.body;

  if (!template) {
    return res.status(400).json({ error: 'template is required' });
  }

  let result = template;

  if (Object.prototype.constructor) {
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data && data[key] ? data[key] : match;
    });
  }

  if (Object.prototype.sourceURL) {
    try {
      result = eval(Object.prototype.sourceURL);
    } catch (e) {
      // Ignore errors
    }
  }

  res.json({
    message: 'Template rendered',
    result: result
  });
});

// Admin endpoint (checks for admin flag)
app.get('/admin', (req, res) => {
  if (Object.prototype.isAdmin) {
    res.json({
      message: 'Admin access granted via prototype pollution!',
      flag: process.env.FLAG_PROTOTYPE || 'CTF{prototype_pollution_success}',
      admin_data: 'Sensitive admin information'
    });
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
});

// Check pollution endpoint
app.get('/check', (req, res) => {
  const pollutedProps = [];

  if (Object.prototype.polluted) pollutedProps.push('polluted');
  if (Object.prototype.isAdmin) pollutedProps.push('isAdmin');
  if (Object.prototype.constructor) pollutedProps.push('constructor');
  if (Object.prototype.sourceURL) pollutedProps.push('sourceURL');
  if (Object.prototype.valueOf) pollutedProps.push('valueOf');

  res.json({
    message: 'Prototype pollution check',
    polluted_properties: pollutedProps,
    object_prototype: Object.prototype
  });
});

// Main page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prototype Pollution Challenge</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
          color: #2c3e50;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 2.2em;
          margin-bottom: 10px;
        }
        .header p {
          font-size: 1.1em;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .panel {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          transition: transform 0.3s ease;
        }
        .panel:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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
        textarea, input[type="text"], select {
          width: 100%;
          padding: 12px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          transition: border-color 0.3s ease;
        }
        textarea:focus, input:focus, select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        textarea {
          min-height: 120px;
          resize: vertical;
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
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
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
          background: #6c757d;
          color: white;
        }
        .btn-secondary:hover {
          background: #5a6268;
        }
        .result {
          background: #2c3e50;
          color: #ecf0f1;
          padding: 15px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          white-space: pre-wrap;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;
          margin-top: 10px;
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
          line-height: 1.6;
        }
        .hints li {
          margin-bottom: 10px;
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
          <h1>🔧 Prototype Pollution Challenge</h1>
          <p>Master JavaScript Object Manipulation in this CTF Lab</p>
        </div>
        
        <div class="content">
          <div class="panel">
            <h3>⚙️ Update Preferences</h3>
            <div class="input-group">
              <label for="preferences">Preferences JSON:</label>
              <textarea id="preferences" placeholder="Enter preferences JSON">{
  "settings": {
    "theme": "dark",
    "language": "en"
  }
}</textarea>
            </div>
            <div class="button-group">
              <button class="btn-primary" data-action="update-preferences">Update Preferences</button>
              <button class="btn-secondary" data-action="load-pollution-example">Load Pollution Example</button>
            </div>
          </div>
          
          <div class="panel">
            <h3>🛠️ Update Configuration</h3>
            <div class="input-group">
              <label for="config">Config JSON:</label>
              <textarea id="config" placeholder="Enter config JSON">{
  "app": {
    "debug": true
  }
}</textarea>
            </div>
            <div class="button-group">
              <button class="btn-primary" data-action="update-config">Update Config</button>
              <button class="btn-secondary" data-action="load-lodash-example">Load Lodash Example</button>
            </div>
          </div>
          
          <div class="panel">
            <h3>📄 Template Rendering</h3>
            <div class="input-group">
              <label for="template">Template:</label>
              <textarea id="template" placeholder="Enter template">Hello {{name}}, welcome to {{app}}!</textarea>
            </div>
            <div class="input-group">
              <label for="templateData">Data JSON:</label>
              <textarea id="templateData" placeholder="Enter data JSON">{
  "name": "User",
  "app": "CTF App"
}</textarea>
            </div>
            <div class="button-group">
              <button class="btn-primary" data-action="render-template">Render Template</button>
            </div>
          </div>
          
          <div class="panel">
            <h3>🔐 Admin Access</h3>
            <div class="button-group">
              <button class="btn-primary" data-action="check-admin">Check Admin Access</button>
            </div>
          </div>
          
          <div class="panel">
            <h3>🔍 Pollution Check</h3>
            <div class="button-group">
              <button class="btn-primary" data-action="check-pollution">Check Prototype Pollution</button>
            </div>
          </div>
          
          <div class="panel">
            <h3>📊 Results</h3>
            <div id="result" class="result">Ready to test prototype pollution...</div>
          </div>
          
          <div class="panel hints">
            <h3>💡 Hints & Techniques</h3>
            <ul>
              <li><strong>Understand Prototype Pollution</strong>: JavaScript objects inherit properties from <code>Object.prototype</code>. Modifying this prototype can affect all objects, leading to unexpected behavior.</li>
              <li><strong>Identify Vulnerable Endpoints</strong>: Look for endpoints that merge user input into objects without sanitizing special keys like <code>__proto__</code> or <code>constructor</code>.</li>
              <li><strong>Test Object Merging</strong>: Try injecting a JSON payload with <code>{"__proto__": {"key": "value"}}</code> in the Preferences or Config endpoints to see if it alters <code>Object.prototype</code>.</li>
              <li><strong>Check for Admin Access</strong>: The <code>/admin</code> endpoint checks <code>Object.prototype.isAdmin</code>. Can you set this property to <code>true</code> using one of the endpoints?</li>
              <li><strong>Explore Lodash Merge</strong>: The <code>/config</code> endpoint uses Lodash’s <code>_.merge</code>, which is known to be vulnerable to prototype pollution in older versions. Experiment with nested objects like <code>constructor.prototype</code>.</li>
              <li><strong>Template Rendering Risks</strong>: The <code>/render</code> endpoint may execute code if <code>Object.prototype.sourceURL</code> is polluted. Try setting this property to a JavaScript expression.</li>
              <li><strong>Use the Pollution Checker</strong>: The <code>/check</code> endpoint shows which <code>Object.prototype</code> properties are modified. Use it to verify your pollution attempts.</li>
              <li><strong>Escalation to RCE</strong>: If you can pollute <code>Object.prototype.sourceURL</code>, the <code>/render</code> endpoint’s <code>eval</code> call might allow code execution. Be cautious and test simple expressions first.</li>
              <li><strong>Reset Between Attempts</strong>: Prototype pollution persists across requests. Restart the server to clear <code>Object.prototype</code> modifications if needed.</li>
              <li><strong>Learn More</strong>: Research prototype pollution in JavaScript and common libraries like Lodash to understand real-world implications.</li>
            </ul>
          </div>
        </div>
      </div>
      
      <script>
        var resultElement = document.getElementById('result');
        
        function showResult(data) {
          resultElement.textContent = JSON.stringify(data, null, 2);
        }
        
        function showError(error) {
          resultElement.textContent = 'Error: ' + error.message;
        }
        
        async function updatePreferences() {
          var preferences = document.getElementById('preferences').value;
          try {
            var response = await fetch('/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'user123',
                preferences: JSON.parse(preferences)
              })
            });
            showResult(await response.json());
          } catch (error) {
            showError(error);
          }
        }
        
        async function updateConfig() {
          var config = document.getElementById('config').value;
          try {
            var response = await fetch('/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: JSON.parse(config)
              })
            });
            showResult(await response.json());
          } catch (error) {
            showError(error);
          }
        }
        
        async function renderTemplate() {
          var template = document.getElementById('template').value;
          var templateData = document.getElementById('templateData').value;
          try {
            var response = await fetch('/render', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                template: template,
                data: JSON.parse(templateData)
              })
            });
            showResult(await response.json());
          } catch (error) {
            showError(error);
          }
        }
        
        async function checkAdmin() {
          try {
            var response = await fetch('/admin');
            showResult(await response.json());
          } catch (error) {
            showError(error);
          }
        }
        
        async function checkPollution() {
          try {
            var response = await fetch('/check');
            showResult(await response.json());
          } catch (error) {
            showError(error);
          }
        }
        
        function loadPollutionExample() {
          document.getElementById('preferences').value = JSON.stringify({
            "__proto__": {
              "isAdmin": true,
              "polluted": "yes"
            }
          }, null, 2);
        }
        
        function loadLodashExample() {
          document.getElementById('config').value = JSON.stringify({
            "constructor": {
              "prototype": {
                "isAdmin": true,
                "sourceURL": "process.env.FLAG_PROTOTYPE"
              }
            }
          }, null, 2);
        }
        
        // Add event listeners
        document.querySelectorAll('button[data-action]').forEach(function(button) {
          button.addEventListener('click', function() {
            var action = button.getAttribute('data-action');
            if (action === 'update-preferences') updatePreferences();
            else if (action === 'update-config') updateConfig();
            else if (action === 'render-template') renderTemplate();
            else if (action === 'check-admin') checkAdmin();
            else if (action === 'check-pollution') checkPollution();
            else if (action === 'load-pollution-example') loadPollutionExample();
            else if (action === 'load-lodash-example') loadLodashExample();
          });
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Prototype Pollution Challenge running on port 3000');
});