import httpx
import json

BASE_URL = "http://localhost:8088"

def test_integration():
    client = httpx.Client()
    print("1. Testing login with seeded user...")
    login_payload = {
        "email": "lijin.ns@iimbx.iimb.ac.in",
        "password": "Welcome@123"
    }
    res = client.post(f"{BASE_URL}/auth/login", json=login_payload)
    if res.status_code != 200:
        print(f"FAILED to log in: {res.status_code} - {res.text}")
        return
    
    login_data = res.json()
    token = login_data["access_token"]
    print(f"Login success! Token prefix: {token[:15]}...")
    
    # Set auth header
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n2. Testing account profile retrieval...")
    res = client.get(f"{BASE_URL}/account/profile", headers=headers)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    
    print("\n3. Testing Open edX Status...")
    res = client.get(f"{BASE_URL}/account/openedx/status", headers=headers)
    print(f"Status: {res.status_code}")
    status_data = res.json()
    print(json.dumps(status_data, indent=2))
    
    print("\n4. Testing connecting Open edX account...")
    connect_payload = {"lms_username": "lijin.ns"}
    res = client.post(f"{BASE_URL}/account/openedx/connect", json=connect_payload, headers=headers)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    
    print("\n5. Testing Open edX sync...")
    res = client.post(f"{BASE_URL}/account/openedx/sync", headers=headers)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    
    print("\n6. Testing course listings...")
    res = client.get(f"{BASE_URL}/api/courses", headers=headers)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json()[:2] if isinstance(res.json(), list) else res.json(), indent=2))
    
    print("\n7. Testing goals stats...")
    res = client.get(f"{BASE_URL}/goals/stats", headers=headers)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))

    print("\n8. Testing unauthorized request (no token)...")
    res = client.get(f"{BASE_URL}/account/profile")
    print(f"Status: {res.status_code} (Expected: 401)")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_integration()
