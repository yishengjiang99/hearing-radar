export azhost=https://grep32bit.blob.core.windows.net/pcm

PUT https://grep32bit.blob.core.windows.net/pcm/blob333.txt HTTP/1.1 

Content-Type: text/plain; charset=UTF-8 
x-ms-blob-type: PageBlob 
x-ms-blob-content-length: 1024 
Authorization: SharedKey grep32bit:ccpWG/SR/fOjinEHEA/nTRAzX0iC8QlgTJAajrKzzA4mRF0K6pJ3RrwU8AJU5HaJ13skPneq1aqt+0j1FNKS7g==
openssl s_client -connect grep32bit.blob.core.windows.net:443
Request Syntax:  
PUT https://myaccount.blob.core.windows.net/mycontainer/myblob?comp=block&blockid=AAAAAA%3D%3D HTTP/1.1  
  
Request Headers:  
x-ms-version: 2011-08-18  
x-ms-date: Sun, 25 Sep 2011 14:37:35 GMT  
Authorization: SharedKey myaccount:J4ma1VuFnlJ7yfk/Gu1GxzbfdJloYmBPWlfhZ/xn7GI=  
Content-Length: 1048576
Content-Length: 65536

curl -X PUT https://grep32bit.blob.core.windows.net/pcm/appp?comp=page \
-H Authorization: $AZ_KEY grep32bit: \
-H Content-Length: 65536
-H x-ms-date: now()

`GET\n /*HTTP Verb*/  
\n    /*Content-Encoding*/  
\n    /*Content-Language*/  
\n    /*Content-Length (empty string when zero)*/  
\n    /*Content-MD5*/  
\n    /*Content-Type*/  
\n    /*Date*/  
\n    /*If-Modified-Since */  
\n    /*If-Match*/  
\n    /*If-None-Match*/  
\n    /*If-Unmodified-Since*/`

Content-Length|
['put',length,now].join("\n")

PUT + "\n" +  Content-Length+
               Content-Encoding + "\n" +  
               Content-Language + "\n" +  
               Content-Length + "\n" +  
               Content-MD5 + "\n" +  
               Content-Type + "\n" +  
               Date + "\n" +  
               If-Modified-Since + "\n" +  
               If-Match + "\n" +  
               If-None-Match + "\n" +  
               If-Unmodified-Since + "\n" +  
               Range + "\n" +  
               CanonicalizedHeaders +   
               CanonicalizedResource;  GET\n\n\n\n\n\n\n\n\n\n\n\nx-ms-date:Fri, 26 Jun 2015 23:39:12 GMT\nx-ms-version:2015-02-21\n/myaccount/mycontainer\ncomp:metadata\nrestype:container\ntimeout:20  
x-ms-date:Fri, 26 Jun 2015 23:39:12 GMT\nx-ms-version:2015-02-21\n    /*CanonicalizedHeaders*/  
/myaccount /mycontainer\ncomp:metadata\nrestype:container\ntimeout:20    /*CanonicalizedResource*/  