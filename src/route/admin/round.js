// 场次相关api
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

// 获取场次列表
router.post('/roundList',(req,res,next)=>{
    const {pagesize,pageindex}=req.body;
    try {
        var sql='';
        if(pageindex&&pageindex){
            var start = (pageindex-1)*pagesize;
            sql=`SELECT * FROM tb_round LIMIT ${start},${pagesize}`;
        }else{
            sql=`SELECT * FROM tb_round`;
        }
        db.query(sql,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}});
            }else{
                res.roundList=data;
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
router.post('/roundList',(req,res)=>{
    try {
        db.query(`SELECT COUNT(ID) FROM tb_round`,(err,data)=>{
            if(err){
                res.status(501).json({error: {message: '数据库查询失败'}})
            }else{
                res.json({
                    result: {
                        count: data[0]["COUNT(ID)"],
                        list: res.roundList
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
                res.json({
                    result: {
                        ...res.roundData,
                        question: data
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