import urllib.request
import json

def test_query(query, lang):
    data = json.dumps({
        'query': query,
        'language': lang
    }).encode('utf-8')

    try:
        print(f"Sending test query ({lang}): '{query}' to server on port 8005...")
        req = urllib.request.Request(
            'http://localhost:8005/api/query', 
            data=data, 
            headers={'Content-Type': 'application/json'}
        )
        res_bytes = urllib.request.urlopen(req).read()
        res = json.loads(res_bytes.decode('utf-8'))
        
        print(f"✅ Success for language: {lang}!")
        print(f"Situation Summary: {res.get('situation_summary')}")
        print(f"Severity Level: {res.get('severity_level')}")
        print(f"Rights count: {len(res.get('rights', []))}")
        print(f"Do not do count: {len(res.get('do_not_do', []))}")
        print(f"Buddy Text: {res.get('buddy_text')[:150]}...")
        print("-" * 50)
    except Exception as e:
        print(f"❌ Failed to query backend server: {e}")

if __name__ == '__main__':
    # Test Kannada
    test_query('ನನ್ನ ನೆರೆಹೊರೆಯವರನ್ನು ವಾರಂಟ್ ಇಲ್ಲದೆ ಬಂಧಿಸಲಾಗಿದೆ', 'kn')
    # Test Hindi
    test_query('पुलिस ने बिना वारंट गिरफ्तार किया', 'hi')
