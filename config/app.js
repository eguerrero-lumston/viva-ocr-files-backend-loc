//require("../router/routes")

//module.exports = require("ic-server")
/**
 * consfigure server 
 */
var fs = require('fs')
console.log("../")
fs.watch("./",{recursive:true},(event,file)=>{
    if(file != ".git" && file != ".git\\index.js" 
    && file != ".git\\index.lock" 
    && file != ".git\\index"){
        console.log(file+" a cambiado")
        //console.log()
        delete require.cache["..\\"+file]
        process.exit()
        if (/[\/\\]icommjs[\/\\]/.test(file)){
            delete require.cache["./"+file]
        }
    }
    Object.keys(require.cache).forEach(function(id){
        //if (/[\/\\]icommjs[\/\\]/.test(id))
        //console.log(id)
        delete require.cache[id]
    })
})