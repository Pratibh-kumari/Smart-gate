# Smart-Gate Backend - Complete Postman Testing Guide

**Last Updated:** March 5, 2026  
**Base URL:** `http://localhost:5000`

---

## 📋 Table of Contents

1. [Setup Postman Environment](#1-setup-postman-environment)
2. [Authentication Tests](#2-authentication-tests)
3. [Visitor Registration & OTP Flow](#3-visitor-registration--otp-flow)
4. [Host Approval Workflow](#4-host-approval-workflow)
5. [Guard Check-in/Check-out](#5-guard-check-incheck-out)
6. [Self-Registration Links](#6-self-registration-links)
7. [Admin Dashboard & Analytics](#7-admin-dashboard--analytics)
8. [Blacklist Management](#8-blacklist-management)
9. [QR Code Expiry & Revocation](#9-qr-code-expiry--revocation)

---

## 1. Setup Postman Environment

### Create Environment Variables

1. Click **Environments** in Postman
2. Create new environment: **Smart-Gate Local**
3. Add these variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:5000` | `http://localhost:5000` |
| `admin_token` | | (will be set automatically) |
| `host_token` | | (will be set automatically) |
| `guard_token` | | (will be set automatically) |
| `visitor_id` | | (will be set automatically) |
| `registration_link_token` | | (will be set automatically) |

4. Select this environment before testing

---

## 2. Authentication Tests

### Test 2.1: Register Admin User

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "name": "Admin User",
    "email": "admin@smartgate.com",
    "password": "admin123",
    "phone": "9876543210",
    "role": "admin"
  }
  ```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "69a...",
    "name": "Admin User",
    "email": "admin@smartgate.com",
    "role": "admin"
  }
}
```

**Post-Response Script (Tests tab):**
```javascript
// Save admin token to environment
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("admin_token", response.token);
    pm.test("Admin registered successfully", () => {
        pm.expect(response.user.role).to.equal("admin");
    });
}
```

---

### Test 2.2: Register Host User

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/register`
- **Body (raw JSON):**
  ```json
  {
    "name": "Host User",
    "email": "host@smartgate.com",
    "password": "host123",
    "phone": "9999888877",
    "role": "host"
  }
  ```

**Post-Response Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("host_token", response.token);
}
```

---

### Test 2.3: Register Guard User

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/register`
- **Body (raw JSON):**
  ```json
  {
    "name": "Guard User",
    "email": "guard@smartgate.com",
    "password": "guard123",
    "phone": "8888777766",
    "role": "guard"
  }
  ```

**Post-Response Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("guard_token", response.token);
}
```

---

### Test 2.4: Login

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body (raw JSON):**
  ```json
  {
    "email": "admin@smartgate.com",
    "password": "admin123"
  }
  ```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "69a...",
    "name": "Admin User",
    "email": "admin@smartgate.com",
    "role": "admin"
  }
}
```

---

### Test 2.5: Get Profile (Protected)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/auth/profile`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Expected Response (200):**
```json
{
  "id": "69a...",
  "name": "Admin User",
  "email": "admin@smartgate.com",
  "role": "admin",
  "phone": "9876543210",
  "isActive": true
}
```

---

## 3. Visitor Registration & OTP Flow

### Test 3.1: Register Visitor (Public)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/register`
- **Body (raw JSON):**
  ```json
  {
    "name": "John Doe",
    "phone": "9876543210",
    "host": "Marketing Department",
    "purpose": "Job Interview"
  }
  ```

**Expected Response (201):**
```json
{
  "message": "Visitor registered successfully",
  "visitorId": "69a87590de863874846a7341"
}
```

**Post-Response Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("visitor_id", response.visitorId);
}
```

---

### Test 3.2: Send OTP (via Twilio Verify)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/send-otp`
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}"
  }
  ```

**Expected Response (200):**
```json
{
  "message": "OTP sent successfully via Twilio Verify",
  "verificationMethod": "twilio-verify",
  "status": "pending"
}
```

**Note:** If Twilio is not configured, you'll get:
```json
{
  "message": "OTP sent successfully via Twilio Verify",
  "otp": "123456",
  "verificationMethod": "mock"
}
```

---

### Test 3.3: Verify OTP

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/verify-otp`
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}",
    "otp": "123456"
  }
  ```

**Expected Response (200):**
```json
{
  "message": "OTP verified successfully via Twilio Verify. Awaiting host approval.",
  "verificationMethod": "mock",
  "visitor": {
    "id": "69a87590de863874846a7341",
    "name": "John Doe",
    "status": "pending",
    "isVerified": true
  }
}
```

---

### Test 3.4: Get Visitor by ID (Protected)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/visitors/{{visitor_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```

**Expected Response (200):**
```json
{
  "_id": "69a87590de863874846a7341",
  "name": "John Doe",
  "phone": "9876543210",
  "host": "Marketing Department",
  "purpose": "Job Interview",
  "status": "pending",
  "isVerified": true,
  "createdAt": "2026-03-05T...",
  "updatedAt": "2026-03-05T..."
}
```

---

## 4. Host Approval Workflow

### Test 4.1: Get Pending Visitors (Host Only)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/visitors/pending`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```

**Expected Response (200):**
```json
{
  "count": 1,
  "visitors": [
    {
      "_id": "69a87590de863874846a7341",
      "name": "John Doe",
      "phone": "9876543210",
      "host": "Marketing Department",
      "purpose": "Job Interview",
      "status": "pending",
      "isVerified": true,
      "createdAt": "2026-03-05T..."
    }
  ]
}
```

---

### Test 4.2: Approve Visitor with Custom QR Expiry

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/approve`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}",
    "validityHours": 24
  }
  ```

**Expected Response (200):**
```json
{
  "message": "Visitor approved successfully",
  "visitor": {
    "_id": "69a87590de863874846a7341",
    "name": "John Doe",
    "status": "approved",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhE...",
    "qrValidUntil": "2026-03-06T19:30:00.000Z",
    "hostApprovedBy": "69a87d070cd7bb1aa836f47c",
    "hostApprovedAt": "2026-03-05T19:30:00.000Z"
  },
  "qrExpiresAt": "2026-03-06T19:30:00.000Z"
}
```

**SMS Notification:** Visitor receives approval SMS automatically

---

### Test 4.3: Reject Visitor

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/reject`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}",
    "reason": "Invalid purpose of visit"
  }
  ```

**Expected Response (200):**
```json
{
  "message": "Visitor rejected",
  "visitor": {
    "_id": "69a87590de863874846a7341",
    "status": "rejected",
    "rejectionReason": "Invalid purpose of visit",
    "hostApprovedBy": "69a87d070cd7bb1aa836f47c",
    "hostApprovedAt": "2026-03-05T19:30:00.000Z"
  }
}
```

---

## 5. Guard Check-in/Check-out

### Test 5.1: Check-in Visitor (Guard Only)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/check-in`
- **Headers:**
  ```
  Authorization: Bearer {{guard_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}"
  }
  ```

**Expected Response (200):**
```json
{
  "message": "Visitor checked in successfully",
  "visitor": {
    "id": "69a87590de863874846a7341",
    "name": "John Doe",
    "status": "checked-in",
    "checkInTime": "2026-03-05T19:45:00.000Z"
  }
}
```

**SMS Notification:** Visitor receives check-in confirmation SMS

---

### Test 5.2: Get Active Visitors (Guard Only)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/visitors/active`
- **Headers:**
  ```
  Authorization: Bearer {{guard_token}}
  ```

**Expected Response (200):**
```json
{
  "count": 1,
  "visitors": [
    {
      "_id": "69a87590de863874846a7341",
      "name": "John Doe",
      "phone": "9876543210",
      "host": "Marketing Department",
      "status": "checked-in",
      "checkInTime": "2026-03-05T19:45:00.000Z",
      "checkInBy": {
        "_id": "69a...",
        "name": "Guard User",
        "email": "guard@smartgate.com"
      }
    }
  ]
}
```

---

### Test 5.3: Check-out Visitor (Guard Only)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/check-out`
- **Headers:**
  ```
  Authorization: Bearer {{guard_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}"
  }
  ```

**Expected Response (200):**
```json
{
  "message": "Visitor checked out successfully",
  "visitor": {
    "id": "69a87590de863874846a7341",
    "name": "John Doe",
    "status": "checked-out",
    "checkInTime": "2026-03-05T19:45:00.000Z",
    "checkOutTime": "2026-03-05T21:15:00.000Z",
    "visitDuration": "90 minutes"
  }
}
```

**SMS Notification:** Visitor receives check-out confirmation with duration

---

## 6. Self-Registration Links

### Test 6.1: Generate Registration Link (Host/Admin)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/links/generate`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "host": "HR Department",
    "purpose": "Job Interview",
    "validityDays": 7,
    "maxUses": 50
  }
  ```

**Expected Response (201):**
```json
{
  "message": "Registration link generated successfully",
  "link": {
    "_id": "69a...",
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "host": "HR Department",
    "purpose": "Job Interview",
    "validUntil": "2026-03-12T19:30:00.000Z",
    "maxUses": 50,
    "usedCount": 0,
    "createdBy": "69a87d070cd7bb1aa836f47c",
    "isActive": true,
    "createdAt": "2026-03-05T19:30:00.000Z"
  },
  "url": "http://localhost:3000/register/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhE...",
  "expiresAt": "2026-03-12T19:30:00.000Z"
}
```

**Post-Response Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("registration_link_token", response.link.token);
}
```

