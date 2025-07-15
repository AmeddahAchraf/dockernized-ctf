// deserialization-challenge/app.js
const express = require('express');
const serialize = require('serialize-javascript');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Read navbar template
const navbarTemplate = fs.readFileSync(path.join(__dirname, 'navbar.html'), 'utf8');

// Helper function to inject navbar and set active nav item
function getNavbar(activeItem = '') {
  let navbar = navbarTemplate;

  // Remove all active classes first
  navbar = navbar.replace(/class="nav-\w+ active"/g, (match) => {
    return match.replace(' active', '');
  });

  // Add active class to current page
  if (activeItem) {
    navbar = navbar.replace(`class="nav-${activeItem}"`, `class="nav-${activeItem} active"`);
  }

  return navbar;
}

// Vulnerable deserialization endpoint
app.post('/deserialize', (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: 'data is required' });
  }
  
  try {
    // Vulnerable: eval-based deserialization
    const obj = eval('(' + data + ')');
    
    res.json({
      message: 'Deserialization successful',
      result: obj,
      flag: obj.flag || 'No flag found'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Session management (vulnerable to deserialization attacks)
app.post('/session', (req, res) => {
  const { session } = req.body;
  
  if (!session) {
    return res.status(400).json({ error: 'session is required' });
  }
  
  try {
    // Vulnerable: Function constructor deserialization
    const sessionData = Function('"use strict"; return (' + session + ')')();
    
    if (sessionData.admin) {
      res.json({
        message: 'Admin session restored',
        flag: process.env.FLAG_DESER,
        admin_data: 'Sensitive admin information'
      });
    } else {
      res.json({
        message: 'User session restored',
        data: sessionData
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// race-challenge/app.js
const express = require('express');
const redis = require('redis');
const app = express();

app.use(express.json());

const client = redis.createClient({
  host: 'redis',
  port: 6379
});

client.connect();

// Initialize user balance
app.post('/init', async (req, res) => {
  await client.set('user:balance', '1000');
  res.json({ message: 'Balance initialized to 1000' });
});

// Vulnerable transfer endpoint (race condition)
app.post('/transfer', async (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  try {
    // Race condition vulnerability: TOCTOU
    const balance = parseInt(await client.get('user:balance'));
    
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
  const balance = await client.get('user:balance');
  res.json({ balance: parseInt(balance) });
});
