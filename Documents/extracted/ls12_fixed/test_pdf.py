import urllib.request
import json

data = json.dumps({
    'guidance': 'Situation - पुलिस ने बिना वारंट गिरफ्तार किया. संघीय न्यायालय के आदेश के बिना, उन्हें क्या करना चाहिए? पुलिस के निर्देशों के अनुरूप, उन्हें निम्नलिखित कार्रवाई में सहयोग करना चाहिए:', 
    'query': 'पुलिस ने बिना वारंट गिरफ्तार किया'
}).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/api/download-pdf', data=data, headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req).read()

with open('test_download.pdf', 'wb') as f:
    f.write(res)
print("PDF download success!")
