var fs = require('fs'); 
const axios = require('axios').default;

const get = async function(route){
        return axios.get(route, { headers: {'Authorization': `Bearer YOUR_TOKEN`}});
}

const exec = async function(promise){
    return promise.then( data => {
        return [null,data];
    })
    .catch( error => {
        console.log(error);
        return [error];
    });
}

const parseMessage = function(message){
    let parsedText = '';
    const {id, sent, text, fromUser} = message;
    if(text.startsWith('0x')){
        const {url} = fromUser
        if(!url) return `${id},${sent},${text},\n`
        let userAndSource = url.split('_')
        if(!userAndSource[1]) userAndSource[1] = 'github'
        userAndSource[0] = userAndSource[0].substring(1)
        parsedText += `${id},${sent},${text},${userAndSource[0]},${userAndSource[1]}\n`
        console.log(`id: ${id} sent: ${sent} address: ${text} username: ${userAndSource[0]} source: ${userAndSource[1]}`)
    }
    return parsedText
}

const scrape = async function(){
    let hasMore = true;
    let lastId = null; //'603e2548e8267a46f2e8824a';
    const route = 'https://api.gitter.im/v1/rooms/58ba6dc5d73408ce4f4e4d68/chatMessages?limit=50'
    fs.appendFile('data.txt', 'id,sent,address,username,source\n', function (err) {
        if (err) throw err;
        console.log('Updated!');
    }); 
    while(hasMore){
        if(lastId !== null){
            console.log(`Trying url ${route}&beforeId=${lastId}`);
            const [err, gitterMessages] = await exec(get(`${route}&beforeId=${lastId}`));
            if(err) {
                console.log(`Failed to get gitter messages. ${err}`);
                return;
            }
            if(gitterMessages.status === 200){
                let data = gitterMessages.data
                let text = '';
                console.log(`data.length: ${data.length}`)
                if(data.length < 50){
                    hasMore = false;
                }
                lastId = data[0].id
                for(message of data){
                    text += parseMessage(message)
                }
                fs.appendFile('data.txt', text, function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
            }
        }
        else {
            console.log(`Trying url ${route}`);
            const [err, gitterMessages] = await exec(get(route));
            if(err ) {
                console.log(`Failed to get gitter messages. ${err}`);
                return;
            }
            if(gitterMessages.status === 200){
                let data = gitterMessages.data
                let text = '';
                lastId = data[0].id
                for(message of data){
                    text += parseMessage(message)
                }
                fs.appendFile('data.txt', text, function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                }); 
            }
        }
    } 
}

scrape();