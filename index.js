// 一部屋分のコード
const fs = require('fs')
const server = require('ws').Server
const wss = new server({
    port: 5001
}, () => {
    console.log("WebSocketServer Started. ws://localhost:5001")
});
const src = fs.createReadStream('scripts/test.txt', 'utf8');
let LABELS = [] // シナリオのラベル
const uniqid = require("uniqid")
function getLabels(str) {
    return str.match(/(\*.*).*?/g)
}

src.on('data', chunk => {
    LABELS = [...LABELS,...getLabels(chunk)]
    console.log(LABELS)
});
wss.on('connection',ws =>{
    ws.uuid = uniqid()
    let rollId = 0;
    wss.clients.forEach(cl => rollId++)
    ws.rollId = rollId
    ws.send(JSON.stringify({uuid:ws.uuid,rollId:ws.rollId}))
    ws.on('message',text =>{
        const obj = JSON.parse(text) 
        if(obj.type === "label"){
            if(LABELS.includes('*'+obj.label)){
                wss.clients.forEach(client => {
                    client.send(JSON.stringify(obj));
                });
            }　else{
                wss.clients.forEach(client => {
                    client.send(JSON.stringify({"error":"存在しないラベルです。"}));
                });
            }
        }else if(obj.type === "chat"){
            if(obj.from && obj.to){
                wss.clients.forEach(client => {
                    client.send(JSON.stringify(obj));
                });
            }else{
                wss.clients.forEach(client => {
                    client.send({
                        "error": "送信元と送信先を指定してください。"
                    });
                });
            }
        }else{
            wss.clients.forEach(client => {
                client.send(JSON.stringify({"error":"存在しないコマンドです。"}));
            });
        }
    })
    ws.on('close', text => {})
})