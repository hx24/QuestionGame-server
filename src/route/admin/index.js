const express=require('express');
const mysql=require('mysql');
const router = express.Router();
const config = require('../../config.json');


const db = mysql.createPool({ 
    host: config.mysql_host,
    user: 'root',
    password: '123456',
    database: 'answer'
    // 还有端口port(默认3308可以不写)等参数
});

router.use('/login', (req,res)=>{      // 跨域的时候会先执行OPTIONS请求，若不设为use，第一个OPTIONS请求会被下面的use捕获
    const {username, password}=req.body;
    if(username&&password){
        db.query(`SELECT * FROM tb_admin WHERE username='${username}' AND password='${password}'`,(err,data)=>{
            if(err){
                res.status(400).send({
                    error: {
                        message: '数据库查询失败'
                    }
                })
            }else{
                if(data.length>0){
                    req.session['admin_id']=data[0].ID;   // 这句即写session
                    res.send({
                        result:{
                            message: '登陆成功'
                        }
                    })
                }else{
                    res.send({
                        error:{
                            message: '账号或密码错误'
                        }
                    })
                }
            }
        })
    }else{
        res.send({
            error: {
                message: '请输入用户名和密码'
            }
        }).end;
    }
})

router.use((req,res,next)=>{
    console.log(req.session)
    if(!req.session['admin_id']){   // 没有登陆
        // res.redirect('/login')
        res.status(403).json({
            error: {
                message: '未登录'
            }
        });
    }else{
        next();   // 拦截所有的admin路由请求
    }
})

router.use('/',require('./round'));
router.use('/',require('./question'));

module.exports=router;