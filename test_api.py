import requests
import json
import time

BASE_URL = "http://localhost:5000"

print("=" * 60)
print("🚀 SMART-GATE PROJECT TEST SUITE")
print("=" * 60)

# Test 1: Server Health
print("\n✅ TEST 1: Server Health")
try:
    response = requests.get(f"{BASE_URL}/", timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Register Visitor
print("\n✅ TEST 2: Register Visitor")
visitor_data = {
    "name": "John Test",
    "phone": "9876543210",
    "host": "HR Department",
    "purpose": "Test Interview"
}
try:
    response = requests.post(f"{BASE_URL}/api/visitors/register", json=visitor_data, timeout=5)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {json.dumps(result, indent=2)}")
    if "visitorId" in result:
        visitor_id = result["visitorId"]
        print(f"   ✓ Visitor ID: {visitor_id}")
    elif "_id" in result:
        visitor_id = result["_id"]
        print(f"   ✓ Visitor ID: {visitor_id}")
    else:
        visitor_id = None
except Exception as e:
    print(f"   ❌ Error: {e}")
    visitor_id = None

# Test 3: Get Pending Visitors
print("\n✅ TEST 3: Get All Pending Visitors")
try:
    response = requests.get(f"{BASE_URL}/api/visitors/pending", timeout=5)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Pending Visitors Count: {len(result) if isinstance(result, list) else 'N/A'}")
    if isinstance(result, list) and len(result) > 0:
        print(f"   First visitor: {result[0].get('name', 'N/A')}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Send OTP (if visitor_id exists)
if visitor_id:
    print("\n✅ TEST 4: Send OTP")
    otp_data = {"visitorId": visitor_id}
    try:
        response = requests.post(f"{BASE_URL}/api/visitors/send-otp", json=otp_data, timeout=5)
        print(f"   Status: {response.status_code}")
        result = response.json()
        print(f"   Response: {json.dumps(result, indent=2)}")
        otp = result.get("otp", "Not provided")
        print(f"   OTP: {otp}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Test 5: Verify OTP
    print("\n✅ TEST 5: Verify OTP")
    verify_data = {"visitorId": visitor_id, "otp": "123456"}  # Using dummy OTP
    try:
        response = requests.post(f"{BASE_URL}/api/visitors/verify-otp", json=verify_data, timeout=5)
        print(f"   Status: {response.status_code}")
        result = response.json()
        print(f"   Response: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Test 6: Get Single Visitor
    print(f"\n✅ TEST 6: Get Single Visitor (ID: {visitor_id[:8]}...)")
    try:
        response = requests.get(f"{BASE_URL}/api/visitors/{visitor_id}", timeout=5)
        print(f"   Status: {response.status_code}")
        result = response.json()
        print(f"   Visitor Name: {result.get('name', 'N/A')}")
        print(f"   Visitor Status: {result.get('status', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

# Test 7: Auth Routes
print("\n✅ TEST 7: Authentication Routes")
print("   (Skipping - requires valid credentials)")

# Test 8: Admin Routes
print("\n✅ TEST 8: Admin Routes")
print("   (Skipping - requires authentication token)")

print("\n" + "=" * 60)
print("✨ TEST SUITE COMPLETE")
print("=" * 60)
