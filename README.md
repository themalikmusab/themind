# 🎯 TheMind - Smart Attendance System

**The 6-Second Refreshing QR Code™** that makes attendance fraud impossible!

## 🔥 What Makes This Special?

Traditional attendance systems are broken:
- 📝 Roll call wastes precious class time
- 🖼️ Students screenshot regular QR codes and share with absent friends
- 🤥 Proxy attendance is rampant

**TheMind solves this with proprietary ScanGrid™ technology:**
- ⚡ **6-second refresh** - Codes expire before screenshots can be shared
- 🎨 **Proprietary visual encoding** - Custom 10x10 color grid (not standard QR)
- 🚀 **Millisecond-fast scanning** - Students scan in <100ms
- 🔥 **Gamification** - Attendance streaks keep students engaged
- 📊 **Instant reports** - Teachers get real-time analytics

## 🏗️ Tech Stack

**Backend:**
- Node.js + Express
- Socket.IO (real-time 6s refresh)
- SQLite (local) / PostgreSQL (production)
- JWT authentication
- Custom ScanGrid encoder with HMAC security

**Frontend:**
- Vanilla JavaScript (no framework bloat!)
- Vite (lightning-fast dev server)
- Socket.IO client
- HTML5 Canvas for scanner
- CSS3 with gamified animations

## 📦 Installation

### 🎓 For Complete Beginners (No Computer Science Knowledge Required!)

**Don't worry if you don't know what Node.js, npm, or terminal means - we'll explain everything!**

---

### Step 1: Install Node.js (The Programming Language)

**What is Node.js?** It's the software that runs this app on your computer.

1. Go to **https://nodejs.org/**
2. Download the **LTS version** (the green button that says "Recommended for Most Users")
3. Run the installer
   - Windows: Double-click the `.msi` file
   - Mac: Double-click the `.pkg` file
   - Linux: Follow the instructions on the website
4. Keep clicking "Next" until it's installed
5. **Verify it worked:**
   - Windows: Press `Win + R`, type `cmd`, press Enter
   - Mac: Press `Cmd + Space`, type `terminal`, press Enter
   - Type this command and press Enter:
   ```bash
   node --version
   ```
   - You should see something like `v18.17.0` or similar
   - If you see this, **you're ready!** ✅

---

### Step 2: Download This Project

**Option A: Using Git (Recommended)**

