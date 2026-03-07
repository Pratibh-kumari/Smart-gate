import requests
import json
import time

BASE_URL = "http://localhost:5000"


def print_step(title):
    print(f"\n{'=' * 70}\n{title}\n{'=' * 70}")


def show_response(label, response):
    print(f"{label} -> HTTP {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except Exception:
        print(response.text)


def request(method, path, token=None, payload=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    return requests.request(
        method=method,
        url=f"{BASE_URL}{path}",
        headers=headers,
        json=payload,
        timeout=12,
    )


print_step("SMART-GATE END-TO-END TEST")

# 0) Health check
resp = request("GET", "/")
show_response("Health", resp)
assert resp.status_code == 200, "Server health check failed"

suffix = str(int(time.time()))
host_email = f"host_{suffix}@smartgate.local"
guard_email = f"guard_{suffix}@smartgate.local"
common_password = "Pass@1234"

# 1) Register host user
print_step("1) Register Host User")
resp = request(
    "POST",
    "/api/auth/register",
    payload={
        "name": "Host User",
        "email": host_email,
        "password": common_password,
        "phone": "9999999991",
        "role": "host",
    },
)
show_response("Register host", resp)
assert resp.status_code == 201, "Host registration failed"
host_token = resp.json().get("token")
assert host_token, "Host token missing"

# 2) Register guard user
print_step("2) Register Guard User")
resp = request(
    "POST",
    "/api/auth/register",
    payload={
        "name": "Guard User",
        "email": guard_email,
        "password": common_password,
        "phone": "9999999992",
        "role": "guard",
    },
)
show_response("Register guard", resp)
assert resp.status_code == 201, "Guard registration failed"
guard_token = resp.json().get("token")
assert guard_token, "Guard token missing"

# 3) Register visitor
print_step("3) Register Visitor")
resp = request(
    "POST",
    "/api/visitors/register",
    payload={
        "name": "E2E Visitor",
        "phone": "9876543210",
        "host": "Host User",
        "purpose": "Workflow test",
    },
)
show_response("Register visitor", resp)
assert resp.status_code == 201, "Visitor registration failed"
visitor_id = resp.json().get("visitorId")
assert visitor_id, "visitorId missing"

# 4) Send OTP
print_step("4) Send OTP")
resp = request("POST", "/api/visitors/send-otp", payload={"visitorId": visitor_id})
show_response("Send OTP", resp)
assert resp.status_code == 200, "send-otp failed"
send_otp_json = resp.json()
otp = send_otp_json.get("otp")
if not otp:
    print("OTP not returned (likely live Twilio Verify mode). Using fallback demo OTP 123456.")
    otp = "123456"

# 5) Verify OTP
print_step("5) Verify OTP")
resp = request(
    "POST",
    "/api/visitors/verify-otp",
    payload={"visitorId": visitor_id, "otp": otp},
)
show_response("Verify OTP", resp)
assert resp.status_code == 200, "verify-otp failed"

# 6) Host views pending
print_step("6) Host Gets Pending Visitors")
resp = request("GET", "/api/visitors/pending", token=host_token)
show_response("Pending visitors", resp)
assert resp.status_code == 200, "pending visitors failed"

# 7) Host approves visitor
print_step("7) Host Approves Visitor")
resp = request(
    "POST",
    "/api/visitors/approve",
    token=host_token,
    payload={"visitorId": visitor_id, "validityHours": 24},
)
show_response("Approve visitor", resp)
assert resp.status_code == 200, "approve visitor failed"

# 8) Guard check-in
print_step("8) Guard Checks In Visitor")
resp = request(
    "POST",
    "/api/visitors/check-in",
    token=guard_token,
    payload={"visitorId": visitor_id},
)
show_response("Check-in visitor", resp)
assert resp.status_code == 200, "check-in failed"

# 9) Guard active visitors
print_step("9) Guard Gets Active Visitors")
resp = request("GET", "/api/visitors/active", token=guard_token)
show_response("Active visitors", resp)
assert resp.status_code == 200, "active visitors failed"

print_step("✅ END-TO-END RESULT: ALL CRITICAL STEPS PASSED")
print(f"Visitor ID tested: {visitor_id}")
