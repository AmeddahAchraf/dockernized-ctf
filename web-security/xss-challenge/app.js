// xss-challenge/app.js
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const nonce = Math.random().toString(36).substring(2, 15);
  res.locals.nonce = nonce;
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`);
  next();
});

// Challenge 1: DOM XSS with CSP bypass
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Modern Blog Platform</title>
      <style>
        body {
          background: #f0f2f5;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
        }

        .container {
          max-width: 800px;
          margin: 40px auto;
          background: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
        }

        .post {
          border: none;
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.03);
        }

        .post h2 {
          margin-top: 0;
          color: #222;
        }

        .comment {
          background: #fff6f0;
          padding: 12px 15px;
          margin: 10px 0;
          border-left: 4px solid #ff6b35;
          border-radius: 6px;
          font-size: 0.95rem;
        }

        #commentForm {
          margin-top: 20px;
        }

        #commentText {
          width:90%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          resize: vertical;
          font-family: inherit;
        }

        button {
          background: #0069d9;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin-top: 10px;
          font-size: 1rem;
        }

        button:hover {
          background: #0053b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Modern Blog Platform</h1>
        <div class="post">
          <h2>Welcome to our secure blog!</h2>
          <p>Share your thoughts safely with our advanced CSP protection.</p>
          <div id="comments"></div>
          <form id="commentForm">
            <textarea id="commentText" placeholder="Leave a comment..." rows="4"></textarea><br>
            <button type="submit">Post Comment</button>
          </form>
        </div>
      </div>
      
      <script nonce="${res.locals.nonce}">
        document.getElementById('commentForm').addEventListener('submit', function(e) {
          e.preventDefault();
          const comment = document.getElementById('commentText').value;
          const commentsDiv = document.getElementById('comments');
          
          // Vulnerable: Direct DOM manipulation without sanitization
          commentsDiv.innerHTML += '<div class="comment">' + comment + '</div>';
          document.getElementById('commentText').value = '';
        });

        // Vulnerable: Eval with user input (modern bypass technique)
        window.addEventListener('message', function(e) {
          if (e.origin !== window.location.origin) return;
          if (e.data.type === 'config') {
            // This looks like configuration but can be exploited
            eval('var config = ' + e.data.config);
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Challenge 2: Reflected XSS with template literal injection
app.get('/search', (req, res) => {
  const query = req.query.q || '';

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Search Results - Modern Blog Platform</title>
      <style>
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .search-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .search-input {
          width: 60%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .search-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 10px;
          font-size: 16px;
        }
        
        .search-button:hover {
          background: #0056b3;
        }
        
        .search-info {
          background: #e9ecef;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        
        .results-container {
          margin-top: 20px;
        }
        
        .result-item {
          background: #fff;
          border: 1px solid #ddd;
          padding: 15px;
          margin: 10px 0;
          border-radius: 4px;
          border-left: 4px solid #28a745;
        }
        
        .vulnerability-hint {
          background: #fff3cd;
          color: #856404;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
          border: 1px solid #ffeaa7;
        }
      </style>
    </head>
    <body>
      
      <div class="container">
        <h1>Advanced Search Portal</h1>
        
        <div class="search-form">
          <form method="GET" action="/search">
            <input type="text" name="q" class="search-input" placeholder="Enter search term..." value="${query.replace(/"/g, '&quot;')}">
            <button type="submit" class="search-button">Search</button>
          </form>
        </div>
        
        <div class="search-info">
          <h3>Search Results for: "${query}"</h3>
          <p>Our advanced search engine uses modern JavaScript template processing for enhanced functionality.</p>
        </div>
        
        <div class="vulnerability-hint">
          <strong>🔍 Security Note:</strong> This search uses template literals for dynamic content generation. 
          The search term is processed both server-side and client-side for enhanced functionality.
        </div>
        
        <div class="results-container">
          <div class="result-item">
            <h4>No direct results found</h4>
            <p>Try different search terms or check the processed output below.</p>
          </div>
          
          <div id="dynamicResults">
            <!-- Dynamic results will be inserted here -->
          </div>
        </div>
      </div>
      
      <script nonce="${res.locals.nonce}">
        // VULNERABLE: Template literal injection point
        const searchTerm = \`${query}\`;
        console.log('Processing search for:', searchTerm);
        
        // VULNERABLE: Client-side template processing with user input
        document.addEventListener('DOMContentLoaded', function() {
          try {
            // This template literal processes the search term
            const resultTemplate = \`
              <div class="result-item">
                <h4>Processed Search: \${searchTerm}</h4>
                <p>Your search term "\${searchTerm}" has been processed by our advanced template engine.</p>
                <small>Template processing allows for dynamic content generation.</small>
              </div>
            \`;
            
            // Insert the processed template
            document.getElementById('dynamicResults').innerHTML = resultTemplate;
            
            // Additional vulnerable processing
            const debugInfo = \`console.log('Debug: Search processed for \${searchTerm}');\`;
            
            // HINT: The template literal above can be broken out of...
            // Try: ${'\`); alert("XSS"); console.log(\`'}
            
          } catch (e) {
            console.error('Template processing error:', e);
            document.getElementById('dynamicResults').innerHTML = '<div class="result-item">Error processing search template</div>';
          }
        });
        
        // Function to trigger flag retrieval (for educational purposes)
        function getFlag() {
          alert('🎉 Flag captured: ' + process.env.FLAG_XSS_SEARCH);
        }
        
      </script>
    </body>
    </html>
  `);
});
// Challenges page
app.get('/challenges', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CTF Challenges</title>
    </head>
    <body>
      <div class="container">
        <h1>CTF Challenges</h1>
        <p>Available challenges:</p>
        <ul>
          <li><a href="/">XSS Challenge</a></li>
          <li><a href="/search">Search XSS</a></li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

app.get('/admin-sudoroot/flag', (req, res) => {
  res.json({ flag: process.env.FLAG_XSS });
});

app.listen(3000, () => {
  console.log('XSS Challenge running on port 3000');
});