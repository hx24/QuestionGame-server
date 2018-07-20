const express=require('express');
const bodyParser=require('body-parser');
const multer=require('multer');
const expressStatic=require('express-static');
const mysql=require('mysql');
const consolidate=require('consolidate');
const cookieParser=require('cookie-parser');
const cookieSession=require('cookie-session');
const path=require('path');
const cors=require('cors');

const server = express();
server.listen(8000);
// server.all('*', (req, res, next)=>{
//     // res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Origin", "http://localhost:4444"); 
//     res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     res.header('Access-Control-Allow-Credentials', 'true');//和客户端对应，必须设置以后，才能接收cookie.  但是这样设置了之后，Access-Control-Allow-Origin不可设置为* 必须指定请求的域名
//     next();
// });
// 使用cors中间件更方便
server.use(cors({
    credentials: true, 
    origin: 'http://localhost:4444', // web前端服务器地址
    // origin: '*' // 这样会出错
}))

const db = mysql.createPool({ 
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'answer'
    // 还有端口port(默认3308可以不写)等参数
});

server.use(bodyParser.urlencoded({extended: false}));   // 当extended为false的时候，键值对中的值就为'String'或'Array'形式，为true的时候，则可为任何数据类型。
server.use(bodyParser.json({})); // 接受json数据
server.use(cookieParser());
server.use(cookieSession({
    keys: ['aaa','bbb','ccc'],         // keys，用来加密，可指定无数个，会自动循环使用，降低可破解性
    name: 'sess',   // 可选 指定客户端中session_id的key名
    maxAge: 2*3600*1000  // 可选  session过期时间(2小时)
}));
server.set('view engine', 'html');
server.set('views', path.join(__dirname, "./template"));  // 注意读写文件时一定要path拼接路径，直接使用相对路径不可靠。具体看笔记中1.服务器基础
server.engine('html', consolidate.ejs);

server.use('/admin',require('./route/admin/index'));


server.use(expressStatic(path.join(__dirname, "./static")));