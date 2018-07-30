

var arr = ['aaa','bbb','ccc'];

const roundIDs = arr.map(item=>{
    return `'item.roundID'`
}).join(',')
console.log(roundIDs)