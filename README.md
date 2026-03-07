# 🚪 Smart Gate - Visitor Management System

A comprehensive digital visitor management system designed for **Rashtriya Raksha University (RRU)**. This system streamlines visitor registration, OTP verification, host approval, and guard check-in/check-out processes.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🌟 Features

### Visitor Portal
- **Self-Registration**: Visitors can register themselves with name, phone, host, and purpose
- **OTP Verification**: Secure 6-digit OTP sent via SMS (displayed on screen in test mode)
- **Real-time Status**: Track visitor request status

### Host Portal
- **Pending Approvals**: View all visitor requests awaiting approval
- **Quick Actions**: Approve visitors with validity periods (24h or 72h)
- **Live Dashboard**: Auto-refreshing metrics and visitor list
- **Search & Filter**: Find visitors quickly with client-side search

### Guard Portal
- **Check-In/Check-Out**: Manage visitor entry and exit with phone-based lookup
- **Active Visitors**: Real-time view of all checked-in visitors
- **Status Filtering**: Filter by approved/checked-in/completed status
- **Auto-Refresh**: Dashboard updates every 20 seconds

### Security & Authentication
- **JWT-based Authentication**: Secure token-based login for staff
- **Role-Based Access**: Separate portals for Guard and Host roles
- **Password Hashing**: bcrypt encryption for user passwords
- **Session Persistence**: localStorage-based login state

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB 9.2.1 (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken 9.0.3, bcryptjs 3.0.3)
- **SMS**: Twilio 5.12.1 (configurable)
- **QR Codes**: qrcode 1.5.4
- **Environment**: dotenv 17.2.4, cors 2.8.6

