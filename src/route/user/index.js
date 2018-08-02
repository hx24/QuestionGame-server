const express=require('express');
const router = express.Router();
const uuid = require('uuid/v1');
const {db, query, sendErr} = require('../../lib/util');

router.use('/login', async (req, res, next)=>{      // 跨域的时候会先执行OPTIONS请求，若不设为use，第一个OPTIONS请求会被下面的use捕获 
    const {phone, name, code}=req.body;
    try {
        // 微信登录
        if(code){
            const wechatData = await getWechatOpenid(code);
            if(wechatData.openid){  // 获取微信用户唯一标识(wechatID)成功
                const wechatID = wechatData.openid;
                const wechatUserData = await query(`SELECT * FROM tb_user WHERE wechatID='${wechatID}'`, res);
                if(wechatUserData.length>0){
                    // 该微信用户已注册，可以直接登录
                    req.session['user_id']=wechatUserData[0].ID;
                    res.json({
                        result: {
                            message: '登陆成功',
                        }
                    }).end();
                }else if(!phone){
                    // 该微信用户未注册，并且未提交手机号
                    res.json({
                        error: {
                            message: '请输入手机号'
                        }
                    }).end;
                }else{
                    // 微信绑定手机号
                    // 检测该手机号是否已经注册过
                    const signedUserData = await query(`SELECT * FROM tb_user WHERE phone='${phone}'`, res);
                    var userid = '';
                    if(signedUserData.length>0){
                        // 该手机号已注册过,直接进行绑定
                        userid = signedUserData[0].ID;
                        await query(`UPDATE tb_user SET wechatID='${wechatID}',wechatName='${name}' WHERE ID='${userid}'`);
                    }else{
                        // 该手机号未注册过，新建用户
                        userid = uuid();
                        await query(`INSERT INTO tb_user (ID, phone, wechatName, revive) VALUES('${userid}', '${phone}', '${name}', 0)`,res);
                    }
                    req.session['user_id']=userid;
                    res.json({
                        result: {
                            message: '登录成功'
                        }
                    })
                }
            }else{
                res.json({
                    error: {
                        message: '获取用户id失败'
                    }
                })
            }
        }else{
            // app登录
            next();
        }

    } catch (error) {
        console.log(error)
        sendErr(res,501, '服务器发生错误')
    }
});
router.use('/login', async (req, res)=>{      
    const {phone, name}=req.body;
    try {
        // app登录
        if(phone&&name){
            const signedUserData = await query(`SELECT * FROM tb_user WHERE phone='${phone}'`, res);
            var resJson = {
                error: null,
                result: {}
            };
            if(signedUserData.length>0){
                // 该手机号已注册
                if(!signedUserData[0].name){    // name为空，证明使用微信登录过，进行绑定
                    const id = signedUserData[0].ID;
                    await query(`UPDATE tb_user SET name='${name}' WHERE ID='${id}'`);
                    req.session['user_id']=id;
                    resJson.result = {
                        message: '登陆成功',
                    }
                }else if(signedUserData[0].name==name){
                    req.session['user_id']=signedUserData[0].ID;
                    resJson.result = {
                        message: '登陆成功',
                    }
                }else{
                    resJson.error = {
                        message: '该手机号已与其他姓名绑定，请联系管理员解决'
                    }
                }

                res.json(resJson);
            }else{
                const id = uuid();   // 手机号未登录过，创建id
                await query(`INSERT INTO tb_user (ID, phone, name, revive) VALUES('${id}', '${phone}', '${name}', 0)`,res);
                req.session['user_id']=id;
                res.json({
                    result: {
                        message: '登录成功'
                    }
                })
            }
        }else{
            res.json({
                error: {
                    message: '请输入手机号和姓名'
                }
            }).end;
        }
    } catch (error) {
        sendErr(res,501, '服务器发生错误')
    }
});


router.use((req,res,next)=>{
    try {
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
    } catch (error) {
        sendErr(res,501, '服务器发生错误')
    }
})

router.use('/',require('./getRound'));
router.use('/',require('./getQuestion'));
router.use('/',require('./commitAnswer'));
router.use('/',require('./getResult'));
router.use('/',require('./getRank'));


module.exports=router;


function getWechatOpenid(code) {
    var https  = require('https');
    var qs = require('querystring'); 
    var data = { 
        appid: 'wx33d58fb721b10090',
        secret: 'e3ee3678d516bf671a6ce243dd8ac17e',
        js_code: code,
        grant_type: 'authorization_code'
    }
    var content = qs.stringify(data); 
    var options = { 
        hostname: 'api.weixin.qq.com', 
        path: '/sns/jscode2session?' + content, 
        method: 'GET' 
    };
    return new Promise((resolve,reject)=>{
        var req = https.request(options, function (res) { 
            res.setEncoding('utf8'); 
            res.on('data', function (chunk) { 
                resolve(JSON.parse(chunk))
                console.log(JSON.parse(chunk));
            }); 
        }); 
        req.on('error', function (e) { 
            reject(e)
            console.log(e); 
        }); 
        req.end();
    })
}