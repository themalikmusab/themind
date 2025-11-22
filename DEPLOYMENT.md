# 🚀 DEPLOYMENT GUIDE: Render.com (FREE Tier)

This guide will take you from code on your computer to a **LIVE website on the internet** - completely FREE!

---

## 📊 What We're Deploying

- **Backend**: Your Node.js server (handles attendance, database, Socket.IO)
- **Frontend**: Your web interface (students and teachers use this)
- **Cost**: $0/month (100% FREE on Render's free tier)

---

## ✅ PREREQUISITES (Do This First!)

### 1. Create GitHub Account (If You Don't Have One)
1. Go to https://github.com
2. Click "Sign up"
3. Follow the steps
4. **Write down your username and password!**

### 2. Push Your Code to GitHub

**If this is your first time using Git:**

```bash
# Set your name and email (do this once)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Push your code:**

```bash
# You should already be in the themind folder
# Check with:
pwd
# Should show: /home/user/themind

# Your code is already committed (I did this earlier)
# Just push to GitHub:
git push origin claude/smart-attendance-system-01R2oqnPcawpYfSJspxPgoNZ
```

✅ **Checkpoint**: Your code is now on GitHub!

---

## 🎯 PART 1: Deploy Backend to Render

### Step 1: Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest option)
4. Click **"Authorize Render"** when prompted
5. ✅ You're now logged into Render!

---

### Step 2: Create New Web Service

1. In Render dashboard, click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect Account"** if prompted (authorize GitHub access)
4. You'll see a list of your GitHub repositories
5. Find **"themind"** repository
6. Click **"Connect"**

---

### Step 3: Configure Your Backend

Fill in these settings **EXACTLY**:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `themind-backend` | This will be in your URL |
| **Region** | Choose closest to you | e.g., "Oregon (US West)" |
| **Branch** | `claude/smart-attendance-system-01R2oqnPcawpYfSJspxPgoNZ` | Your current branch |
| **Root Directory** | Leave EMPTY | (don't type anything) |
| **Runtime** | `Node` | Should auto-detect |
| **Build Command** | `npm install` | Exactly this |
| **Start Command** | `npm start` | Exactly this |
| **Plan** | **Free** | Select "Free" plan |

**Screenshot reference:**
```
┌─────────────────────────────────────┐
│ Name: themind-backend               │
│ Environment: Node                   │
│ Region: Oregon (US West)            │
│ Branch: claude/smart-attendance-... │
│ Build Command: npm install          │
│ Start Command: npm start            │
│ Instance Type: Free                 │
└─────────────────────────────────────┘
```

---

### Step 4: Add Environment Variables

**VERY IMPORTANT!** Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** and add these **ONE BY ONE**:

#### Variable 1:
- **Key**: `PORT`
- **Value**: `10000`

#### Variable 2:
- **Key**: `NODE_ENV`
- **Value**: `production`

#### Variable 3: (CRITICAL - Generate a Secret!)
- **Key**: `SECRET_KEY`
- **Value**: Open a new terminal and run:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Copy the output (looks like: `a1b2c3d4e5f6...`) and paste as value

#### Variable 4: (CRITICAL - Generate Another Secret!)
- **Key**: `JWT_SECRET`
- **Value**: Run the same command again (generate a NEW one):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Copy and paste

#### Variable 5: (We'll update this later)
- **Key**: `CLIENT_URL`
- **Value**: `https://themind-frontend.onrender.com` (we'll change this in Part 2)

**Your environment variables should look like this:**
```
PORT = 10000
NODE_ENV = production
SECRET_KEY = a1b2c3d4e5f6789... (64 characters)
JWT_SECRET = x9y8z7w6v5u4t3s... (64 characters)
CLIENT_URL = https://themind-frontend.onrender.com
```

---

### Step 5: Deploy!

1. Click **"Create Web Service"** (big button at bottom)
2. Render will now:
   - Clone your GitHub repo
   - Install dependencies (`npm install`)
   - Start your server (`npm start`)
3. **Wait 3-5 minutes** - You'll see logs scrolling

**What you'll see:**
```
==> Cloning from https://github.com/...
==> Running 'npm install'
==> npm install completed
==> Running 'npm start'
🚀 Server running on http://localhost:10000
📡 Socket.IO ready for real-time connections
==> Your service is live! 🎉
```

4. When you see **"Your service is live!"**, **COPY THE URL**
   - It will be something like: `https://themind-backend.onrender.com`
   - **WRITE THIS DOWN!** You'll need it in Part 2

✅ **Checkpoint**: Your backend is now live on the internet!

**Test it:**
- Open: `https://themind-backend.onrender.com/api/health`
- You should see: `{"status":"ok","message":"TheMind Attendance System is running!",...}`

---

## 🎨 PART 2: Deploy Frontend to Render

### Step 1: Update Vite Config for Production

We need to tell the frontend where your backend is.

**IMPORTANT:** Before deploying frontend, we need to configure it to connect to your backend.

Create a production environment file:

```bash
# On your computer, in the themind folder:
echo 'VITE_API_URL=https://themind-backend.onrender.com' > frontend/.env.production
```

**Replace** `themind-backend.onrender.com` with **YOUR ACTUAL BACKEND URL** from Part 1!

---

### Step 2: Update API Service to Use Environment Variable

We need to update the API service to use the production URL.

<FILE: frontend/src/services/api.js - UPDATE THIS>

Find this line:
```javascript
const BASE_URL = '/api';
```

Change it to:
```javascript
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';
```

---

### Step 3: Commit and Push Changes

```bash
# In your terminal:
git add .
git commit -m "feat: Add production configuration for Render deployment"
git push origin claude/smart-attendance-system-01R2oqnPcawpYfSJspxPgoNZ
```

---

### Step 4: Create Static Site on Render

1. In Render dashboard, click **"New +"** again
2. Select **"Static Site"**
3. Find **"themind"** repository again
4. Click **"Connect"**

---

### Step 5: Configure Frontend

| Field | Value |
|-------|-------|
| **Name** | `themind-frontend` |
| **Branch** | `claude/smart-attendance-system-01R2oqnPcawpYfSJspxPgoNZ` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `../dist` |

**Important Settings:**
- Build Command: `npm install && npm run build`
- Publish Directory: `../dist` (note the `..`)

---

### Step 6: Add Frontend Environment Variable

Under "Environment Variables":

- **Key**: `VITE_API_URL`
- **Value**: `https://themind-backend.onrender.com` (YOUR backend URL from Part 1)

---

### Step 7: Deploy Frontend!

1. Click **"Create Static Site"**
2. Wait 3-5 minutes for build
3. When done, you'll get a URL like: `https://themind-frontend.onrender.com`

✅ **Checkpoint**: Your frontend is now live!

---

## 🔄 PART 3: Connect Frontend and Backend

### Update Backend CLIENT_URL

1. Go back to your **backend service** in Render
2. Click **"Environment"** tab (left sidebar)
3. Find the `CLIENT_URL` variable
4. Click **"Edit"**
5. Change value to: `https://themind-frontend.onrender.com` (YOUR frontend URL)
6. Click **"Save Changes"**
7. Backend will **auto-redeploy** (wait 2-3 minutes)

---

## 🎉 PART 4: TEST YOUR LIVE APP!

### Open Your App

1. Go to: `https://themind-frontend.onrender.com` (your frontend URL)
2. You should see the TheMind login page! 🎉

### Test Registration & Login

1. Click **"Register"**
2. Select **"Teacher"** role
3. Fill in:
   - Email: `teacher@test.com`
   - Password: `test123`
   - Name: `Test Teacher`
4. Click **"Create Account"**
5. You should be logged in!

### Test Creating a Class

1. Click **"Create Class"**
2. Name: `Test Class`
3. You'll get a join code like `ABC123`

### Test as Student (Open Incognito Window)

1. Press `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)
2. Go to your frontend URL again
3. Register as **Student**
4. Join the class with the code
5. Try scanning (you'll need teacher to start session first)

---

## ⚙️ IMPORTANT: Render Free Tier Limitations

### What You Need to Know:

1. **Server Sleeps After 15 Minutes of Inactivity**
   - First request after sleep = 30-60 second delay
   - Then it's fast again
   - **Solution**: Use a free service like [UptimeRobot](https://uptimerobot.com) to ping your backend every 10 minutes

2. **750 Hours/Month Free**
   - That's about 31 days if running 24/7
   - More than enough for testing/demo
   - For production, consider upgrading ($7/month)

3. **Database Resets on Redeploy**
   - SQLite database is in-memory on free tier
   - When you redeploy, data is lost
   - **Solution**: For production, upgrade or use external database

---

## 🔧 TROUBLESHOOTING

### Problem: "Application Error" on backend

**Solution:**
1. Click on your backend service
2. Click "Logs" tab
3. Look for errors
4. Common issues:
   - Missing environment variable → Add it
   - Wrong start command → Should be `npm start`

---

### Problem: Frontend shows blank page

**Solution:**
1. Open browser console (F12)
2. Look for errors
3. Check if `VITE_API_URL` is correct
4. Make sure backend URL doesn't have trailing slash

---

### Problem: CORS errors

**Solution:**
1. Go to backend environment variables
2. Make sure `CLIENT_URL` exactly matches your frontend URL
3. No trailing slash!
4. Redeploy backend

---

### Problem: "Cannot find module" errors

**Solution:**
1. Check `package.json` has all dependencies
2. Build command should be `npm install`
3. Redeploy

---

## 🎯 KEEPING YOUR APP AWAKE (Optional but Recommended)

### Use UptimeRobot (Free)

1. Go to https://uptimerobot.com
2. Sign up (free)
3. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://themind-backend.onrender.com/api/health`
   - Interval: 5 minutes
4. Your backend will never sleep! ✅

---

## 💰 COST BREAKDOWN

| Service | Cost |
|---------|------|
| Render Backend (Free tier) | $0 |
| Render Frontend (Free tier) | $0 |
| GitHub (Free tier) | $0 |
| Domain (optional) | $0 (use .onrender.com) |
| **TOTAL** | **$0/month** |

**To Upgrade (Optional):**
- Render Starter: $7/month (persistent database, no sleep)
- Custom domain: $10-15/year (like themind.com)

---

## 📝 YOUR DEPLOYMENT CHECKLIST

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Backend deployed with environment variables
- [ ] Frontend deployed with VITE_API_URL
- [ ] CLIENT_URL updated in backend
- [ ] Tested registration
- [ ] Tested creating class
- [ ] Tested joining class
- [ ] (Optional) UptimeRobot configured

---

## 🎊 CONGRATULATIONS!

Your app is now **LIVE ON THE INTERNET!** 🌍

Share your frontend URL with anyone:
- `https://themind-frontend.onrender.com`

They can register and start using it immediately!

---

## 📱 NEXT STEPS

1. **Custom Domain** (Optional):
   - Buy domain from Namecheap ($10/year)
   - Point to Render in DNS settings
   - Your app at: `www.yourdomain.com`

2. **Persistent Database** (If you want data to survive redeploys):
   - Upgrade to Render Starter ($7/month)
   - Or use external database (Supabase, PlanetScale - free tiers)

3. **Monitoring**:
   - Set up UptimeRobot
   - Get email alerts if site goes down
   - Keep logs of uptime

4. **Analytics** (Optional):
   - Add Google Analytics
   - Track user behavior
   - See how many people use your app

---

## 🆘 NEED HELP?

If you get stuck:
1. Check Render logs (most detailed errors)
2. Check browser console (F12)
3. Make sure environment variables are correct
4. Verify GitHub push succeeded

**Common mistake:** Frontend and backend URLs don't match. Double-check!

---

**Your app is production-ready! Start sharing with students and teachers!** 🚀
