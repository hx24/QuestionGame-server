const express=require('express');
const router = express.Router();
const db = require('../../lib/util').db;

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
router.use('/',require('./user'));


module.exports=router;