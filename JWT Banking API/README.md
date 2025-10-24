# JWT Banking API

A tiny Express.js API showing how to protect routes with JSON Web Tokens (JWT).

## Endpoints

- `POST /login` — provide `{ "username": "user1", "password": "password123" }` to receive a token
- `GET /balance` — protected, returns `{ balance }`
- `POST /deposit` — protected, body: `{ "amount": 100 }`, response: `{ "message": "Deposited $100", "newBalance": 1100 }`
- `POST /withdraw` — protected, body: `{ "amount": 50 }`, response: `{ "message": "Withdrew $50", "newBalance": 1050 }`

Hardcoded demo users:

- user1 / password123 (starting balance: 1000)
- user2 / secret456 (starting balance: 500)

## Run locally (Windows PowerShell)

```powershell
# From the project folder
npm install

# Optional: set a custom secret for current session
$env:JWT_SECRET = "super-secret-change-me"

# Start the server
npm start
```

## Quick test from PowerShell

```powershell
# 1) Login to get a token
$token = (Invoke-RestMethod -Uri http://localhost:3000/login -Method Post -Body '{"username":"user1","password":"password123"}' -ContentType 'application/json').token

# 2) Use the token as a Bearer token for protected endpoints
Invoke-RestMethod -Uri http://localhost:3000/balance -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri http://localhost:3000/deposit -Method Post -Headers @{ Authorization = "Bearer $token" } -Body '{"amount": 250}' -ContentType 'application/json'
Invoke-RestMethod -Uri http://localhost:3000/withdraw -Method Post -Headers @{ Authorization = "Bearer $token" } -Body '{"amount": 100}' -ContentType 'application/json'
```

If you see `Invalid or expired token`, make sure the `Authorization` header exactly follows the `Bearer <token>` format and that the token hasn't expired.

### Optional: use the included REST Client file

If you have the VS Code REST Client extension, open `requests.http`, click "Send Request" on each block. The first request stores the token for reuse automatically.
