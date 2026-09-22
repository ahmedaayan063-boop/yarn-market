# ABC XYZ Yarn Market — Deployment Guide
## GitHub + Railway (backend) + Render (frontend)

---

## STEP 1 — Create free accounts

| Service | Link | Purpose |
|---------|------|---------|
| GitHub  | https://github.com/signup | Store your code |
| Railway | https://railway.app | Host backend + database |
| Render  | https://render.com | Host frontend |

Sign up to Railway and Render using your GitHub account (easier).

---

## STEP 2 — Push code to GitHub

Open Command Prompt in C:\yarn-market and run:

```
git init
git add .
git commit -m "Initial commit - ABC XYZ Yarn Market"
```

Go to https://github.com/new
- Repository name: yarn-market
- Visibility: Private
- Click "Create repository"

Then run (replace YOUR_USERNAME):
```
git remote add origin https://github.com/YOUR_USERNAME/yarn-market.git
git branch -M main
git push -u origin main
```

---

## STEP 3 — Deploy backend on Railway

1. Go to https://railway.app → "New Project"
2. Click "Deploy from GitHub repo"
3. Select "yarn-market" repository
4. Railway will detect the backend

### Add PostgreSQL database:
- Click "+ New" → "Database" → "Add PostgreSQL"
- Railway creates the database automatically

### Configure the backend service:
- Click your backend service → "Settings"
- Set Root Directory: `backend`
- Start Command: `npx prisma migrate deploy && node src/index.js`

### Add environment variables (Variables tab):
```
DATABASE_URL    = (click "Connect" on PostgreSQL service → copy DATABASE_URL)
NODE_ENV        = production
PORT            = 5000
FRONTEND_URL    = https://yarn-market.onrender.com
```

### After deploy:
- Railway gives you a URL like: https://yarn-market-backend.up.railway.app
- Test it: open https://yarn-market-backend.up.railway.app/api/health
- You should see: {"status":"ok"}

---

## STEP 4 — Deploy frontend on Render

1. Go to https://render.com → "New" → "Static Site"
2. Connect GitHub → select "yarn-market"
3. Configure:
   - Name: yarn-market
   - Root Directory: frontend
   - Build Command: npm install && npm run build
   - Publish Directory: build

4. Add environment variable:
   - Key:   REACT_APP_API_URL
   - Value: https://YOUR-RAILWAY-URL.up.railway.app/api
   (replace with your actual Railway backend URL)

5. Click "Create Static Site"
6. Render gives you: https://yarn-market.onrender.com

---

## STEP 5 — Update Railway CORS

Go back to Railway → backend service → Variables
Update FRONTEND_URL with your actual Render URL:
```
FRONTEND_URL = https://yarn-market.onrender.com
```
Railway will auto-redeploy.

---

## STEP 6 — Test everything

Open https://yarn-market.onrender.com in your browser.
- Dashboard should load
- Add a party → save → it should appear in the list

Share this link with anyone — they can use it from any device.

---

## Free tier limits

| Service | Free limit |
|---------|-----------|
| Railway | $5 credit/month (enough for small usage) |
| Render  | Static sites are completely free |
| PostgreSQL | 1GB storage on Railway free tier |

---

## Updating the software later

Whenever you make changes:
```
cd C:\yarn-market
git add .
git commit -m "Update description"
git push
```

Railway and Render auto-deploy when you push to GitHub.
