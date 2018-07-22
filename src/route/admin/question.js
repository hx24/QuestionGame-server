// 题目相关api
const express=require('express');
const mysql=require('mysql');
const router = express.Router();

const db = mysql.createPool({ 
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'answer'
    // 还有端口port(默认3308可以不写)等参数
});


// 添加题目
router.post('/addQuestion',(req,res,next)=>{
    try {
        const {roundId}=req.body;
        db.query(`SELECT ID FROM tb_round WHERE ID='${roundId}'`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败，请检查参数'}})
            }else{
                if(data.length>0){
                    next();
                }else{
                    res.status(501).json({
                        result: {message: '未找到对应的场次id'}
                    })
                }
            }
        })
    } catch (error) {
        res.status(500).json({
            error: {
                message: '服务器发生错误'
            }
        })
    }
})
router.post('/addQuestion',(req,res)=>{
    try {
        const {roundId, question, answer0, answer1, answer2, answer3, correct}=req.body;
        db.query(`INSERT INTO tb_question (roundId, question, answer0, answer1, answer2, answer3, correct) VALUES ('${roundId}', '${question}', '${answer0}', '${answer1}', '${answer2}', '${answer3}', ${correct})`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败，请检查参数'}})
            }else{
                res.json({
                    result: {message: '添加成功'}
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


// 删除题目
router.post('/deleteQuestion',(req,res)=>{
    try {
        const {id}=req.body;
        db.query(`DELETE FROM tb_question WHERE ID=${id}`,(err,data)=>{
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


// 修改题目
router.post('/updateQuestion',(req,res)=>{
    try {
        const {id, roundId, question, answer0, answer1, answer2, answer3, correct}=req.body;
        console.log(`UPDATE tb_question SET roundId='${roundId}',question='${question}',answer0='${answer0}',answer1='${answer1}',answer2='${answer2}',answer3='${answer3}',correct=${correct} WHERE ID=${id}`)
        db.query(`UPDATE tb_question SET roundId='${roundId}',question='${question}',answer0='${answer0}',answer1='${answer1}',answer2='${answer2}',answer3='${answer3}',correct=${correct} WHERE ID=${id}`,(err,data)=>{
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




module.exports=router;