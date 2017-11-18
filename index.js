// ============================================== Init Library ==============================================
var xml2js = require('xml2js'),parser = new xml2js.Parser({explicitArray : false}),http = require('http'),jsdom = require('jsdom'),kmp = require('kmp');
const { JSDOM } = jsdom;
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const line = require('@line/bot-sdk');
const middleware = require('@line/bot-sdk').middleware;
const app = express();
var crawler = require('./newsCrawler');
const baseURL = 'https://quiet-sands-32630.herokuapp.com';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));
app.set('port', (process.env.PORT || 5000));

function newsItem(title,link,img) {
	this.thumbnailImageUrl = img;
	this.text = title;
	this.actions = new Array();
	this.actions.push({"type" : "uri","label" : "Selengkapnya","uri" : link});
	this.actions.push({"type" : "postback","label" : "Beri feedback","action" : "action=feedback&newsid=111"});
}

const config = {
    channelAccessToken: '5T0Ter+WeMhWyPhCkh9DULTAkq1MyKNLaSZscQBQ2tRJSUfj9+JHlI+M2BmyNvWBSGHB6qTAbeMMkuPzf2T2x7bE+ROvxr6prGZu5awO6dB5a1V/BM7J20GG9pLX92kwGuiRDTWM2wwTTHYkzGtZvgdB04t89/1O/w1cDnyilFU=',
    channelSecret: '3d4009bee32c80a68b725e3cbb45d13c',

}
const client = new line.Client(config);
line.middleware(config);


// ============================================= Request Routing =============================================

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

app.get('/breakingnews', function(request, response) {
    pushBreakingNews();
});


app.get('/static/emoji/:resolution', function (req, res) {
    var resolution = req.params.resolution;
    switch (resolution) {
        case '200':
            res.sendFile(__dirname + '/static/emoji/200.png');
            break;
        case '300':
            res.sendFile(__dirname + '/static/emoji/300.png');
            break;
        case '460':
            res.sendFile(__dirname + '/static/emoji/460.png');
            break;
        case '700':
            res.sendFile(__dirname + '/static/emoji/700.png');
            break;
        case '1040': 
            res.sendFile(__dirname + '/static/emoji/1040.png');
            break;
        default:
            res.sendFile(__dirname + '/static/emoji.jpg');
    }
});


