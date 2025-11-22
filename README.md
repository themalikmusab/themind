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

### Prerequisites
- Node.js 16+ and npm

### Quick Start

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd themind
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

Edit `.env` and update the secret keys:
```env
PORT=3000
CLIENT_URL=http://localhost:5173
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
```

4. **Start the application**
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Frontend dev server on `http://localhost:5173`

5. **Open your browser**
```
http://localhost:5173
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
