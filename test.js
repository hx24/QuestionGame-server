var https  = require('https');
   
var qs = require('querystring'); 
   
var data = { 
    appid: 'wx33d58fb721b10090',
    secret: 'e3ee3678d516bf671a6ce243dd8ac17e',
    js_code: '021dYykW0VWZlU1pprjW04gckW0dYykB',
    grant_type: 'authorization_code'
}
   
var content = qs.stringify(data); 
   
var options = { 
    hostname: 'api.weixin.qq.com', 
    path: '/sns/jscode2session?' + content, 
    method: 'GET' 
}; 
   
var req = https.request(options, function (res) { 
    console.log('STATUS: ' + res.statusCode); 
    res.setEncoding('utf8'); 
    res.on('data', function (chunk) { 
        console.log(JSON.parse(chunk) ); 
    }); 
}); 
   
req.on('error', function (e) { 
    console.log(e); 
}); 
   
req.end();