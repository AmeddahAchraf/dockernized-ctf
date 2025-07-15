// race-challenge/app.js
const express = require('express');
const redis = require('redis');
const app = express();

app.use(express.json());

// Fixed Redis client configuration
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379
  }
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Initialize Redis connection
async function initRedis() {
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
}

initRedis();

// Initialize user balance
app.post('/init', async (req, res) => {
  try {
    await client.set('user:balance', '1000');
    res.json({ message: 'Balance initialized to 1000' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable transfer endpoint (race condition)
app.post('/transfer', async (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  try {
    // Race condition vulnerability: TOCTOU
    const balance = parseInt(await client.get('user:balance') || '0');
    
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vulnerable: No atomic operation
    const newBalance = balance - amount;
    await client.set('user:balance', newBalance.toString());
    
    res.json({
      message: 'Transfer successful',
      amount: amount,
      new_balance: newBalance,
      flag: newBalance < 0 ? process.env.FLAG_RACE : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check balance
app.get('/balance', async (req, res) => {
  try {
    const balance = await client.get('user:balance');
    res.json({ balance: parseInt(balance || '0') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Main page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Race Condition Challenge - Banking System</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .panel { border: 1px solid #ccc; padding: 20px; margin: 20px 0; }
        input[type="number"] { width: 200px; padding: 10px; }
        button { padding: 10px 20px; margin: 10px; }
        .result { background: #f9f9f9; padding: 10px; margin: 10px 0; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Secure Banking System</h1>
        <p>Transfer money safely with our atomic transaction system!</p>
        
        <div class="panel">
          <h3>Current Balance</h3>
          <button onclick="checkBalance()">Check Balance</button>
          <button onclick="initBalance()">Initialize Balance</button>
        </div>
        
        <div class="panel">
          <h3>Transfer Money</h3>
          <input type="number" id="amount" placeholder="Amount" value="100">
          <button onclick="transfer()">Transfer</button>
          <button onclick="rapidTransfer()">Rapid Transfer (Race Condition)</button>
        </div>
        
        <div class="panel">
          <h3>Result</h3>
          <div id="result" class="result"></div>
        </div>
        
        <div class="panel">
          <h3>Hints</h3>
          <ul>
            <li>Try making multiple simultaneous transfer requests</li>
            <li>Look for TOCTOU (Time-of-Check-Time-of-Use) vulnerabilities</li>
            <li>Use tools like curl with multiple concurrent requests</li>
            <li>Try to make the balance go negative to get the flag</li>
          </ul>
        </div>
      </div>
      
      <script>
        async function checkBalance() {
          try {
            const response = await fetch('/balance');
            const data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
        
        async function initBalance() {
          try {
            const response = await fetch('/init', { method: 'POST' });
            const data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
        
        async function transfer() {
          const amount = document.getElementById('amount').value;
          
          try {
            const response = await fetch('/transfer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: parseInt(amount) })
            });
            
            const data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
        
        async function rapidTransfer() {
          const amount = document.getElementById('amount').value;
          const promises = [];
          
          // Make 10 concurrent requests to exploit race condition
          for (let i = 0; i < 10; i++) {
            promises.push(fetch('/transfer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: parseInt(amount) })
            }));
          }
          
          try {
            const responses = await Promise.all(promises);
            const results = await Promise.all(responses.map(r => r.json()));
            document.getElementById('result').textContent = JSON.stringify(results, null, 2);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Race Challenge running on port 3000');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.quit();
  process.exit(0);
});