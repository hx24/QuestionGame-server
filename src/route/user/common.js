// 场次相关api
const express=require('express');
const mysql=require('mysql');
const router = express.Router();
const config = require('../../config.json');
const moment = require('moment');
const sendErr = require('../../lib/util').sendErr;

const db = mysql.createPool({ 
    host: config.mysql_host,
    user: 'root',
    password: '123456',
    database: 'answer'
    // 还有端口port(默认3308可以不写)等参数
});

// 获取场次 (wait.html)
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


// 获取题目
// 设定一道题10s中作答时间，查看统计结果10s，等待时间为5s，所以共20s
router.post('/getQuestion',(req,res,next)=>{             // 检查上一题是否答对
    const {userid, roundId, index}=req.body;
    try {
        if(index===0){
            next();
        }else{
            db.query(`SELECT * FROM tb_res WHERE userID='${userid}' AND questionIndex=${index-1}`,(err,data)=>{
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
                if(timeDis<index*25*1000){
                    res.status(300).json({
                        error: {
                            message: '该题目尚未到放题时间，请等待'         // 未到答题时间，不放题
                        }
                    })
                }else{
                    if(timeDis>(index+1)*25*1000){   // 距该题发布已超过20s
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
router.post('/getQuestion',(req,res,next)=>{         // 符合条件，可以答题
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





// 提交答案
router.post('/commitAnswer',(req,res,next)=>{
    const {userid, roundId, questionId, answer} = req.body;
    try {
        db.query(`SELECT * FROM tb_question WHERE ID='${questionId}'`,(err,data)=>{
            if(err){
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else if(data.length===0){
                sendErr(res, 501, '未找到该题目，请检查参数');
            }else{
                if(data[0].correct==answer){
                    req.body.correct=1;
                }else{
                    req.body.correct=0;
                }
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
router.post('/commitAnswer',(req,res)=>{        // 往tb_res中插入答题记录
    const {userid, roundId, questionId, questionIndex, answer} = req.body;
    try {
        db.query(`INSERT INTO tb_res (ID, userID, roundID, questionID, questionIndex, selected, correct) VALUES(0, '${userid}', '${roundId}', '${questionId}', '${questionIndex}', ${answer}, ${req.body.correct} ) `,(err,data)=>{
            if(err){
                console.log(`INSERT INTO tb_res (ID, userID, roundID, questionID, questionIndex, selected, correct) VALUES(0, '${userid}', '${roundId}', '${questionId}', '${questionIndex}', ${answer}, ${req.body.correct} ) `)
                sendErr(res, 501, '数据库查询失败，请检查参数');
            }else{
                res.json({
                    result: {success: 'OK'} // 只要提交答案成功(插入表里)，就返回OK，并不判断是否回答正确
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
                if(timeDis<(questionIndex*25*1000 + 15*1000)){
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