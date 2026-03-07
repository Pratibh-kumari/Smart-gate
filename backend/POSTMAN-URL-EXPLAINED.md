# Understanding Postman URLs - Smart-Gate API

## 🤔 What Are Those Long IDs in URLs?

The URLs you see in Postman history look like this:
```
http://localhost:5000/api/visitors/698f0256e0c139155699cd9f
                                    ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                                    This is a MongoDB ObjectId
```

These long strings are **MongoDB ObjectIds** - unique identifiers for documents in the database.

---

## 📖 URL Structure Breakdown

### Example 1: Register Visitor

```
http://localhost:5000/api/visitors/register
│      │       │     │   │        │
│      │       │     │   │        └─ ACTION: What to do
│      │       │     │   └────────── RESOURCE: What type of data
│      │       │     └───────────── API PREFIX
│      │       └─────────────────── PORT
│      └──────────────────────────── HOST
└───────────────────────────────────── PROTOCOL (http/https)
```

**Breakdown:**
- **Host:** `localhost` = Your computer
- **Port:** `5000` = Server listening on port 5000
- **API:** `/api` = This is an API request
- **Resource:** `/visitors` = We're working with visitors
- **Action:** `/register` = Register a new visitor
- **Method:** POST (send data)
- **No ID:** This is a general action, not for a specific visitor

---

### Example 2: Get Specific Visitor

```
http://localhost:5000/api/visitors/698f0256e0c139155699cd9f
│      │       │     │   │        │
│      │       │     │   │        └─ VISITOR ID (what to get)
│      │       │     │   └────────── RESOURCE: visitors
│      │       │     └───────────── API PREFIX
│      │       └─────────────────── PORT
│      └──────────────────────────── HOST
└───────────────────────────────────── PROTOCOL
```

**Breakdown:**
- **Resource:** `/visitors` = We want visitor data
- **ID:** `698f0256e0c139155699cd9f` = Unique MongoDB ObjectId for this specific visitor
- **Method:** GET (read data)
- **With ID:** This is for a specific visitor

---

### Example 3: Send OTP to Visitor

```
http://localhost:5000/api/visitors/send-otp
│      │       │     │   │        │
│      │       │     │   │        └─ ACTION: Send OTP
│      │       │     │   └────────── RESOURCE: visitors
│      │       │     └───────────── API PREFIX
│      │       └─────────────────── PORT
│      └──────────────────────────── HOST
└───────────────────────────────────── PROTOCOL
```

**Breakdown:**
- **Resource:** `/visitors` = We're working with visitors
- **Action:** `/send-otp` = Send an OTP to a visitor
- **Method:** POST (send data in body)
- **Note:** The visitor ID goes in the REQUEST BODY, not the URL

---

## 🎯 Where Does the ID Come From?

### Step 1: Register a Visitor (NO ID NEEDED)

```
POST /api/visitors/register

Request Body:
{
  "name": "John Doe",
  "phone": "9876543210",
  "host": "HR Department",
  "purpose": "Interview"
}

Response:
{
  "visitorId": "698f0256e0c139155699cd9f"  ← THIS IS YOUR NEW ID!
}
```

### Step 2: Use That ID for Next Requests

```
POST /api/visitors/send-otp

Request Body:
{
  "visitorId": "698f0256e0c139155699cd9f"  ← USE THIS ID FROM STEP 1
}
```

---

## 📝 Types of URLs You'll See

### TYPE 1: List/Get All (No ID needed)

```
GET /api/visitors/pending
GET /api/visitors/active
GET /api/visitors/links
GET /api/admin/dashboard/stats
```

✅ **When to use:** Get multiple items or general data
❌ **No ID in URL**

---

### TYPE 2: Get Specific Item (ID in URL)

```
GET /api/visitors/{{visitor_id}}
GET /api/visitors/links/{{link_id}}
DELETE /api/admin/blacklist/{{blacklist_id}}
```

✅ **When to use:** Get/delete/update ONE specific item
✅ **ID goes in URL**

---

### TYPE 3: Action on Specific Item (ID in Body)

```
POST /api/visitors/send-otp
POST /api/visitors/verify-otp
POST /api/visitors/check-in
POST /api/visitors/approve
```

✅ **When to use:** Perform an action on a specific item
✅ **ID goes in REQUEST BODY**, not URL

---

### TYPE 4: Register via Link (Token in URL)

```
POST /api/visitors/register-via-link/{{registration_link_token}}
```

✅ **When to use:** Register using a registration link
✅ **Token goes in URL**
✅ **Body contains name and phone**

---

## 🔄 Complete Example: Full Workflow

### Step 1: Register Visitor

**URL:** `POST http://localhost:5000/api/visitors/register`

**Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "host": "HR Department",
  "purpose": "Job Interview"
}
```

**Response:**
```json
{
  "visitorId": "698f0256e0c139155699cd9f"
}
```

💾 **Save this ID to environment variable:** `visitor_id = 698f0256e0c139155699cd9f`

---

### Step 2: Send OTP (Use ID from Step 1)

**URL:** `POST http://localhost:5000/api/visitors/send-otp`

**Body:**
```json
{
  "visitorId": "698f0256e0c139155699cd9f"
}
```

**Response:**
```json
{
  "otp": "123456",
  "message": "OTP sent successfully"
}
```

---