---

### Test 6.2: Register Visitor via Link (Public)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/register-via-link/{{registration_link_token}}`
- **Body (raw JSON):**
  ```json
  {
    "name": "Jane Smith",
    "phone": "8888999900"
  }
  ```

**Expected Response (201):**
```json
{
  "message": "Visitor registered successfully via self-registration link",
  "visitorId": "69a...",
  "host": "HR Department",
  "purpose": "Job Interview"
}
```

**Note:** This endpoint automatically assigns host and purpose from the link

---

### Test 6.3: Get All Registration Links (Host/Admin)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/visitors/links`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```

**Expected Response (200):**
```json
{
  "count": 1,
  "links": [
    {
      "_id": "69a...",
      "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      "host": "HR Department",
      "purpose": "Job Interview",
      "validUntil": "2026-03-12T19:30:00.000Z",
      "maxUses": 50,
      "usedCount": 1,
      "createdBy": {
        "_id": "69a...",
        "name": "Host User",
        "email": "host@smartgate.com"
      },
      "isActive": true,
      "createdAt": "2026-03-05T19:30:00.000Z"
    }
  ]
}
```

---

### Test 6.4: Deactivate Registration Link

**Request:**
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/visitors/links/{{link_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```

**Expected Response (200):**
```json
{
  "message": "Registration link deactivated successfully",
  "link": {
    "_id": "69a...",
    "isActive": false
  }
}
```

---

## 7. Admin Dashboard & Analytics

### Test 7.1: Get Dashboard Statistics (Admin Only)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/admin/dashboard/stats`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Expected Response (200):**
```json
{
  "today": {
    "totalVisitors": 15,
    "checkedIn": 5,
    "checkedOut": 8,
    "pending": 2
  },
  "week": {
    "totalVisitors": 87,
    "checkedIn": 32,
    "checkedOut": 48,
    "pending": 7
  },
  "month": {
    "totalVisitors": 342,
    "checkedIn": 128,
    "checkedOut": 201,
    "pending": 13
  },
  "current": {
    "activeVisitors": 5,
    "pendingApprovals": 2
  },
  "statusBreakdown": [
    { "_id": "checked-out", "count": 201 },
    { "_id": "checked-in", "count": 5 },
    { "_id": "approved", "count": 20 },
    { "_id": "pending", "count": 2 },
    { "_id": "rejected", "count": 14 }
  ]
}
```

---

### Test 7.2: Get Visitor Logs with Filters (Admin)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/admin/visitors/logs?page=1&limit=10&status=checked-in&search=John`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (pending, approved, rejected, checked-in, checked-out)
- `search` - Search in name, phone, host, purpose
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)

**Expected Response (200):**
```json
{
  "visitors": [
    {
      "_id": "69a...",
      "name": "John Doe",
      "phone": "9876543210",
      "host": "Marketing Department",
      "purpose": "Job Interview",
      "status": "checked-in",
      "checkInTime": "2026-03-05T19:45:00.000Z",
      "isVerified": true,
      "createdAt": "2026-03-05T18:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pages": 1,
    "limit": 10
  }
}
```

---

### Test 7.3: Get Overstay Alerts (Admin)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/admin/visitors/overstay?maxHours=4`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Query Parameters:**
- `maxHours` - Threshold in hours (default: 4)

**Expected Response (200):**
```json
{
  "count": 2,
  "threshold": "4 hours",
  "overstayVisitors": [
    {
      "visitor": {
        "_id": "69a...",
        "name": "John Doe",
        "phone": "9876543210",
        "host": "Marketing Department"
      },
      "checkInTime": "2026-03-05T10:00:00.000Z",
      "hoursInside": 6.5,
      "severity": "high",
      "message": "Visitor has been inside for 6.5 hours (threshold: 4 hours)"
    }
  ]
}
```

---

## 8. Blacklist Management

### Test 8.1: Add to Blacklist (Admin Only)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/admin/blacklist`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "phone": "9999999999",
    "name": "Banned Person",
    "reason": "Security violation"
  }
  ```

**Expected Response (201):**
```json
{
  "message": "Phone number added to blacklist successfully",
  "blacklist": {
    "_id": "69a...",
    "phone": "9999999999",
    "name": "Banned Person",
    "reason": "Security violation",
    "addedBy": "69a87d070cd7bb1aa836f47c",
    "isActive": true,
    "createdAt": "2026-03-05T19:30:00.000Z"
  }
}
```

---

### Test 8.2: Get All Blacklisted Numbers (Admin)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/admin/blacklist`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Expected Response (200):**
```json
{
  "count": 1,
  "blacklist": [
    {
      "_id": "69a...",
      "phone": "9999999999",
      "name": "Banned Person",
      "reason": "Security violation",
      "addedBy": {
        "_id": "69a...",
        "name": "Admin User",
        "email": "admin@smartgate.com"
      },
      "isActive": true,
      "createdAt": "2026-03-05T19:30:00.000Z"
    }
  ]
}
```

