// Creating App instance
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const line = require('@line/bot-sdk');
const app = express();
//var crawler = require('./newsCrawler');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));

const client = new line.Client({
    channelAccessToken: '5T0Ter+WeMhWyPhCkh9DULTAkq1MyKNLaSZscQBQ2tRJSUfj9+JHlI+M2BmyNvWBSGHB6qTAbeMMkuPzf2T2x7bE+ROvxr6prGZu5awO6dB5a1V/BM7J20GG9pLX92kwGuiRDTWM2wwTTHYkzGtZvgdB04t89/1O/w1cDnyilFU=',
	channelSecret: '3d4009bee32c80a68b725e3cbb45d13c',
});

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

function handleCommand(command, replyToken) {
    console.log("\tProcessing command " + command + " with token " + replyToken);
    client.replyMessage(replyToken, command)
    .then(() => console.log("\tSending reply " + replyToken))
    .catch((err) => {
        console.log("\tTerjadi kesalahan " + err)
    });;
}

function handleError(replyToken) {
    console.log("\tBang Teti bingung!");
    client.replyMessage(replyToken, "Bang Teti Bingung!")
    .then(() => console.log("\tSending reply " + replyToken))
    .catch((err) => {
        console.log("\tTerjadi kesalahan " + err)
    });;
}

// Start server
app.listen(app.get('port'), function() {
    console.log('Bang Teti is listening on port', app.get('port'));
});