### Step 3: Verify OTP (Use same ID)

**URL:** `POST http://localhost:5000/api/visitors/verify-otp`

**Body:**
```json
{
  "visitorId": "698f0256e0c139155699cd9f",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified successfully"
}
```

---

### Step 4: Approve Visitor (Use same ID, with token in header)

**URL:** `POST http://localhost:5000/api/visitors/approve`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Body:**
```json
{
  "visitorId": "698f0256e0c139155699cd9f",
  "validityHours": 24
}
```

**Response:**
```json
{
  "visitor": {
    "id": "698f0256e0c139155699cd9f",
    "status": "approved",
    "qrCode": "data:image/png;base64..."
  }
}
```

---

### Step 5: Get Single Visitor (Use ID in URL)

**URL:** `GET http://localhost:5000/api/visitors/698f0256e0c139155699cd9f`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "_id": "698f0256e0c139155699cd9f",
  "name": "John Doe",
  "phone": "9876543210",
  "status": "approved",
  "qrCode": "data:image/png;base64..."
}
```

---

### Step 6: Check-in (Use ID in body)

**URL:** `POST http://localhost:5000/api/visitors/check-in`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Body:**
```json
{
  "visitorId": "698f0256e0c139155699cd9f"
}
```

**Response:**
```json
{
  "visitor": {
    "id": "698f0256e0c139155699cd9f",
    "status": "checked-in",
    "checkInTime": "2026-03-05T19:45:00.000Z"
  }
}
```

---

## 🎓 Understanding MongoDB ObjectId

A MongoDB ObjectId like `698f0256e0c139155699cd9f` is:

- **24 characters** of hexadecimal (0-9, a-f)
- **Unique identifier** for ONE document in the database
- **Auto-generated** when a new document is created
- **Cannot be changed** (it's the primary key)

Think of it like:
- Your **Aadhar number** (unique to you)
- **Passport number** (unique identifier)
- **Bank account number** (unique to your account)

---

## 🔐 Authorization Tokens

You also see long tokens in URLs:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTg3ZDA3MGNkN2JiMWFhODM2ZjQ3YyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwODM2NDIwMH0.fHxW_H-wH-xKkJl8mJl8kK9l9pQ0rQ1S1sT2uU3vV4w
```

This is a **JWT Token** (JSON Web Token):
- **eyJhbGciOiJIUzI1NiI...** = Header (who created it)
- **eyJpZCI6IjY5YTg3ZDA...** = Payload (your user ID, role, etc.)
- **fHxW_H-wH-xKkJl8mJl...** = Signature (proof it's valid)

Use this token in the `Authorization` header for protected endpoints.

---

## 📊 Quick Reference Table

| Type | URL Example | Has ID | ID Location | Method | Purpose |
|------|-------------|--------|------------|--------|---------|
| **List** | `/api/visitors/pending` | ❌ | - | GET | Get all pending visitors |
| **Get One** | `/api/visitors/698f0256e0c139155699cd9f` | ✅ | URL | GET | Get one specific visitor |
| **Create** | `/api/visitors/register` | ❌ | - | POST | Create new visitor |
| **Action** | `/api/visitors/send-otp` | ✅ | Body | POST | Action on specific visitor |
| **Register Link** | `/api/visitors/register-via-link/abc123` | ✅ | URL | POST | Register using link token |
| **Delete** | `/api/admin/blacklist/698f0256e0c139155699cd9f` | ✅ | URL | DELETE | Delete one item |

---

## ✅ How to Use in Postman

### Option 1: Copy-Paste IDs (Simple)

1. Get the ID from previous response
2. Copy it manually
3. Paste it in the URL or body

**Example:**
```
got ID: 698f0256e0c139155699cd9f
use it: /api/visitors/698f0256e0c139155699cd9f
```

---

### Option 2: Use Environment Variables (Recommended)

1. Save ID to environment:
```javascript
pm.environment.set("visitor_id", "698f0256e0c139155699cd9f");
```

2. Use it in URL:
```
/api/visitors/{{visitor_id}}
```

3. Use it in Body:
```json
{
  "visitorId": "{{visitor_id}}"
}
```

---

### Option 3: Auto-Save with Post-Response Script (Best)

In the **Tests** tab of your register request:

```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("visitor_id", response.visitorId);
    console.log("Visitor ID saved: " + response.visitorId);
}
```

Now every time you register, the ID is automatically saved! ✨

---

## 🎯 Summary

| What | Example | Explanation |
|-----|---------|-------------|
| **Understandable URL** | `/api/visitors/register` | Clear action name |
| **ID URL** | `/api/visitors/698f0256e0c139155699cd9f` | Cryptic but unique |
| **Where ID comes from** | Response of previous request | Copy from response |
| **How to save ID** | `pm.environment.set()` | Auto-save in Postman |
| **How to use saved ID** | `{{visitor_id}}` in URL/Body | Use as variable |

---

## 🚀 Next Steps

1. ✅ **Understand:** URLs have static parts (actions) and dynamic parts (IDs)
2. ✅ **Extract:** Copy IDs from response after creating items
3. ✅ **Save:** Use environment variables or auto-save scripts
4. ✅ **Reuse:** Reference them in subsequent requests
5. ✅ **Test:** Follow the complete workflows in the guide

**Happy Testing!** 🎉
