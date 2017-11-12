// Creating App instance
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const line = require('@line/bot-sdk');
const middleware = require('@line/bot-sdk').middleware;
const app = express();
var crawler = require('./newsCrawler');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));

const config = {
    channelAccessToken: '5T0Ter+WeMhWyPhCkh9DULTAkq1MyKNLaSZscQBQ2tRJSUfj9+JHlI+M2BmyNvWBSGHB6qTAbeMMkuPzf2T2x7bE+ROvxr6prGZu5awO6dB5a1V/BM7J20GG9pLX92kwGuiRDTWM2wwTTHYkzGtZvgdB04t89/1O/w1cDnyilFU=',
    channelSecret: '3d4009bee32c80a68b725e3cbb45d13c',
}
const client = new line.Client(config);
line.middleware(config);

// Main handler
app.get('/', function(request, response) {
    response.send('Bang Teti GET Handler');
});

app.post('/', function(request, response) {
    console.log('Get new POST request from ' + request.originalUrl + ' with type ' + request.get('content-type'));
    console.log('\t' + JSON.stringify(request.body));
    
    var events = request.body.events;
    events.forEach(function(event) {
        var replyToken = event.replyToken;
        var type = event.type;
        
        switch (type) {
            case 'message' :
                var message = event.message;
                if (message.type == "text") {
                    console.log(message.text + " from " + message.id);
                    handleCommand(message.text, replyToken)
                } else {
                    handleError(replyToken);
                }
                break;
            case 'follow' :
                handleFollow(replyToken);
                break;
            default :
                handleError(replyToken);
        }

    });
    
    response.status(200).send("OK");
});

// Helper function
function handleFollow(replyToken) {
    console.log("\tGive introduction with token " + replyToken);
    var message = {
        type: 'text',
        text: 'Hai perkenalkan, saya Bang Teti. Saya akan melaporkan berita yang dapat dipercaya!'
    };
    client.replyMessage(replyToken, message)
        .then(() => console.log("\tSending reply " + replyToken))
        .catch((err) => {
            console.log("\tTerjadi kesalahan " + err)
        });
}

const pattern = new RegExp("^cari");

function handleCommand(command, replyToken) {
    console.log("\tProcessing command " + command + " with token " + replyToken);

    if (pattern.test(command.toLowerCase)) {
        handleSearch(replyToken);
        return;
    }

    switch (command.toLowerCase()) {
        case 'abc' : 

            var reply = { type: 'text', text: "ABC adalah sebuah keyword yang valid" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
		case 'cari' :
			var reply = { type: 'text', text: JSON.stringify(crawler.searchNews("all",keyword)) };
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				   console.log("\tTerjadi kesalahan " + err)
				   });;
			break;
        case 'image' :
            var reply = { type: 'image', originalContentUrl: "https://img.okezone.com/content/2017/10/03/33/1787616/pasrah-jeremy-teti-mengaku-kesulitan-mencari-jodoh-C1LQd3TusT.jpg" , previewImageUrl : "https://ruclip.com/chimg/e4/UCvYygswZM7vKjdMA90d0YIg.jpg"};
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'top10':
        case 'top 10':
        case 'top-10':
            handleTop10(replyToken);
            break;
        case 'bang':
        case '?':
        case 'abang':
        case 'help':
        case 'bantuan':
            handleHelp(replyToken);
            break;
        default :
            var reply = { type: 'text', text: 'Ehhmm, Bang Teti bingung nih, "'+command+'" maksudnya apa ya?' };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
    }

}

function handleHelp(replyToken) {
    var reply = { 
        type: 'text', 
        text: 'Hai gan, kamu perlu bantuan? \nTenang aja, apapun kesulitannya Bang Teti bakal bantu kok. \n\n- Kalo kamu mau nyari berita ketik aja "Cari <sesuatu>", ntar Bang Teti bakal nyariin berita buat kamu. \n- Nah kalo kamu mau nyari berita yang lagi viral kamu bisa ketik "top10" \n\nGampang kan! Kalo masih bingung panggil Abang lagi aja, ntar bakal dibantu kok \uDBC0\uDC84' };
    client.replyMessage(replyToken, reply)
    .then(() => console.log("\tSending reply " + replyToken))
    .catch((err) => {
        console.log("\tTerjadi kesalahan " + err)
    });;
}

function handleTop10(replyToken) {
    var reply = { 
        type: 'text', 
        text: 'Pagi, ini nih berita heboh yang kamu harus tau:' };
    client.replyMessage(replyToken, reply)
    .then(() => console.log("\tSending reply " + replyToken))
    .catch((err) => {
        console.log("\tTerjadi kesalahan " + err)
    });;
}

function handleSearch(replyToken) {
    var reply = { 
        type: 'text', 
        text: 'Hasil pencarian :' };
    client.replyMessage(replyToken, reply)
    .then(() => console.log("\tSending reply " + replyToken))
    .catch((err) => {
        console.log("\tTerjadi kesalahan " + err)
    });;
}

function handleError(replyToken) {
    console.log("\tBang Teti bingung!");

    const reply = { type: 'text', text: "Bang Teto bingung!" };
    client.replyMessage(replyToken, reply)
    .then(() => console.log("\tSending reply " + replyToken))
    .catch((err) => {
        console.log("\tTerjadi kesalahan " + err)
    });;
}

// Start server
app.listen(app.get('port'), function() {
    console.log('Bang Teti is listening on port', app.get('port'));
});