### Frontend
- **Pure Web Standards**: HTML5, CSS3, Vanilla JavaScript ES6+
- **No Frameworks**: Zero dependencies, lightweight and fast
- **Responsive Design**: Mobile-first CSS with flexbox/grid
- **Theme**: RRU Navy Blue (#0a2e6f) and White (#ffffff)

---

## 📁 Project Structure

```
smart-gate/
├── backend/
│   ├── scr/
│   │   ├── server.js                 # Express app entry point
│   │   ├── controllers/
│   │   │   ├── visitorController.js  # Visitor workflow logic
│   │   │   └── authController.js     # Authentication logic
│   │   ├── models/
│   │   │   ├── Visitor.js            # Visitor schema
│   │   │   └── User.js               # Staff user schema
│   │   ├── routes/
│   │   │   ├── visitorRoutes.js      # Visitor API endpoints
│   │   │   └── authRoutes.js         # Auth API endpoints
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # JWT verification
│   │   ├── services/
│   │   │   └── smsService.js         # Twilio SMS service
│   │   ├── seeds/
│   │   │   └── createUsers.js        # Default user seeding
│   │   └── checkOTPs.js              # OTP debugging script
│   ├── .env                          # Environment variables (excluded from git)
│   ├── .env.example                  # Environment template
│   └── package.json
│
├── frontend/
│   ├── landing.html                  # Portal selection page
│   ├── visitor.html                  # Visitor registration/verification
│   ├── guard.html                    # Guard check-in/out portal
│   ├── host.html                     # Host approval portal
│   ├── visitor.js                    # Visitor portal logic
│   ├── guard.js                      # Guard portal logic
│   ├── host.js                       # Host portal logic
│   ├── styles.css                    # Unified styles
│   └── assets/
│       └── rru-logo.png              # University logo
│
├── postman/                          # API testing collections
├── CREDENTIALS.md                    # Login credentials
├── HOW-TO-USE-GUIDE.md              # Complete testing guide
├── OTP-FLOW-EXPLANATION.md          # OTP workflow documentation
├── WHERE-IS-OTP-STORED.md           # OTP storage details
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **MongoDB**: v7.0 or higher (running locally or cloud)
- **npm**: Node package manager

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/smart-gate.git
cd smart-gate
```

### 2. Setup Backend
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your values:
# MONGO_URI=mongodb://127.0.0.1:27017/smart-gate
# PORT=5000
# JWT_SECRET=your-secret-key-here
# FRONTEND_URL=http://localhost:5500

# Seed default users (creates guard, host, admin accounts)
npm run seed

# Start backend server
npm start
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend
```bash
# Open new terminal, navigate to frontend
cd frontend

# Start frontend server (requires npx)
npx serve -p 5500
```

Frontend will run on `http://localhost:5500`

### 4. Access the System
Open browser and navigate to:
- **Main Portal**: http://localhost:5500/landing.html
- **Visitor Portal**: http://localhost:5500/visitor.html
- **Guard Portal**: http://localhost:5500/guard.html
- **Host Portal**: http://localhost:5500/host.html

---

## 🔑 Default Credentials

See [CREDENTIALS.md](CREDENTIALS.md) for complete login details.

**Quick Reference**:
- **Guard**: guard@rru.ac.in / guard123
- **Host**: host@rru.ac.in / host123
- **Admin**: admin@rru.ac.in / admin123

---

## 📖 Complete Documentation

- **[HOW-TO-USE-GUIDE.md](HOW-TO-USE-GUIDE.md)**: Step-by-step testing workflow
- **[OTP-FLOW-EXPLANATION.md](OTP-FLOW-EXPLANATION.md)**: Complete OTP system explanation
- **[WHERE-IS-OTP-STORED.md](WHERE-IS-OTP-STORED.md)**: OTP storage technical details
- **[CREDENTIALS.md](CREDENTIALS.md)**: All login credentials

---

## 🔄 Complete Workflow

### 1. Visitor Registration
```
Visitor Portal → Register (name, phone, host, purpose) → Receive OTP
```

### 2. OTP Verification
```
Enter Phone + OTP → Verify → Status: Pending Approval
```

### 3. Host Approval
```
Host Login → View Pending → Approve (24h/72h) → Status: Approved
```

### 4. Guard Check-In
```
Guard Login → Check-In Form → Enter Phone → Status: Checked-In
```

### 5. Guard Check-Out
```
Active Visitors Table → Check-Out Button → Status: Completed
```

---

## 🔍 OTP Testing

During development, OTPs are displayed on screen for easy testing:

### View OTP Methods:
1. **Frontend Display**: OTP shown in success message after registration
2. **Browser Console**: `console.log` output in developer tools (F12 → Console)
3. **Backend Script**: 
   ```bash
   cd backend
   node scr/checkOTPs.js
   ```
4. **MongoDB Direct**: 
   ```bash
   mongosh smart-gate
   db.visitors.find({otp: {$ne: null}}, {name:1, phone:1, otp:1, otpExpires:1})
   ```

---

## 🧪 API Testing

### Postman Collections
Located in `postman/` directory:
- Import collections into Postman
- Run tests with Newman CLI: 
  ```bash
  cd backend
  npm run test:postman:cli
  ```

### Manual API Testing
```bash
# Register Visitor
curl -X POST http://localhost:5000/api/visitors/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"1234567890","hostName":"Dr. Smith","purpose":"Meeting"}'

# Verify OTP
curl -X POST http://localhost:5000/api/visitors/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","otp":"123456"}'

# Host Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"host@rru.ac.in","password":"host123"}'
```

---

## 🔧 Configuration

### Environment Variables (backend/.env)
```env
# MongoDB connection string
MONGO_URI=mongodb://127.0.0.1:27017/smart-gate

# API server port
PORT=5000

# JWT secret (change in production!)
JWT_SECRET=your-secret-key-here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5500

# Twilio (optional, for real SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
SMS_ENABLED=false
```

### Frontend Configuration
No configuration needed - pure HTML/CSS/JS!

---

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with expiry
- **OTP Expiry**: 2-minute validity window
- **CORS Protection**: Configured allowed origins
- **Environment Secrets**: .env excluded from version control
- **Role Validation**: Middleware-based authorization

---

## 🌐 Production Deployment

### Backend (Node.js)
Recommended platforms:
- **Heroku**: Easy Node.js deployment
- **Railway**: Modern hosting with MongoDB support
- **DigitalOcean**: Droplet with PM2 process manager
- **AWS EC2**: Full control with scalability

### Frontend (Static Files)
Recommended platforms:
- **Netlify**: Free tier with CDN
- **Vercel**: Instant deployment from GitHub
- **GitHub Pages**: Free hosting for static sites
- **Cloudflare Pages**: Fast global CDN

### Database (MongoDB)
- **MongoDB Atlas**: Free tier available, recommended for production
- **Local MongoDB**: For development only

---

## 📱 SMS Configuration (Production)

To enable real SMS in production:

1. **Sign up for Twilio**: https://www.twilio.com
2. **Get credentials**: Account SID, Auth Token, Phone Number
3. **Update backend/.env**:
   ```env
   TWILIO_ACCOUNT_SID=your_real_sid
   TWILIO_AUTH_TOKEN=your_real_token
   TWILIO_PHONE_NUMBER=+1234567890
   SMS_ENABLED=true
   ```
4. **Test**: Register a visitor with real phone number

---

## 🐛 Troubleshooting

### Backend won't start
- **Check MongoDB**: Ensure MongoDB is running (`mongosh` to test)
- **Check .env**: Verify MONGO_URI is correct
- **Check port**: Ensure port 5000 is not in use

### Frontend can't connect to backend
- **Check CORS**: Ensure FRONTEND_URL in .env matches your frontend URL
- **Check backend**: Verify backend is running on port 5000
- **Check API calls**: Open browser DevTools → Network tab

### OTP not working
- **Check expiry**: OTPs expire in 2 minutes
- **Check MongoDB**: Run `node scr/checkOTPs.js` to see active OTPs
- **Check phone format**: Use consistent format (e.g., "1234567890")

### Login not working
- **Check credentials**: See CREDENTIALS.md
- **Check seed**: Run `npm run seed` to create default users
- **Check JWT_SECRET**: Ensure it's set in .env

---

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👥 Authors

**Rashtriya Raksha University (RRU)**
- Smart Gate Development Team

---

## 🎯 Roadmap

Future enhancements planned:
- [ ] QR Code scanning for check-in
- [ ] Export reports (PDF/CSV)
- [ ] Email notifications
- [ ] Photo capture for visitors
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

## 🙏 Acknowledgments

- **RRU**: For the opportunity to build this system
- **Node.js Community**: For excellent documentation
- **MongoDB**: For robust database platform
- **Twilio**: For SMS capabilities

---

**Made with ❤️ for Rashtriya Raksha University**


