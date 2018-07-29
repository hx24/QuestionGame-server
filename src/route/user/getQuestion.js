// 场次相关api
const express=require('express');
const router = express.Router();
const sendErr = require('../../lib/util').sendErr;
const db = require('../../lib/util').db;

// 获取题目
// 设定一道题10s作答时间，2s提交答案时间，查看统计结果10s，等待时间为5s，所以共28s
router.post('/getQuestion',(req,res,next)=>{             // 检查上一题是否答对
    const {userid, roundId, index}=req.body;
    try {
        if(index===0){
            next();
        }else{
            db.query(`SELECT * FROM tb_res WHERE roundID='${roundId}' AND questionIndex=${index-1} AND correct=1`,(err,data)=>{
                if(err){
                    sendErr(res, 501, '数据库查询失败，请检查参数');
                }else{
                    if(data.length==0){
                        res.json({
                            result: {
                                end: true,
                                message: '已没有更多题目'
                            }
                        }).end();
                    }else{
                        next();
                    }
                }
            })
        }
    } catch (error) {
        console.log(error)
        sendErr(res, 500, '服务器发生错误');
    }
})
router.post('/getQuestion',(req,res,next)=>{             // 检查上一题是否答对
    const {userid, roundId, index}=req.body;
    try {
        if(index===0){
            next();
        }else{
            db.query(`SELECT * FROM tb_res WHERE userID='${userid}' AND roundID='${roundId}' AND questionIndex=${index-1}`,(err,data)=>{
                if(err){
                    sendErr(res, 501, '数据库查询失败，请检查参数');
                }else{
                    if (data.length===0||!data[0].correct){
                        req.body.cant=true;
                    }
                    next();
                }
            })
        }
    } catch (error) {
        console.log(error)
        sendErr(res, 500, '服务器发生错误');
    }
})
router.post('/getQuestion',(req,res,next)=>{         // 获取场次信息,根绝时间判断是否可答题
    const {userid, roundId, index}=req.body;
    try {
        db.query(`SELECT * FROM tb_round WHERE ID='${roundId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else if (data.length===0){
                sendErr(res, 501, '未找到该场次，请检查roundId参数');
            }else{
                var startTime = data[0].time;  
                var timeDis = new Date().getTime()-startTime;
                if(timeDis<0)console.log(timeDis)
                if(timeDis<index*28*1000){
                    res.status(300).json({
                        error: {
                            message: '该题目尚未到放题时间，请等待'         // 未到答题时间，不放题
                        }
                    })
                }else{
                    if(timeDis>(index*28 + 2)*1000 ){   // 距该题发布已超过5s
                        req.body.cant=true;
                    }
                    next();
                }
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})
router.post('/getQuestion',(req,res,next)=>{         // 该题目已到放题时间，可以放题
    const {userid, roundId, index}=req.body;
    try {
        db.query(`SELECT * FROM tb_question WHERE roundId='${roundId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else if (data.length===0){
                sendErr(res, 500, '该场次没有题目');
            }else{
                var question = data[index];
                if(!question){
                    res.json({
                        result: {
                            end: true,
                            message: '已没有更多题目'
                        }
                    })
                }else{
                    res.json({
                        result: {
                            roundId,
                            questionindex: index+1,
                            questionid: question.ID,
                            question: question.question,
                            startsecond: 10,   // 倒计时时间，暂定10s
                            isanswer: !req.body.cant,   // 是否可以答题
                            answers: [question.answer0, question.answer1, question.answer2, question.answer3]
                        }
                    })
                }
            }
        })
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