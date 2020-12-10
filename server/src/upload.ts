`export azhost=https://grep32bit.blob.core.windows.net/pcm;\

PUT $azhost/blob333.txt HTTP/1.1 

Content-Type: text/plain; charset=UTF-8 
x-ms-blob-type: PageBlob 
x-ms-blob-content-length: 1024 
x-ms-blob-sequence-number: 0 
Authorization: SharedKey grep32bit:$AZ_KEY`;
