import requests
import json

BASE_URL = "http://localhost:5000/api"

print("=" * 70)
print("🔍 GUARD PORTAL - APPROVED VISITORS FEATURE TEST")
print("=" * 70)

# Test 1: Register and approve a visitor
print("\n📝 STEP 1: Register Visitor")
visitor_data = {
    "name": "Guard Test Visitor",
    "phone": "9999888877",
    "host": "Dr. Kumar",
    "purpose": "Testing guard approved view"
}
response = requests.post(f"{BASE_URL}/visitors/register", json=visitor_data)
result = response.json()
visitor_id = result["visitorId"]
otp = result["otp"]
print(f"✅ Registered: {visitor_id}, OTP: {otp}")

# Verify OTP
print("\n🔐 STEP 2: Verify OTP")
verify_data = {"phone": "9999888877", "otp": otp}
response = requests.post(f"{BASE_URL}/visitors/verify-otp", json=verify_data)
result = response.json()
print(f"✅ OTP verified! Status: {result['visitor']['status']}")

# Host login
print("\n👨‍💼 STEP 3: Host Login & Approve")
host_login = {"email": "host@rru.ac.in", "password": "host123"}
response = requests.post(f"{BASE_URL}/auth/login", json=host_login)
host_token = response.json()["token"]
print(f"✅ Host logged in")

# Approve visitor
approve_data = {"visitorId": visitor_id, "validityHours": 24}
headers = {"Authorization": f"Bearer {host_token}"}
response = requests.post(f"{BASE_URL}/visitors/approve", json=approve_data, headers=headers)
result = response.json()
print(f"✅ Visitor approved! Status: {result['visitor']['status']}")

# Guard login
print("\n🛡️ STEP 4: Guard Login")
guard_login = {"email": "guard@rru.ac.in", "password": "guard123"}
response = requests.post(f"{BASE_URL}/auth/login", json=guard_login)
guard_token = response.json()["token"]
print(f"✅ Guard logged in")

# Test NEW endpoint: Get approved visitors
print("\n✨ STEP 5: Guard Gets Approved Visitors (NEW FEATURE)")
print("-" * 70)
headers = {"Authorization": f"Bearer {guard_token}"}
response = requests.get(f"{BASE_URL}/visitors/approved", headers=headers)
result = response.json()

print(f"Status Code: {response.status_code}")
print(f"Response Structure: {list(result.keys())}")

if "visitors" in result:
    print(f"✅ SUCCESS! Endpoint returns {{ visitors: [...] }}")
    print(f"✅ Found {len(result['visitors'])} approved visitor(s) waiting")
    
    if len(result['visitors']) > 0:
        print(f"\n📋 Approved Visitors List:")
        for i, v in enumerate(result['visitors'][:5], 1):
            print(f"   {i}. {v['name']} - {v['phone']} - Host: {v['host']}")
            print(f"      Purpose: {v['purpose']}")
            print(f"      Status: {v['status']}")
            print()
else:
    print(f"❌ FAILED! Response doesn't have 'visitors' key")

print("\n" + "=" * 70)
print("✅ GUARD PORTAL FEATURE TEST COMPLETE!")
print("=" * 70)
print("\n🎉 Now open: http://localhost:5500/guard.html")
print("   Login with: guard@rru.ac.in / guard123")
print("   You should see:")
print("   ✅ 'Approved Visitors (Waiting for Check-In)' section")
print(f"   ✅ At least {len(result.get('visitors', []))} approved visitor(s) listed")
print("   ✅ Quick check-in buttons for each visitor")