// ============================================= Handler Function =============================================

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

    command = command.trim();

    const pattern = new RegExp("^cari");
    if (pattern.test(command.toLowerCase())) {
        handleSearch(command, replyToken);
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
			handleSearch(command, replyToken);
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
        case 'feedback':
            handleFeedback(replyToken);
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
    const targetId = 'Ue67f41a618a419cdf156d066c4f0b6d4';

    const messageIntro = {
        "type": "text",
        "text": "Ini dia berita Top 10"
    };

    const message = {
        "type": "template",
        "altText": 'Bang Teti ngirim berita top 10 nih',
        "template": {
            "type": "carousel",
            "columns": [
                {
                  "thumbnailImageUrl": "https://akcdn.detik.net.id/community/media/visual/2017/11/16/9304f5ed-f4fb-4c75-b657-ef146cc77c1c.jpeg?w=780&q=90",
                  "title": "Jokowi Minta Novanto Ikuti Proses Hukum, KSP: Itu Peringatan Keras".substring(0,40),
                  "text": "Jakarta - Presiden Joko Widodo meminta Setya Novanto mengikuti proses hukum di Komisi Pemberantasan Korupsi (KPK). Permintaan ini dinilai sebagai peringatan keras untuk Novanto agar tak lari dari kasus dugaan korupsi proyek e-KTP.".substring(0,60),
                  "actions": [
                      {
                          "type": "uri",
                          "label": "Selengkapnya",
                          "uri": "https://news.detik.com/berita/3732342/jokowi-minta-novanto-ikuti-proses-hukum-ksp-itu-peringatan-keras"
                      },
                      {
                          "type": "message",
                          "label": "Beri Feedback",
                          "text": "feedback"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                },
                {
                  "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                  "title": "this is menu",
                  "text": "description",
                  "actions": [
                      {
                          "type": "postback",
                          "label": "Selengkapnya",
                          "data": "action=buy&itemid=222"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=add&itemid=222"
                      }
                  ]
                }
            ]
        }
    };

    client.replyMessage(replyToken, [messageIntro, message])
        .then(() => {
            console.log('Top10 sent with token ' + replyToken);
        })
        .catch((err) => {
            console.log('Top10 error: ' + err);
        });

    client.pushMessage(targetId, [messageIntro, message])
        .then(() => {
            console.log('Top10 sent to ' + targetId);
        })
        .catch((err) => {
            console.log('Top10 error: ' + err);
        });
}


function handleSearch(command, replyToken) {
    var keyword = command.substring(4).trim();
	crawler.searchNews("all",keyword,function(news) {
		//var reply = {type: 'text',text: 'Hasil pencarian : "' + keyword + '" Judul: '+news[0].title+' Link: '+news[0].link+' Img: '+news[0].img};
		var msg = '{"type": "template","altText": "Hasil pencarian","template": {"type": "carousel","columns": []}}';
		var newsCarousel = JSON.parse(msg);
		newsCarousel['template']['columns'].push(new newsItem(news[0].title,news[0].link,news[0].img));
		/*for (var i=1;i<news.length;i++) {
			//newsItems.push(new newsItem(news[i].title,news[i].link,news[i].img));
		}*/
		//var reply = JSON.stringify(newsCarousel,null,2);
		console.log(JSON.stringify(newsCarousel));
		client.replyMessage(replyToken, newsCarousel)
		.then(() => console.log("\tSending reply " + replyToken))
		.catch((err) => {console.log("\tTerjadi kesalahan " + err)})
    });
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

function handleFeedback(replyToken) {
    console.log("\tBang Teti asks for feedback.");
    const targetId = 'Uacbfb10288b2b165c88b8eec87767973';
    const reply = {
      "type": "imagemap",
      "baseUrl": baseURL+"/static/emoji",
      "altText": "this is an imagemap",
      "baseSize": {
          "height": 1040,
          "width": 1040
      },
      "actions": [
          {
              "type": "message",
              "text": "thanks",
              "area": {
                  "x": 0,
                  "y": 208,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "hello",
              "area": {
                  "x": 260,
                  "y": 208,
                  "width": 200,
                  "height": 200
              }
          }
      ]
    };

    client.replyMessage(replyToken, reply)
        .then(() => {
            console.log('Feedback sent with token ' + replyToken);
        })
        .catch((err) => {
            console.log('Feedback error: ' + err);
        });

    client.pushMessage(targetId, reply)
        .then(() => {
            console.log('Feedback sent to ' + targetId);
        })
        .catch((err) => {
            console.log('Feedback error: ' + err);
        });
}





// ============================================= Start Server =============================================
app.listen(app.get('port'), function() {
    console.log('Bang Teti is listening on port', app.get('port'));
});


function pushBreakingNews() {
    const targetId = ['U064ad36afebade93b31fee05090207b0', 'Uacbfb10288b2b165c88b8eec87767973', 'Ue67f41a618a419cdf156d066c4f0b6d4'];
    const judul = 'Setya Novanto Menabrak Tiang Listrik';

    const messageIntro = {
        "type": "text",
        "text": "Breaking News!\n \""+judul+"\". Baca info selengkapnya dari Bang Teti!",
    };

    const messageCarousell = {
        "type": "template",
        "altText": "Ini Bang Teti kabarin berita tentang \""+judul+"\"!",
        "template": {
            "type": "carousel",
            "columns": [
                {
                  "thumbnailImageUrl": "https://akcdn.detik.net.id/community/media/visual/2017/11/17/8eb03aef-1891-4be9-81f5-4a8584cebd6d_169.jpg?w=780&q=90",
                  "text": "Jakarta - Ketua DPR Setya Novanto hingga saat ini masih berada di dalam Rumah Sakit Cipto Mangunkusumo (RSCM) Kencana. Pengacaranya, Fredrich Yunadi, sebelumnya menyebut kondisi kesehatan kliennya masih mengkhawatirkan.",
                  "actions": [
                      {
                          "type": "uri",
                          "label": "Selengkapnya",
                          "uri": "https://news.detik.com/berita/d-3731740/pengacara-kaki-novanto-keram-mata-nggak-bisa-dibuka-dada-sesak"
                      },
                      {
                          "type": "postback",
                          "label": "Beri Feedback",
                          "data": "action=feedback&newsid=111"
                      }
                  ]
                },
                {
                    "thumbnailImageUrl": "https://akcdn.detik.net.id/community/media/visual/2017/11/18/53226336-9412-41e3-8472-b435cdcd0347_169.jpg?w=780&q=90",
                    "title": "Karangan Bunga Bernada Satire Dikirim untuk Setya Novanto".substring(0,40),   
                    "text": "Jakarta - Ada kiriman bunga yang dikirimkan untuk Ketua DPR Setya Novanto yang sedang dirawat di RSCM Kencana, Jakarta Pusat. Salah satunya bernada satire.".substring(0,60),
                    "actions": [
                        {
                            "type": "uri",
                            "label": "Selengkapnya",
                            "uri": "https://news.detik.com/berita/d-3732326/karangan-bunga-bernada-satire-dikirim-untuk-setya-novanto"
                        },
                        {
                            "type": "postback",
                            "label": "Beri Feedback",
                            "data": "action=feedback&newsid=111"
                        }
                    ]
                },
                {
                    "thumbnailImageUrl": "https://akcdn.detik.net.id/community/media/visual/2017/11/17/8eb03aef-1891-4be9-81f5-4a8584cebd6d_169.jpg?w=780&q=90",
                    "title": "Pengacara: Kaki Novanto Keram, Mata Nggak Bisa Dibuka, Dada Sesak".substring(0,40),   
                    "text": "Jakarta - Ketua DPR Setya Novanto hingga saat ini masih berada di dalam Rumah Sakit Cipto Mangunkusumo (RSCM) Kencana. Pengacaranya, Fredrich Yunadi, sebelumnya menyebut kondisi kesehatan kliennya masih mengkhawatirkan.".substring(0,60),
                    "actions": [
                        {
                            "type": "uri",
                            "label": "Selengkapnya",
                            "uri": "https://news.detik.com/berita/d-3731740/pengacara-kaki-novanto-keram-mata-nggak-bisa-dibuka-dada-sesak"
                        },
                        {
                            "type": "postback",
                            "label": "Beri Feedback",
                            "data": "action=feedback&newsid=111"
                        }
                    ]
                  },
                  {
                    "thumbnailImageUrl": "https://akcdn.detik.net.id/community/media/visual/2017/11/17/8eb03aef-1891-4be9-81f5-4a8584cebd6d_169.jpg?w=780&q=90",
                    "title": "Pengacara: Kaki Novanto Keram, Mata Nggak Bisa Dibuka, Dada Sesak".substring(0,40),   
                    "text": "Jakarta - Ketua DPR Setya Novanto hingga saat ini masih berada di dalam Rumah Sakit Cipto Mangunkusumo (RSCM) Kencana. Pengacaranya, Fredrich Yunadi, sebelumnya menyebut kondisi kesehatan kliennya masih mengkhawatirkan.".substring(0,60),
                    "actions": [
                        {
                            "type": "uri",
                            "label": "Selengkapnya",
                            "uri": "https://news.detik.com/berita/d-3731740/pengacara-kaki-novanto-keram-mata-nggak-bisa-dibuka-dada-sesak"
                        },
                        {
                            "type": "postback",
                            "label": "Beri Feedback",
                            "data": "action=feedback&newsid=111"
                        }
                    ]
                  }                                  
            ]
        }
      };

    client.multicast(targetId, [messageIntro, messageCarousell])
        .then(() => {
            console.log('Breaking News sent');
        })
        .catch((err) => {
            console.log('Breaking News error: ' + err);
        });
}
