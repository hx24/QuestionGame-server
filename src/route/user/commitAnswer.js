// 场次相关api
const express=require('express');
const router = express.Router();
const sendErr = require('../../lib/util').sendErr;
const db = require('../../lib/util').db;

// 提交答案
router.post('/commitAnswer',(req,res,next)=>{   // 先查询用户信息，获取复活卡信息
    const {userid, questionIndex, roundId, questionId, answer} = req.body;
    try {
        db.query(`SELECT time FROM tb_round WHERE ID='${roundId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, `SELECT time FROM tb_round WHERE ID='${roundId}',数据库查询失败，请检查参数`);
            }else if(data.length===0){
                sendErr(res, 501, '未找到该场次，请检查参数');
            }else{
                var startTime = data[0].time;  
                var timeDis = new Date().getTime()-startTime;
                if(timeDis > (questionIndex*28 + 12)*1000 ){    // 给2s的提交答案时间
                    res.json({
                        result: {
                            success: 'NO',
                            message: '由于网络或系统时间不准，已超出问题提交时间。'
                        }
                    })
                }else{
                    next(); 
                }
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
router.post('/commitAnswer',(req,res,next)=>{   // 先查询用户信息，获取复活卡信息
    const {userid, questionIndex, roundId, questionId, answer} = req.body;
    try {
        db.query(`SELECT revive FROM tb_user WHERE ID='${userid}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else if(data.length===0){
                sendErr(res, 501, '未找到该用户，请检查参数');
            }else{
                req.body.revive = data[0].revive;
                next();
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
router.post('/commitAnswer',(req,res,next)=>{
    const {userid, roundId, revive, questionId, answer} = req.body;
    try {
        db.query(`SELECT * FROM tb_question WHERE ID='${questionId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else if(data.length===0){
                sendErr(res, 501, '未找到该题目，请检查参数');
            }else{
                if(data[0].correct==answer){
                    req.body.correct=1;
                    next();
                }else if(revive>0){     // 使用复活卡
                    db.query(`UPDATE tb_user SET revive=${revive-1} WHERE ID='${userid}'`,(err,data)=>{
                        if(err){
                            sendErr(res, 501, '数据库查询失败，请检查参数');
                        }else{
                            req.body.correct=1;
                            next();
                        }
                    })
                }else{
                    req.body.correct=0;
                    next();
                }
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
router.post('/commitAnswer',(req,res)=>{        // 往tb_res中插入答题记录
    const {userid, roundId, questionId, questionIndex, answer, correct} = req.body;
    try {
        db.query(`INSERT INTO tb_res (ID, userID, roundID, questionID, questionIndex, selected, correct) VALUES(0, '${userid}', '${roundId}', '${questionId}', '${questionIndex}', ${answer}, ${correct} ) `,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else{
                res.json({
                    result: {success: 'OK'} // 只要提交答案成功(插入表里)，就返回OK，并不判断是否回答正确
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

module.exports=router;