import urllib.request
import urllib.error
import json

BASE_URL = 'http://127.0.0.1:8000/api'
EMAIL = 'demo2026@example.com'
PASSWORD = 'Password123!'

def make_request(url, method='GET', data=None, headers=None):
    if headers is None: headers = {}
    if data:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode())
        except:
            return None

def check_structure(data, url):
    if not data:
        print(f'[FAIL] {url} returned empty or non-JSON response.')
        return False
        
    keys = set(data.keys())
    expected = {'success', 'message', 'data', 'errors'}
    if keys != expected:
        print(f'[FAIL] {url} returned invalid keys: {keys}')
        return False
    print(f'[PASS] {url} | Success: {data.get("success")} | Errors: {data.get("errors")}')
    return data

login_data = make_request(f'{BASE_URL}/accounts/login/', 'POST', {'identifier': EMAIL, 'password': PASSWORD})
data = check_structure(login_data, '/accounts/login/')

token = data['data'].get('access') or data['data'].get('access_token')
headers = {'Authorization': f'Bearer {token}'}

endpoints = [
    ('GET', '/accounts/profile/', None),
    ('GET', '/dashboard/', None),
    ('GET', '/income/', None),
    ('GET', '/expenses/', None),
    ('GET', '/budgets/', None),
    ('GET', '/goals/', None),
    ('GET', '/categories/', None),
    ('GET', '/notifications/', None),
]

for method, path, body in endpoints:
    url = f'{BASE_URL}{path}'
    resp_data = make_request(url, method, body, headers)
    check_structure(resp_data, path)

