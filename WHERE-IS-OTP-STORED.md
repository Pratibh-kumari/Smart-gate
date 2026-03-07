# 📍 Where Does the OTP Exist? - Physical Storage Locations

## 🗄️ **PRIMARY STORAGE: MongoDB Database**

The OTP is **saved in MongoDB** in the `visitors` collection.

### Database Details:
- **Database Name:** `smart-gate`
- **Collection Name:** `visitors`
- **Fields storing OTP:**
  - `otp`: The 6-digit code (e.g., "582139")
  - `otpExpires`: Timestamp when it expires (2 minutes from generation)

### Example Document in MongoDB:
```json
{
  "_id": ObjectId("65f1a2b3c4d5e6f7g8h9i0j1"),
  "name": "John Doe",
  "phone": "9876543210",
  "host": "Dr. Kumar",
  "purpose": "Meeting",
  "otp": "582139",                          ← OTP STORED HERE
  "otpExpires": ISODate("2026-03-08T10:32:00Z"), ← EXPIRY TIME
  "isVerified": false,
  "status": "pending",
  "createdAt": ISODate("2026-03-08T10:30:00Z"),
  "updatedAt": ISODate("2026-03-08T10:30:00Z")
}
```

---

## 🔍 **How to VIEW the OTP in MongoDB**

### Method 1: MongoDB Compass (GUI)
1. Open **MongoDB Compass**
2. Connect to: `mongodb://127.0.0.1:27017`
3. Select database: `smart-gate`
4. Open collection: `visitors`
5. Find your visitor document
6. Look at the **`otp`** field

### Method 2: Mongo Shell (Command Line)
```bash
# Open mongo shell
mongosh

# Switch to database
use smart-gate

# Find all visitors with OTP
db.visitors.find({}).pretty()

# Find specific visitor by phone
db.visitors.findOne({ phone: "9876543210" })

# See only OTP fields
db.visitors.find({}, { name: 1, phone: 1, otp: 1, otpExpires: 1 })
```

**Example Output:**
```json
{
  "_id": ObjectId("65f1a2b3c4d5e6f7g8h9i0j1"),
  "name": "John Doe",
  "phone": "9876543210",
  "otp": "582139",           ← YOUR OTP IS HERE
  "otpExpires": ISODate("2026-03-08T10:32:00Z")
}
```

### Method 3: VS Code MongoDB Extension
1. Install "MongoDB for VS Code" extension
2. Connect to `mongodb://127.0.0.1:27017`
3. Browse: `smart-gate` → `visitors`
4. Click on a document to view OTP

---

## 🔄 **OTP Lifecycle - Where It Exists at Each Stage**

### Stage 1️⃣: Generation (Registration)
**File:** `backend/scr/controllers/visitorController.js` (Line 10)

```javascript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
```

**Location:** JavaScript memory variable

---

### Stage 2️⃣: Saving to Database
**File:** `backend/scr/controllers/visitorController.js` (Line 12-18)

```javascript
const visitor = new Visitor({
  name,
  phone,
  host,
  purpose,
  otp,                                    ← OTP SAVED HERE
  otpExpires: Date.now() + 2 * 60 * 1000, // 2 minutes
});

await visitor.save();                     ← WRITTEN TO MONGODB
```

**Location:** MongoDB database → `smart-gate.visitors` collection

---

### Stage 3️⃣: API Response (Testing)
**File:** `backend/scr/controllers/visitorController.js` (Line 23-25)

```javascript
res.status(201).json({
  message: "Visitor registered successfully. OTP sent to phone.",
  visitorId: visitor._id,
  otp, // ← OTP RETURNED IN RESPONSE (FOR TESTING ONLY)
});
```

**Location:** HTTP response body (visible in browser console/network tab)

---

### Stage 4️⃣: Frontend Display
**File:** `frontend/visitor.js` (Line 73-75)

```javascript
if (result.otp) {
    showStatus(`✓ Registration successful! Your OTP is: ${result.otp}`, 'success');
    console.log('🔐 YOUR OTP CODE: ' + result.otp);
}
```

**Location:** 
- Browser page (status message)
- Browser console (F12 → Console)

---

### Stage 5️⃣: Verification
**File:** `backend/scr/controllers/visitorController.js` (Line 83-90)

```javascript
const visitor = await Visitor.findOne({ phone }).sort({ createdAt: -1 });

// OTP validation
if (visitor.otp !== otp || visitor.otpExpires < Date.now()) {
  return res.status(400).json({ message: "Invalid or expired OTP" });
}
```

**Location:** Retrieved from MongoDB, compared in memory

---

### Stage 6️⃣: After Verification (OTP Deleted)
**File:** `backend/scr/controllers/visitorController.js` (Line 96-97)

