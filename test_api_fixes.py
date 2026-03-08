import requests
import json

BASE_URL = "http://localhost:5000/api"

print("=" * 70)
print("🐛 BUG FIX TEST - APPROVE & CHECKOUT ENDPOINTS")
print("=" * 70)

# Test Setup - Register and verify a visitor
print("\n📝 Setup: Register & Verify Visitor")
visitor_data = {
    "name": "API Fix Test User",
    "phone": "8888777766",
    "host": "Test Host",
    "purpose": "Testing API fix"
}
response = requests.post(f"{BASE_URL}/visitors/register", json=visitor_data)
result = response.json()
visitor_id = result["visitorId"]
otp = result["otp"]
print(f"✅ Visitor registered: {visitor_id}")

# Verify OTP
verify_data = {"phone": "8888777766", "otp": otp}
response = requests.post(f"{BASE_URL}/visitors/verify-otp", json=verify_data)
print(f"✅ OTP verified")

# Host Login
print("\n👨‍💼 Test 1: Host Approve Visitor (THE FIX)")
print("-" * 70)
host_login = {"email": "host@rru.ac.in", "password": "host123"}
response = requests.post(f"{BASE_URL}/auth/login", json=host_login)
host_token = response.json()["token"]
print(f"✅ Host logged in")

# Test CORRECT approve format (after fix)
print(f"\n🔧 Testing FIXED approve endpoint:")
print(f"   Method: POST (not PUT)")
print(f"   URL: /api/visitors/approve (no ID in URL)")
print(f"   Body: {{ visitorId: '{visitor_id}', validityHours: 24 }}")

approve_data = {"visitorId": visitor_id, "validityHours": 24}
headers = {"Authorization": f"Bearer {host_token}"}
response = requests.post(f"{BASE_URL}/visitors/approve", json=approve_data, headers=headers)

print(f"\n📊 Response Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"✅ SUCCESS! Approval works correctly")
    print(f"   Message: {result.get('message')}")
    print(f"   Visitor Status: {result['visitor']['status']}")
    print(f"   QR Code Generated: {'Yes' if result['visitor'].get('qrCode') else 'No'}")
else:
    print(f"❌ FAILED! Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
    exit(1)

# Guard Login
print("\n🛡️ Test 2: Guard Check-Out Visitor (THE FIX)")
print("-" * 70)
guard_login = {"email": "guard@rru.ac.in", "password": "guard123"}
response = requests.post(f"{BASE_URL}/auth/login", json=guard_login)
guard_token = response.json()["token"]
print(f"✅ Guard logged in")

# First check-in the visitor
checkin_data = {"phone": "8888777766"}
headers = {"Authorization": f"Bearer {guard_token}"}
response = requests.post(f"{BASE_URL}/visitors/check-in", json=checkin_data, headers=headers)
result = response.json()
print(f"✅ Visitor checked in: {result['visitor']['status']}")

# Test CORRECT checkout format (after fix)
print(f"\n🔧 Testing FIXED check-out endpoint:")
print(f"   Method: POST (not PUT)")
print(f"   URL: /api/visitors/check-out (no ID in URL)")
print(f"   Body: {{ visitorId: '{visitor_id}' }}")

checkout_data = {"visitorId": visitor_id}
headers = {"Authorization": f"Bearer {guard_token}"}
response = requests.post(f"{BASE_URL}/visitors/check-out", json=checkout_data, headers=headers)

print(f"\n📊 Response Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"✅ SUCCESS! Check-out works correctly")
    print(f"   Message: {result.get('message')}")
    print(f"   Visitor Status: {result['visitor']['status']}")
    print(f"   Check-Out Time: {result['visitor'].get('checkOutTime', 'Not set')}")
else:
    print(f"❌ FAILED! Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
    exit(1)

print("\n" + "=" * 70)
print("✅ ALL FIXES VERIFIED!")
print("=" * 70)
print("\n🎉 Summary:")
print("   ✅ Host approve button → Works (returns JSON, not HTML)")
print("   ✅ Guard check-out button → Works (returns JSON, not HTML)")
print("\n📝 Changes made:")
print("   • host.js: Changed PUT /approve/:id → POST /approve with body")
print("   • guard.js: Changed PUT /check-out/:id → POST /check-out with body")
print("\n🌐 Now test in browser:")
print(f"   Host Portal: http://localhost:5500/host.html")
print(f"   Guard Portal: http://localhost:5500/guard.html")
