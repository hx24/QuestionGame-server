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

const server = express();
server.listen(80,error=>{
    if (error) {
        console.log(error)
    }else{
        console.log('服务启动成功，端口80');
    }
});
server.all('*', (req, res, next)=>{
    console.log(req.headers.origin)
    // res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Origin", req.headers.origin); 
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');//和客户端对应，必须设置以后，才能接收cookie.  但是这样设置了之后，Access-Control-Allow-Origin不可设置为* 必须指定请求的域名
    next();
});
// 使用cors中间件更方便
// server.use(cors({
//     credentials: true, 
//     origin: 'http://127.0.0.1:8020', // web前端服务器地址
//     // origin: '*' // 这样会出错
// }))

const db = mysql.createPool({ 
    host: config.mysql_host,
    user: 'root',
    password: '123456',
    database: 'answer'
    // 还有端口port(默认3308可以不写)等参数
});

server.use(bodyParser.urlencoded({extended: false}));   // 当extended为false的时候，键值对中的值就为'String'或'Array'形式，为true的时候，则可为任何数据类型。
server.use(bodyParser.json({})); // 接受json数据
server.use(cookieParser());

var sessionOptions = {
    host: config.mysql_host,
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'answer'
}
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