---

### Test 8.3: Check if Phone is Blacklisted (Admin)

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/admin/blacklist/check?phone=9999999999`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Expected Response (200):**
```json
{
  "isBlacklisted": true,
  "reason": "Security violation",
  "addedAt": "2026-03-05T19:30:00.000Z"
}
```

---

### Test 8.4: Remove from Blacklist (Admin)

**Request:**
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/admin/blacklist/{{blacklist_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Expected Response (200):**
```json
{
  "message": "Phone number removed from blacklist successfully"
}
```

---

### Test 8.5: Verify Blacklist Blocks Registration (Public)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/register`
- **Body (raw JSON):**
  ```json
  {
    "name": "Blocked User",
    "phone": "9999999999",
    "host": "Test",
    "purpose": "Test"
  }
  ```

**Expected Response (403):**
```json
{
  "message": "Registration denied. Phone number is blacklisted.",
  "reason": "Security violation"
}
```

---

## 9. QR Code Expiry & Revocation

### Test 9.1: Revoke QR Code (Host/Admin)

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/revoke-qr`
- **Headers:**
  ```
  Authorization: Bearer {{host_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}",
    "reason": "Security concern"
  }
  ```

**Expected Response (200):**
```json
{
  "message": "Visitor QR code revoked successfully",
  "visitor": {
    "id": "69a87590de863874846a7341",
    "name": "John Doe",
    "isQrRevoked": true,
    "revokedAt": "2026-03-05T20:00:00.000Z",
    "reason": "Security concern"
  }
}
```

---

### Test 9.2: Verify Revoked QR is Blocked at Check-in

**Request:**
- **Method:** `POST`
- **URL:** `{{base_url}}/api/visitors/check-in`
- **Headers:**
  ```
  Authorization: Bearer {{guard_token}}
  ```
- **Body (raw JSON):**
  ```json
  {
    "visitorId": "{{visitor_id}}"
  }
  ```

**Expected Response (403):**
```json
{
  "message": "Visitor pass has been revoked",
  "reason": "Security concern",
  "revokedAt": "2026-03-05T20:00:00.000Z"
}
```

---

### Test 9.3: Verify Expired QR is Blocked at Check-in

**Steps:**
1. Approve visitor with 1-hour expiry: `validityHours: 1`
2. Wait 1 hour (or manually change `qrValidUntil` in database to past time)
3. Try to check-in

**Expected Response (403):**
```json
{
  "message": "Visitor pass has expired",
  "expiredAt": "2026-03-05T20:30:00.000Z"
}
```

---

## 🎯 Complete End-to-End Testing Sequence

### Sequence 1: Basic Visitor Flow

1. ✅ Register Admin, Host, Guard
2. ✅ Register Visitor (public)
3. ✅ Send & Verify OTP
4. ✅ Host views pending visitors
5. ✅ Host approves visitor
6. ✅ Guard checks in visitor
7. ✅ Guard views active visitors
8. ✅ Guard checks out visitor

### Sequence 2: Self-Registration Link Flow

1. ✅ Host generates registration link
2. ✅ Visitor registers via link (public)
3. ✅ Send & Verify OTP
4. ✅ Host approves with custom QR expiry
5. ✅ Guard checks in

### Sequence 3: Admin & Security Features

1. ✅ Admin views dashboard stats
2. ✅ Admin searches visitor logs
3. ✅ Admin checks overstay alerts
4. ✅ Admin adds phone to blacklist
5. ✅ Verify blacklisted phone cannot register
6. ✅ Host revokes QR code
7. ✅ Verify revoked QR cannot check-in

---

## 🔐 Authorization Matrix

| Endpoint | Public | Admin | Host | Guard |
|----------|--------|-------|------|-------|
| Register | ✅ | - | - | - |
| Login | ✅ | - | - | - |
| Send OTP | ✅ | - | - | - |
| Verify OTP | ✅ | - | - | - |
| Get Profile | - | ✅ | ✅ | ✅ |
| Get Pending | - | ✅ | ✅ | - |
| Approve | - | ✅ | ✅ | - |
| Reject | - | ✅ | ✅ | - |
| Revoke QR | - | ✅ | ✅ | - |
| Check-in | - | ✅ | - | ✅ |
| Check-out | - | ✅ | - | ✅ |
| Active Visitors | - | ✅ | - | ✅ |
| Generate Link | - | ✅ | ✅ | - |
| Dashboard | - | ✅ | - | - |
| Blacklist | - | ✅ | - | - |

---

## 📦 Postman Collection Import

Save this as `Smart-Gate.postman_collection.json`:

```json
{
  "info": {
    "name": "Smart-Gate Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    }
  ]
}
```

---

## ✅ Success Criteria

All tests pass when:
- ✅ Authentication tokens are saved automatically
- ✅ Role-based access control works correctly
- ✅ OTP sends via Twilio Verify (or mock mode)
- ✅ QR codes generated with expiry
- ✅ Blacklisted phones cannot register
- ✅ Revoked/expired QR codes cannot check-in
- ✅ Dashboard shows correct statistics
- ✅ SMS notifications sent (if Twilio configured)

---

**Testing Time:** ~30-45 minutes for complete test suite  
**Prerequisites:** Backend server running on port 5000, MongoDB connected

🎉 **Happy Testing!**
