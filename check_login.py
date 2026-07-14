import urllib.request,urllib.error,json 
url='http://localhost:8080/api/auth/login' 
data=json.dumps({'email':'admin@insurancepro.com','password':'Admin@123'}).encode('utf-8') 
req=urllib.request.Request(url,data=data,headers={'Content-Type':'application/json'}) 
try: 
    resp=urllib.request.urlopen(req,timeout=10) 
    print('STATUS',resp.status) 
    print(resp.read().decode('utf-8')) 
except urllib.error.HTTPError as e: 
    print('HTTPError',e.code) 
    print(e.read().decode('utf-8')) 
except Exception as e: 
    print('ERROR',type(e).__name__,e) 
