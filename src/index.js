const express=require('express');
const bodyParser=require('body-parser');
const multer=require('multer');
const expressStatic=require('express-static');
const mysql=require('mysql');
const consolidate=require('consolidate');
const cookieParser=require('cookie-parser');
const session = require('express-session');
const path=require('path');
const cors=require('cors');
const SessionStore = require('express-mysql-session');
const config = require('./config.json');
const db = require('./lib/util').db;


const server = express();
server.listen(80,error=>{
    if (error) {
        console.log(error)
    }else{
        console.log('服务启动成功，端口80');
    }
});
// server.use(cors({
//     credentials: true, 
//     origin: 'http://192.168.1.137:4444', // web前端服务器地址
//     // origin: '*' // 这样会出错
// }))
server.use(cors({
    credentials: true,
    origin: function (origin, callback) {   // 允许任意域名的跨域请求
        callback(null, true)
    }
}))


server.use(bodyParser.urlencoded({extended: false}));   // 当extended为false的时候，键值对中的值就为'String'或'Array'形式，为true的时候，则可为任何数据类型。
server.use(bodyParser.json({})); // 接受json数据
server.use(cookieParser());

var sessionOptions = config.mysql_config;

server.use(session({
        secret: "mySecretKey",
        key: "question",
        // proxy: "true",
        resave: true,
        rolling: true,
        cookie:{
            maxAge: 1*3600*1000 // default session expiration is set to 1 hour  
        },
        saveUninitialized: false,
        store: new SessionStore(sessionOptions)
}));

server.set('view engine', 'html');
server.set('views', path.join(__dirname, "./template"));  // 注意读写文件时一定要path拼接路径，直接使用相对路径不可靠。具体看笔记中1.服务器基础
server.engine('html', consolidate.ejs);


server.use('/admin',require('./route/admin/index'));
server.use('/user',require('./route/user/index'));


server.use('/',(req,res,next)=>{
    if(req.url==='/')
    res.sendFile(path.join(__dirname, "./static/index.html"))
    else
    next();
})
server.use(expressStatic(path.join(__dirname, "./static")));
