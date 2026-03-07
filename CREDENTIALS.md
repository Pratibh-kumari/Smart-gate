# Smart Gate System - Login Credentials

## 📋 Default User Accounts

### 🛡️ Guard Portal
**Access:** http://localhost:5500/guard.html

- **Email:** `guard@rru.ac.in`
- **Password:** `guard123`
- **Role:** Guard (Check-in/Check-out visitors)

---

### 👨‍💼 Host Portal  
**Access:** http://localhost:5500/host.html

**Option 1 - Host User:**
- **Email:** `host@rru.ac.in`
- **Password:** `host123`
- **Role:** Host (Approve visitor requests)

**Option 2 - Admin User:**
- **Email:** `admin@rru.ac.in`
- **Password:** `admin123`
- **Role:** Host/Admin (Approve visitor requests)

---

### 👤 Visitor Portal
**Access:** http://localhost:5500/visitor.html

**No login required** - Visitors can:
- Register their visit
- Receive OTP (6-digit code shown in browser for testing)
- Verify OTP to complete registration

---

## 🔄 How to Create New Users

If you need to create additional users, run:

```bash
cd backend
npm run seed
```

Or register via API:
```bash
POST http://localhost:5000/api/auth/register
{
  "name": "New Guard",
  "email": "newguard@rru.ac.in",
  "password": "password123",
  "phone": "9876543213",
  "role": "guard"
}
```

**Available Roles:**
- `guard` - Check-in/check-out access
- `host` - Approve visitor requests

---

## 🧪 Testing Workflow

1. **Visitor Registration:**
   - Go to visitor portal → Register
   - Note the 6-digit OTP shown in the response
   - Verify OTP

2. **Host Approval:**
   - Login to host portal with credentials above
   - See pending visitor in the table
   - Click "24h" or "72h" to approve

3. **Guard Check-in:**
   - Login to guard portal
   - Enter visitor phone number
   - Click "Check In Visitor"
   - Visitor appears in active visitors table

4. **Guard Check-out:**
   - In active visitors table
   - Click "Check Out" button

---

## 🔒 Security Notes

⚠️ **Important:** These are **demo credentials** for development only.

For production:
- Change all passwords
- Remove OTP from API response
- Enable real SMS service (Twilio)
- Use environment variables for secrets

---

## 📞 Need Help?

Run seed script again to see credentials:
```bash
cd backend
npm run seed
```