1. **Install Git first** (if you don't have it):
   - Go to **https://git-scm.com/downloads**
   - Download and install for your system

2. **Open Terminal/Command Prompt:**
   - Windows: Press `Win + R`, type `cmd`, press Enter
   - Mac: Press `Cmd + Space`, type `terminal`, press Enter

3. **Navigate to where you want the project:**
   ```bash
   cd Desktop
   ```
   *(This puts it on your Desktop - change if you want it elsewhere)*

4. **Download the project:**
   ```bash
   git clone https://github.com/themalikmusab/themind.git
   cd themind
   ```

**Option B: Download ZIP (Easier but not recommended)**

1. Go to the GitHub page for this project
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to your Desktop (right-click → Extract All)
5. Open Terminal/Command Prompt and navigate to the folder:
   ```bash
   cd Desktop/themind-main
   ```

---

### Step 3: Install Project Dependencies

**What are dependencies?** Think of them as "helper tools" the app needs to work.

In your Terminal/Command Prompt (make sure you're in the `themind` folder):

```bash
npm install
```

**Wait 1-3 minutes** while it downloads everything. You'll see lots of text scrolling - that's normal! ✅

---

### Step 4: Create Your Secret Keys

**What are secret keys?** They're like passwords that keep your app secure.

#### 🔑 How to Generate Secret Keys (2 Easy Methods)

**Method 1: Using Your Computer (Easiest)**

In Terminal/Command Prompt, run this:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output something like:
```
a3f8b9c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**Copy this!** This is your first secret key.

Run it **again** to get a second key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy this second one too!**

**Method 2: Using an Online Generator**

1. Go to **https://www.grc.com/passwords.htm**
2. Scroll to the "64 random hexadecimal characters" section
3. Copy that long string of letters and numbers
4. Refresh the page and copy a **different** one for the second key

---

### Step 5: Configure Your Environment File

**What's an environment file?** It's where you save your settings and secret keys.

1. **Find the file `.env.example` in the project folder**
   - Windows: You might need to show hidden files (View → Hidden Items)
   - Mac: Press `Cmd + Shift + .` in Finder to show hidden files

2. **Make a copy and rename it:**
   - Copy `.env.example`
   - Rename the copy to just `.env` (remove "example")

   **OR use the terminal:**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file:**
   - Windows: Right-click → Open with → Notepad
   - Mac: Right-click → Open With → TextEdit

4. **Replace the placeholder secrets with YOUR generated keys:**

   **BEFORE:**
   ```env
   PORT=3000
   CLIENT_URL=http://localhost:5173
   SECRET_KEY=your-super-secret-key-here
   JWT_SECRET=your-jwt-secret-key-here
   ```

   **AFTER (example - use YOUR keys!):**
   ```env
   PORT=3000
   CLIENT_URL=http://localhost:5173
   SECRET_KEY=a3f8b9c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
   JWT_SECRET=9f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2
   ```

5. **Save the file** (Ctrl+S or Cmd+S)

---

### Step 6: Start the Application!

**Finally, let's run it!**

In Terminal/Command Prompt, run:

```bash
npm run dev
```

**What you'll see:**
```
> Backend server running on http://localhost:3000
> Frontend dev server running on http://localhost:5173
```

**This means it's working!** 🎉

---

### Step 7: Open in Your Browser

1. **Open your favorite web browser** (Chrome, Firefox, Safari, etc.)
2. **Type this in the address bar:**
   ```
   http://localhost:5173
   ```
3. **Press Enter**

**You should see the login/register page!** 🚀

---

### 🛑 How to Stop the App

When you're done using it:
- Go to the Terminal/Command Prompt window
- Press **`Ctrl + C`** (Windows/Linux) or **`Cmd + C`** (Mac)
- Type `y` if asked to confirm

---

### 🔄 How to Start It Again Later

1. Open Terminal/Command Prompt
2. Navigate to the project:
   ```bash
   cd Desktop/themind
   ```
   *(Adjust path if you put it somewhere else)*
3. Run:
   ```bash
   npm run dev
   ```
4. Open browser to `http://localhost:5173`

---

### 🏗️ Building for Production (Making it Fast)

If you want to create an optimized version for deployment:

```bash
npm run build
```

This creates a `dist/` folder with optimized files you can upload to a web server.

---

### ⚠️ Common Problems & Solutions

**Problem: "npm: command not found"**
- **Solution:** Node.js didn't install correctly. Go back to Step 1.

**Problem: "Cannot find module..."**
- **Solution:** Dependencies didn't install. Run `npm install` again.

**Problem: "Port 3000 is already in use"**
- **Solution:** Another app is using that port. Either:
  - Close that app
  - OR change `PORT=3000` to `PORT=3001` in your `.env` file

**Problem: ".env file not found"**
- **Solution:** You forgot to create it! Go back to Step 5.

**Problem: "Invalid token" errors when logging in**
- **Solution:** Make sure you put REAL secret keys in `.env`, not the placeholder text!

**Problem: Website doesn't load**
- **Solution:** Make sure you're using `http://localhost:5173` (not 3000!)

---

### 📱 Quick Start (For Advanced Users)

If you already know what you're doing:

```bash
# Clone and setup
git clone https://github.com/themalikmusab/themind.git
cd themind
npm install

# Generate secrets and create .env
node -e "console.log('SECRET_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Copy to .env
cp .env.example .env
# (Edit .env with your generated keys)

# Run
npm run dev

# Open http://localhost:5173
```

## 🎮 How to Use

### For Teachers

1. **Register** as a teacher
2. **Create a class** - You'll get a 6-character join code (e.g., `MATH01`)
3. **Share the join code** with your students
4. **Start attendance session**:
   - Open your class
   - Click "Start Attendance Session"
   - Display the ScanGrid on projector
   - Watch it refresh every 6 seconds! 🔄
5. **View reports**:
   - Click "View Report" to see attendance stats
   - Export to CSV for records

### For Students

1. **Register** as a student
2. **Join class** using the 6-character code from your teacher
3. **Scan attendance**:
   - Open the class
   - Allow camera access
   - Point camera at teacher's ScanGrid
   - Scan completes in milliseconds! ⚡
4. **Track your streak** 🔥
   - See your attendance streak grow
   - Compete with classmates!

## 🔐 How ScanGrid™ Security Works

### Encoding
```
ScanGrid Data = sessionID + timestamp + HMAC
↓
Binary encoding (100 bits total)
↓
10x10 color grid (8 colors)
↓
Refreshes every 6 seconds
```

### Validation
1. **HMAC verification** - Code can't be forged
2. **Timestamp check** - Code must be <8 seconds old (6s + 2s grace)
3. **Session validation** - Code matches active session
4. **Duplicate check** - Student can't scan twice

### Why It's Unbeatable
- **Screenshots are useless** - By the time someone shares a screenshot, it's expired
- **Can't be forged** - HMAC cryptographic signature
- **Fast scanning** - Legitimate students scan instantly before expiry

## 📁 Project Structure

```
themind/
├── backend/
│   ├── server.js              # Express + Socket.IO server
│   ├── database/
│   │   └── init.js            # SQLite setup
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/
│   │   ├── auth.js            # Login/register
│   │   ├── classes.js         # Class management
│   │   └── attendance.js      # Attendance records
│   ├── services/
│   │   └── sessionManager.js  # Real-time session handling
│   └── utils/
│       └── scanGridEncoder.js # Proprietary encoding/decoding
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.js            # App entry point
│   │   ├── style.css          # Gamified UI styles
│   │   ├── pages/
│   │   │   ├── Login.js       # Auth page
│   │   │   ├── TeacherDashboard.js
│   │   │   └── StudentDashboard.js
│   │   ├── components/
│   │   │   ├── ScanGridDisplay.js    # Teacher's display
│   │   │   ├── ScanGridScanner.js    # Student's scanner
│   │   │   ├── ClassManager.js       # Create/manage classes
│   │   │   ├── StudentClassList.js   # Join/view classes
│   │   │   └── AttendanceReport.js   # Reports & CSV export
│   │   └── services/
│   │       └── auth.js        # Auth API calls
├── package.json
├── vite.config.js
└── .env.example
```

## 🚀 Deployment

### Option 1: Render (Recommended - Free Tier)

1. Push code to GitHub
2. Create account on [Render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repo
5. Set build command: `npm install`
6. Set start command: `npm run server`
7. Add environment variables from `.env`
8. Deploy! 🎉

### Option 2: Railway

1. Push to GitHub
2. Connect at [Railway.app](https://railway.app)
3. Auto-deploys on every push

### Option 3: Vercel (Frontend) + Backend Separate

1. Deploy frontend to Vercel
2. Deploy backend to Render/Railway
3. Update `CLIENT_URL` in backend `.env`

## 🎨 Customization

### Change ScanGrid Colors
Edit `/backend/utils/scanGridEncoder.js`:
```javascript
const COLORS = [
  '#YOUR_COLOR_1',
  '#YOUR_COLOR_2',
  // ... 8 colors total
];
```

### Adjust Refresh Rate
Edit `/backend/services/sessionManager.js`:
```javascript
setInterval(() => {
  // Change 6000 to your desired ms
}, 6000);
```

### Modify Expiry Time
Edit `/backend/utils/scanGridEncoder.js`:
```javascript
validateScanGrid(scannedData, 8000) // Change 8000 to desired ms
```

## 🐛 Troubleshooting

**Camera not working?**
- Ensure HTTPS (required for camera access)
- Check browser permissions
- Try different browser

**Session not starting?**
- Check backend is running
- Check browser console for errors
- Verify Socket.IO connection

**Database errors?**
- Delete `attendance.db` and restart
- Check file permissions

## 📊 Database Schema

```sql
users (id, email, password, name, role)
classes (id, name, join_code, teacher_id)
enrollments (id, class_id, student_id)
attendance_sessions (id, class_id, teacher_id, started_at, ended_at, is_active)
attendance_records (id, session_id, student_id, marked_at)
streaks (id, student_id, class_id, current_streak, max_streak)
```

## 🔒 Security Best Practices

1. **Change default secrets** in `.env` before production
2. **Use HTTPS** in production (required for camera)
3. **Enable rate limiting** for API endpoints
4. **Backup database** regularly
5. **Update dependencies** periodically

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - feel free to use for your institution!

## 💡 Future Enhancements

- [ ] Mobile apps (React Native)
- [ ] Face recognition backup
- [ ] Geolocation verification
- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Email notifications
- [ ] Analytics dashboard

## 👨‍💻 Author

Built with ❤️ for educational institutions

---

**Remember:** The 6-second refresh is your secret weapon. Keep it enabled! 🔐
