# 🚀 How to Use Smart Gate System - Complete Guide

## 📋 Prerequisites Checklist

✅ Backend running: `cd backend && npm start` (Port 5000)  
✅ Frontend running: `npx serve frontend -l 5500` (Port 5500)  
✅ MongoDB running: `mongodb://127.0.0.1:27017`  
✅ Users created: `cd backend && npm run seed`

---

## 🎯 Complete Workflow Test

### **STEP 1: Visitor Registration** 👤

1. **Open Browser:**
   ```
   http://localhost:5500/landing.html
   ```

2. **Click on "Visitor Portal"** (first card)

3. **Fill the Registration Form:**
   ```
   Name:     John Doe
   Phone:    9876543210
   Host:     Dr. Kumar
   Purpose:  Meeting regarding project
   ```

4. **Click "Register & Send OTP"**

5. **See the OTP on screen:**
   ```
   ✓ Registration successful! Your OTP is: 582139
   ```
   
   **Copy this 6-digit code!**

6. **Form automatically switches to OTP verification** (after 4 seconds)

---

### **STEP 2: OTP Verification** ✅

1. **Enter Phone Number:**
   ```
   9876543210
   ```

2. **Enter the OTP you copied:**
   ```
   582139
   ```

3. **Click "Verify OTP"**

4. **Success message appears:**
   ```
   ✓ OTP verified successfully! Waiting for host approval.
   ```

5. **Your status is now: PENDING** (waiting for host to approve)

---

### **STEP 3: Host Approval** 👨‍💼

1. **Go back to landing page:**
   ```
   http://localhost:5500/landing.html
   ```

2. **Click on "Host Portal"** (third card)

3. **Login with host credentials:**
   ```
   Email:    host@rru.ac.in
   Password: host123
   ```

4. **Click "Login"**

5. **You'll see the pending visitor in the table:**
   ```
   | Name     | Phone      | Purpose              | Status  | Action |
   | John Doe | 9876543210 | Meeting regarding... | pending | [24h] [72h] [Reject] |
   ```

6. **Click "24h" button** to approve for 24 hours
   - OR click "72h" for 72 hours approval

7. **Success message:**
   ```
   ✓ Visitor approved for 24 hours
   ```

8. **Visitor status changes to: APPROVED** ✅

---

### **STEP 4: Guard Check-In** 🛡️

1. **Go back to landing page** (or open new tab)

2. **Click on "Guard Portal"** (second card)

3. **Login with guard credentials:**
   ```
   Email:    guard@rru.ac.in
   Password: guard123
   ```

4. **In the "Visitor Check-In" section, enter phone:**
   ```
   Phone: 9876543210
   ```

5. **Click "✓ Check In Visitor"**

6. **Success message:**
   ```
   ✓ Check-in successful: John Doe
   ```

7. **Visitor now appears in "Active Visitors" table below:**
   ```
   | Name     | Phone      | Host      | Check-In Time       | Status      | Action |
   | John Doe | 9876543210 | Dr. Kumar | 08/03/2026 10:30 AM | checked-in  | [Check Out] |
   ```

8. **Visitor status: CHECKED-IN** 🟢

---

### **STEP 5: Guard Check-Out** 🚪

1. **Still in Guard Portal, find the visitor in Active Visitors table**

2. **Click "Check Out" button**

3. **Confirmation popup:**
   ```
   Are you sure you want to check out this visitor?
   ```

4. **Click "OK"**

5. **Success message:**
   ```
   ✓ Check-out successful
   ```

6. **Visitor status changes to: CHECKED-OUT** ⚫

---

## 🔍 How to Track OTP

### Method 1: Browser Console (During Registration)
1. Press `F12` to open Developer Tools
2. Go to **Console** tab
3. After registration, see:
   ```
   ==================================================
   🔐 YOUR OTP CODE: 582139
   ==================================================
   ```

### Method 2: Check Database
```bash
cd C:\Users\anupa\smart-gate\backend
node scr/checkOTPs.js
```

Output:
```
============================================================
📱 OTPs Currently Stored in Database
============================================================

✅ Found 1 visitor(s) with OTP:

1. John Doe
   Phone:   9876543210
   OTP:     582139 ✅ ACTIVE
   Expires: Sun Mar 08 2026 10:32:00 GMT+0530
   Status:  pending
```

### Method 3: MongoDB Compass
1. Open MongoDB Compass
2. Connect to: `mongodb://127.0.0.1:27017`
3. Database: `smart-gate`
4. Collection: `visitors`
5. Find document with your phone number
6. See `otp` field

---

## 📊 Testing Multiple Scenarios

### Scenario A: Quick Approval Flow
```
Visitor Register → Get OTP → Verify OTP → Host Approve → Guard Check-in → Guard Check-out
```
**Time:** ~2 minutes

---

### Scenario B: Multiple Visitors
1. Register 3 different visitors:
   - Visitor 1: Phone `9876543210`
   - Visitor 2: Phone `9876543211`
   - Visitor 3: Phone `9876543212`

2. Login as Host and see all 3 pending

3. Approve 2, reject 1

4. Login as Guard and check-in the approved ones

---

### Scenario C: Expired OTP Test
1. Register a visitor
2. Wait 2+ minutes (OTP expires)
3. Try to verify → Should show "Invalid or expired OTP"
4. Register again to get new OTP

