const express=require('express');
const router = express.Router();
const uuid = require('uuid/v1');
const db = require('../../lib/util').db;

router.use('/login', (req,res,next)=>{      // 跨域的时候会先执行OPTIONS请求，若不设为use，第一个OPTIONS请求会被下面的use捕获
    const {phone, name}=req.body;
    if(phone&&name){
        db.query(`SELECT * FROM tb_user WHERE phone='${phone}'`,(err,data)=>{
            if(err){
                res.status(400).json({
                    error: {
                        message: '数据库查询失败'
                    }
                })
            }else{
                var resJson = {
                    error: null,
                    result: {}
                };
                if(data.length>0){
                    if(data[0].name!=name){
                        resJson.error = {
                            message: '该手机号已与其他姓名绑定，请联系管理员解决'
                        }
                    }else{
                        req.session['user_id']=data[0].ID;
                        resJson.result = {
                            message: '登陆成功',
                            data: data[0]
                        }
                    }
                    res.json(resJson);
                }else{
                    next();
                }
            }
        })
    }else{
        res.json({
            error: {
                message: '请输入手机号和姓名'
            }
        }).end;
    }
});
router.use('/login', (req,res,next)=>{  
    const {phone, name}=req.body;
    const id = uuid();   // 手机号未登录过，创建id
    db.query(`INSERT INTO tb_user (ID, phone, name, revive) VALUES('${id}', '${phone}', '${name}', 0)`,(err,data)=>{
        if(err){
            res.status(500).json({
                error: {
                    message: '该用户未登录过，添加失败，请检查数据库设置'
                }
            })
        }else{
            res.json({
                result: {
                    message: '登录成功'
                }
            })
        }
    })
})


router.use((req,res,next)=>{
    if(!req.session['user_id']){   // 没有登陆
        // res.redirect('/login')
        res.status(403).json({
            error: {
                message: '未登录'
            }
        });
    }else{
        req.body.userid=req.session['user_id']; // 将userid挂载到body上
        next();   // 拦截所有的admin路由请求
    }
})

router.use('/',require('./common'));

module.exports=router;