var fs = require('fs'); 
const axios = require('axios').default;
const bearerToken = 'YOUR_TOKEN';

const get = async function(route){
        return axios.get(route, { headers: {'Authorization': `Bearer ${bearerToken}`}});
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
        const {id, text, html, sent, unread, readby, urls, mentions, issues, meta, v, fromUser} = message;
        const {username, displayName, url, avatarUrl, avatarUrlSmall, avatarUrlMedium} = fromUser;

        if(text.startsWith('0x')){
            let address = text.substring(0, 42);
            address = address.toLowerCase();
            let userAndSource = username.split('_');
            if(!userAndSource[1]) userAndSource[1] = 'github';
            parsedText += `${sent},${id},${address},${userAndSource[0]},${displayName},${avatarUrlMedium},${userAndSource[1]}\n`;
        }
        return parsedText;
    }

const scrape = async function(){
    let hasMore = true;
    let lastId = null; //'603e2548e8267a46f2e8824a';
    const route = 'https://api.gitter.im/v1/rooms/58ba6dc5d73408ce4f4e4d68/chatMessages?limit=50'
    fs.appendFile('data.txt', 'sent,id,address,username,display_name,avataUrl,source\n', function (err) { 
        if (err) throw err;
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
