import urllib.request
import json

data = json.dumps({
    'query': 'ನಾನು ಆರ್ಟಿಐ ಅರ್ಜಿಯನ್ನು ಹೇಗೆ ಸಲ್ಲಿಸುವುದು?', 
    'language': 'kn'
}).encode('utf-8')

try:
    print("Sending Kannada test query to local server...")
    req = urllib.request.Request('http://localhost:8000/api/query', data=data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req).read().decode('utf-8')
    res_data = json.loads(res)
    
    print("\n--- Synthesis Output ---")
    print("Language:", res_data.get("lang"))
    print("Situation Summary:", res_data.get("situation_summary"))
    print("Rights:", res_data.get("rights"))
    print("Action Steps:", res_data.get("action_steps"))
    print("Buddy Text:", res_data.get("buddy_text"))
    print("------------------------")
    print("[SUCCESS] Success! Kannada query output verified.")
except Exception as e:
    print(f"[FAIL] Failed: {e}")
