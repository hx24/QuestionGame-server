const crypto=require('crypto');
const mysql=require('mysql');
const config = require('../config.json');

const db = mysql.createPool(config.mysql_config);

module.exports={
    salt: 'rasck',      // md5加盐
    md5: function(str){
        var obj=crypto.createHash('md5');   // 以md5加密
        obj.update(str + this.salt);
        return obj.degest('hex');  // 以16进制输出(一般都是16进制)
    },
    sendErr: (res, status, message)=>{
        res.status(status).json({error: {message: message}}).end();
    },
    db,
}

