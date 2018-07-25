// 场次相关api
const express=require('express');
const mysql=require('mysql');
const router = express.Router();
const config = require('../../config.json');
const moment = require('moment')

const db = mysql.createPool({ 
    host: config.mysql_host,
    user: 'root',
    password: '123456',
    database: 'answer'
    // 还有端口port(默认3308可以不写)等参数
});

// 获取场次列表
router.post('/getRound',(req,res,next)=>{
    try {
        var sql='';
        const todayStartTimeStamp = new Date(new Date().toLocaleDateString()).getTime();  // 今天0点时间戳
        const todayEndTimeStamp = todayStartTimeStamp+24*60*60*1000;                        // 第二天0点

        const nowStamp = new Date().getTime();

        db.query(`SELECT * FROM tb_round WHERE time>${nowStamp} AND time<${todayEndTimeStamp} ORDER BY time ASC LIMIT 0,1`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}});
            }else{
                if(data[0]){
                    var d = new Date(data.time)
                    data[0].time = moment(data[0].time).format('HH:mm')
                }
                req.body.roundData=data[0];
                next();
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})
router.post('/getRound',(req,res)=>{
    const {userid}=req.body;
    try {
        // 查询该用户的历史答题记录
        db.query(`SELECT * FROM tb_user WHERE ID='${userid}'`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}})
            }else{
                res.json({
                    result: {
                        round: req.body.roundData,
                        personinfo: {
                            ...data[0],
                            amount: 0, 
                            history: []  // amount 和 history 需要另外查询
                        }
                    }
                })
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})


// 添加场次
router.post('/addRound',(req,res)=>{
    try {
        const {title, reward, time}=req.body;
        db.query(`INSERT INTO tb_round (title, reward, time) VALUES ('${title}', ${reward}, ${time})`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败，请检查参数'}})
            }else{
                res.json({
                    result: {message: '添加成功'}
                })
            }
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})

// 修改场次
router.post('/updateRound',(req,res)=>{
    try {
        const {ID, title, reward, time}=req.body;
        db.query(`UPDATE tb_round SET title='${title}',reward=${reward},time=${time} WHERE ID=${ID}`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败，请检查参数'}})
            }else{
                res.json({
                    result: {message: '修改成功'}
                })
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})


// 删除场次
router.post('/deleteRound',(req,res)=>{
    try {
        const {ID}=req.body;
        db.query(`DELETE FROM tb_round WHERE ID=${ID}`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败，请检查参数'}})
            }else{
                res.json({
                    result: {message: '删除成功'}
                })
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})


// 获取场次详情
router.post('/roundDetail',(req,res,next)=>{
    try {
        const {id}=req.body;
        db.query(`SELECT * FROM tb_round WHERE ID=${id}`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}});
            }else{
                if(data.length>0){
                    res.roundData=data[0];
                    next();
                }else{
                    res.status(501).json({
                        error: {
                            message: '未查询到指定id的场次，请检查参数'
                        }
                    })
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})
router.post('/roundDetail',(req,res)=>{
    try {
        const {id}=req.body;
        db.query(`SELECT * FROM tb_question WHERE roundId=${id}`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}})
            }else{
                data.forEach(question => {
                    question.answers = [question.answer0, question.answer1, question.answer2, question.answer3]
                });
                res.json({
                    result: {
                        ...res.roundData,
                        questions: data
                    }
                })
            }
        });
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})


module.exports=router;