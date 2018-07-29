// 场次相关api
const express=require('express');
const router = express.Router();
const moment = require('moment');
const sendErr = require('../../lib/util').sendErr;
const db = require('../../lib/util').db;


// getResult 获取答案与统计结果
router.post('/getResult',(req,res,next)=>{
    const {roundId, questionIndex} = req.body;
    try {
        db.query(`SELECT * FROM tb_round WHERE ID='${roundId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else{
                var startTime = data[0].time;  
                var timeDis = new Date().getTime()-startTime;
                if(timeDis< ( questionIndex*28+12 ) * 1000 ) {
                    console.log( (questionIndex*28+12 ) * 1000-timeDis)
                    res.status(300).json({
                        error: {
                            message: '尚未出结果，请等待'         // 未到答题时间，不放题
                        }
                    }).end();
                }else{
                    next();
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
router.post('/getResult',(req,res,next)=>{
    const {questionId} = req.body;
    try {
        db.query(`SELECT * FROM tb_question WHERE ID='${questionId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else if(data.length===0){
                sendErr(res, 501, '未找到该题目，请检查参数');
            }else{
                req.body.correct = data[0].correct;
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
router.post('/getResult',(req,res,next)=>{
    const {roundId, questionId} = req.body;
    try {
        db.query(`SELECT selected FROM tb_res WHERE questionID='${questionId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else{
                var result = {
                    correct: req.body.correct,
                }
                var answerCount= [0,0,0,0];
                data = data.filter(item=>(typeof item.selected)=='number');
                data.forEach(item => {
                    var selected = item.selected;
                    answerCount[selected]++;
                });
                result.answerCount=answerCount;

                res.json({
                    result
                }).end();
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