```javascript
visitor.otp = null;          ← OTP REMOVED FROM DATABASE
visitor.otpExpires = null;   ← EXPIRY REMOVED
```

**Location:** OTP no longer exists (deleted from MongoDB)

---

## 📊 **OTP Storage Summary Table**

| Location | When | Duration | How to Access |
|----------|------|----------|---------------|
| **JavaScript Variable** | During generation | Milliseconds | Not accessible |
| **MongoDB Database** | After registration | Until verification or expiry | Mongo shell, Compass, VS Code |
| **HTTP Response** | After registration | Once (sent to frontend) | Browser Network tab |
| **Browser Console** | After registration | Until page refresh | F12 → Console |
| **Browser Page** | After registration | 4 seconds (status message) | Visible on screen |
| **Backend Terminal** | During generation | Scrolls away | Terminal history |

---

## 🗂️ **MongoDB Connection Details**

### Your Database Configuration:
From `backend/.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/smart-gate
```

**Breakdown:**
- **Protocol:** mongodb://
- **Host:** 127.0.0.1 (localhost)
- **Port:** 27017
- **Database:** smart-gate

### Collections in Database:
```
smart-gate/
├── visitors      ← OTP stored here (in each visitor document)
└── users         ← Staff accounts (guard, host)
```

---

## 🔍 **Real-Time MongoDB Query Examples**

### See all OTPs currently in database:
```javascript
db.visitors.aggregate([
  {
    $match: { otp: { $ne: null } }
  },
  {
    $project: {
      name: 1,
      phone: 1,
      otp: 1,
      otpExpires: 1,
      minutesUntilExpiry: {
        $divide: [
          { $subtract: ["$otpExpires", new Date()] },
          60000
        ]
      }
    }
  }
])
```

### Find expired OTPs:
```javascript
db.visitors.find({
  otp: { $ne: null },
  otpExpires: { $lt: new Date() }
})
```

### Count visitors with active OTP:
```javascript
db.visitors.countDocuments({
  otp: { $ne: null },
  otpExpires: { $gt: new Date() }
})
```

---

## 🧪 **Testing: How to See Your OTP**

### Quick Test Script:

**Run in terminal:**
```bash
cd C:\Users\anupa\smart-gate\backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Visitor = require('./scr/models/Visitor');
  
  const visitors = await Visitor.find({ otp: { \$ne: null } })
    .sort({ createdAt: -1 })
    .limit(5);
  
  console.log('\\n📱 Recent OTPs in Database:\\n');
  visitors.forEach(v => {
    console.log(\`Name: \${v.name}\`);
    console.log(\`Phone: \${v.phone}\`);
    console.log(\`OTP: \${v.otp}\`);
    console.log(\`Expires: \${v.otpExpires}\`);
    console.log('---');
  });
  
  process.exit(0);
});
"
```

---

## 🔐 **Security Note**

### Current State (Testing):
✅ OTP stored in plain text in MongoDB  
✅ OTP returned in API response  
✅ OTP visible in browser console

### Production Best Practices:
❌ **Don't** store OTP in plain text (hash it)  
❌ **Don't** return OTP in API response  
❌ **Don't** log OTP in console  
✅ **Do** send OTP via SMS only  
✅ **Do** implement rate limiting  
✅ **Do** use secure OTP service (Twilio Verify)

---

## 📍 **File Locations Summary**

| What | Where | Line |
|------|-------|------|
| **OTP Schema Definition** | `backend/scr/models/Visitor.js` | Line 10-11 |
| **OTP Generation Logic** | `backend/scr/controllers/visitorController.js` | Line 10 |
| **OTP Save to DB** | `backend/scr/controllers/visitorController.js` | Line 12-20 |
| **OTP Return in Response** | `backend/scr/controllers/visitorController.js` | Line 22-26 |
| **OTP Display on Page** | `frontend/visitor.js` | Line 73-76 |
| **OTP Verification Logic** | `backend/scr/controllers/visitorController.js` | Line 83-95 |
| **OTP Deletion** | `backend/scr/controllers/visitorController.js` | Line 96-97 |

---

## 💡 **Quick Answer**

**Q: Where does the OTP exist?**

**A: The OTP is stored in MongoDB database:**
- **Database:** `smart-gate`
- **Collection:** `visitors`
- **Field:** `otp` (string, 6 digits)
- **Location:** `mongodb://127.0.0.1:27017/smart-gate`

You can see it using:
1. MongoDB Compass GUI
2. Mongo shell: `db.visitors.find()`
3. Browser console after registration
4. Backend terminal output

---

Need help viewing the database? Let me know! 🔍
