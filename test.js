var arr = [1,2,3,4];

var pros = arr.map(item=>{
    return new Promise((resolve, reject)=>{
        setTimeout(() => {
            resolve();
            console.log(item)
        }, item*1000);
    })
})

Promise.all(pros).then(()=>{
    console.log('all done')
})