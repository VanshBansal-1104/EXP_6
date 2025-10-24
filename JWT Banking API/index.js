const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');

// Config
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '1h';

const app = express();
app.use(express.json());
// Serve static UI files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Demo users and balances (in-memory)
const users = {
  user1: { password: 'password123', balance: 1000 },
  user2: { password: 'secret456', balance: 500 },
};

// Helper: extract Bearer token (case-insensitive)
function getTokenFromAuthHeader(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (/^Bearer$/i.test(scheme)) return token;
  return null;
}

// Auth middleware
function authenticate(req, res, next) {
  const token = getTokenFromAuthHeader(req);
  if (!token) {
    // Match expected output for the exercise
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded; // { username }
    next();
  });
}

// Routes
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'jwt-banking-api' });
});

// Login UI (GET) - serve a simple web page
app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'username and password are required' });
  }
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
  res.json({ token });
});

// Protected: get balance
app.get('/balance', authenticate, (req, res) => {
  const { username } = req.user;
  res.json({ balance: users[username].balance });
});

// Protected: deposit
app.post('/deposit', authenticate, (req, res) => {
  const { amount } = req.body || {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res
      .status(400)
      .json({ message: 'amount must be a positive number' });
  }
  const { username } = req.user;
  users[username].balance += amt;
  res.json({ message: `Deposited $${amt}`, newBalance: users[username].balance });
});

// Protected: withdraw
app.post('/withdraw', authenticate, (req, res) => {
  const { amount } = req.body || {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res
      .status(400)
      .json({ message: 'amount must be a positive number' });
  }
  const { username } = req.user;
  if (users[username].balance < amt) {
    return res.status(409).json({
      message: 'Insufficient balance',
      currentBalance: users[username].balance,
      requestedAmount: amt,
    });
  }
  users[username].balance -= amt;
  res.json({ message: `Withdrew $${amt}`, newBalance: users[username].balance });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`JWT Banking API running on http://localhost:${PORT}`);
});