---

### Scenario D: Search & Filter Test
1. Register multiple visitors with different names/hosts
2. Login as Host
3. Use search box: Type name or phone
4. Use filter dropdown: Select "approved" or "pending"
5. Table updates automatically

---

## 🎨 Visual Workflow Diagram

```
┌─────────────────┐
│  VISITOR PORTAL │
│  (No Login)     │
└────────┬────────┘
         │
         ├─► Register (name, phone, host, purpose)
         │   ↓
         │   Generate OTP → Save to MongoDB
         │   ↓
         │   Show OTP on screen
         │   ↓
         └─► Verify OTP
             ↓
             Status: PENDING ⏳

┌─────────────────┐
│   HOST PORTAL   │
│  (Login needed) │
└────────┬────────┘
         │
         └─► See pending visitors
             ↓
             Approve (24h or 72h)
             ↓
             Generate QR Code
             ↓
             Status: APPROVED ✅

┌─────────────────┐
│  GUARD PORTAL   │
│  (Login needed) │
└────────┬────────┘
         │
         ├─► Check-in (enter phone)
         │   ↓
         │   Status: CHECKED-IN 🟢
         │   ↓
         │   Visitor visible in active table
         │   ↓
         └─► Check-out (click button)
             ↓
             Status: CHECKED-OUT ⚫
             ↓
             Visit complete 🎉
```

---

## 🔑 Quick Reference - Login Credentials

### Guard Portal
```
URL:      http://localhost:5500/guard.html
Email:    guard@rru.ac.in
Password: guard123
```

### Host Portal
```
URL:      http://localhost:5500/host.html
Email:    host@rru.ac.in
Password: host123
```

### Visitor Portal
```
URL:      http://localhost:5500/visitor.html
Login:    Not required
```

---

## 🛠️ Troubleshooting

### Problem: Can't see OTP
**Solution:**
1. Open browser console (F12 → Console tab)
2. OR check backend terminal output
3. OR run: `node scr/checkOTPs.js` in backend folder

---

### Problem: "Invalid credentials" when logging in
**Solution:**
```bash
cd backend
npm run seed
```
This recreates the default users.

---

### Problem: "Visitor not found" during check-in
**Solution:**
- Make sure visitor is APPROVED by host first
- Check phone number is correct (10 digits)
- Verify visitor exists: `node scr/checkOTPs.js`

---

### Problem: Frontend not loading
**Solution:**
```bash
# Terminal 1 - Backend
cd C:\Users\anupa\smart-gate\backend
npm start

# Terminal 2 - Frontend
cd C:\Users\anupa\smart-gate
npx serve frontend -l 5500
```

---

### Problem: MongoDB connection error
**Solution:**
1. Make sure MongoDB is running
2. Check `.env` file has: `MONGO_URI=mongodb://127.0.0.1:27017/smart-gate`
3. Test connection:
   ```bash
   mongosh
   use smart-gate
   db.visitors.find()
   ```

---

## 📱 Auto-Refresh Feature

Both Guard and Host portals have **auto-refresh** every 20 seconds:

1. **Enable:** Check the "Auto-refresh" checkbox
2. **Disable:** Uncheck the checkbox
3. **Manual Refresh:** Click the 🔄 Refresh button

---

## 🧪 Testing Checklist

Use this to verify everything works:

- [ ] Backend is running (port 5000)
- [ ] Frontend is running (port 5500)
- [ ] MongoDB is connected
- [ ] Can access landing page
- [ ] Visitor can register
- [ ] OTP appears on screen
- [ ] OTP can be verified
- [ ] Host can login
- [ ] Host sees pending visitors
- [ ] Host can approve visitors
- [ ] Guard can login
- [ ] Guard can check-in approved visitors
- [ ] Guard sees active visitors in table
- [ ] Guard can check-out visitors
- [ ] Search and filters work
- [ ] Auto-refresh works
- [ ] Metrics update correctly

---

## 🎯 Quick Start (TL;DR)

**ONE COMMAND EACH:**

```bash
# Terminal 1
cd C:\Users\anupa\smart-gate\backend && npm start

# Terminal 2
cd C:\Users\anupa\smart-gate && npx serve frontend -l 5500
```

**THEN OPEN:**
```
http://localhost:5500/landing.html
```

**TEST FLOW:**
1. Visitor Portal → Register → Copy OTP → Verify
2. Host Portal → Login (host@rru.ac.in / host123) → Approve
3. Guard Portal → Login (guard@rru.ac.in / guard123) → Check-in → Check-out

✅ **Done!**

---

## 📚 Additional Documentation

- [CREDENTIALS.md](CREDENTIALS.md) - All login details
- [OTP-FLOW-EXPLANATION.md](OTP-FLOW-EXPLANATION.md) - How OTP works
- [WHERE-IS-OTP-STORED.md](WHERE-IS-OTP-STORED.md) - OTP storage details
- [README.md](README.md) - Project overview

---

## 💡 Pro Tips

1. **Keep browser console open** (F12) to see API responses
2. **Use different browsers** for Guard and Host portals simultaneously
3. **Check backend terminal** for real-time logs
4. **Run `node scr/checkOTPs.js`** to debug OTP issues
5. **Use search filters** to manage multiple visitors efficiently

---

Need help with a specific step? Let me know! 🚀
