// ============================================== Init Library ==============================================
var xml2js = require('xml2js'),parser = new xml2js.Parser({explicitArray : false}),http = require('http'),jsdom = require('jsdom'),kmp = require('kmp');
const { JSDOM }     = jsdom;
const express       = require('express');
const bodyParser    = require('body-parser');
const https         = require('https');
const line          = require('@line/bot-sdk');
const middleware    = require('@line/bot-sdk').middleware;
const CronJob       = require('cron').CronJob;
const fileSystem    = require('fs');
var crawler         = require('./newsCrawler');
const baseURL       = 'https://quiet-sands-32630.herokuapp.com';
const app           = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));
app.use('/data', express.static('data'));
app.set('port', (process.env.PORT || 5000));

function newsItem(title,link,img) {
	this.thumbnailImageUrl = img;
	this.text = title.trim().substring(0,60);
	this.actions = new Array();
	this.actions.push({"type" : "uri","label" : "Selengkapnya","uri" : link});
	this.actions.push({"type" : "message","label" : "Beri feedback","text" : "Mau kasih feedback nih bang."});
}

const config = {
    channelAccessToken: '5T0Ter+WeMhWyPhCkh9DULTAkq1MyKNLaSZscQBQ2tRJSUfj9+JHlI+M2BmyNvWBSGHB6qTAbeMMkuPzf2T2x7bE+ROvxr6prGZu5awO6dB5a1V/BM7J20GG9pLX92kwGuiRDTWM2wwTTHYkzGtZvgdB04t89/1O/w1cDnyilFU=',
    channelSecret: '3d4009bee32c80a68b725e3cbb45d13c',

}
const client = new line.Client(config);
line.middleware(config);

// =============================================== Access Database ============================================
var database;
function saveDatabase() {
    console.log('saving : ' + JSON.stringify(database));
    fileSystem.writeFileSync('data/users.json', JSON.stringify(database));
    console.log('Success saving data.');
}

function addUserToDatabase(userID) {
    console.log("adding " + userID + " to database");
    var users = database.users;
    var found = false;
    users.forEach(function(user) {
        if (user.userId == userID) {
            found = true;
        }
    });
    if (!found) {
        database.users.push({
            "userId": userID,
            "state": "semua"
        })
        saveDatabase();
    }
}

function editFilter(userID, filter) {
  for (var i in database.users) {
    if (database.users[i].userId == userID) {
      database.users[i].state = filter;
      saveDatabase();
      return;
    }
  }
  addUserToDatabase(userID);
  editFilter(userID, filter);
}

function getCurrentFilter(userID) {
    for (var i in database.users) {
        if (database.users[i].userId == userID) {
            return database.users[i].state;
        }
    }
    addUserToDatabase(userID);
    return "semua";
}

// ============================================= Preparing CRON Job ===========================================
var top10job = new CronJob({
    cronTime: '30 6 * * *',
    onTick: function() {
      pushBreakingNews();
    },
    start: false,
    timeZone: 'Asia/Jakarta'
  });



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
        var source = event.source;
        
        switch (type) {
            case 'message' :
                var message = event.message;
                if (message.type == "text") {
                    console.log(message.text + " from " + message.id);
                    handleCommand(message.text, replyToken, source)
                } else {
                    handleError(replyToken);
                }
                break;
            case 'follow' :
                handleFollow(replyToken, source);
                break;
            default :
                handleError(replyToken);
        }

    });
    
    response.status(200).send("OK");
});

app.get('/breakingnews', function(request, response) {
    pushBreakingNews();
    response.send("Pushing breaking news to all saved user");
});


app.get('/static/emoji-new/:resolution', function (req, res) {
    var resolution = req.params.resolution;
    switch (resolution) {
        case '200':
            res.sendFile(__dirname + '/static/emoji-new/200.png');
            break;
        case '300':
            res.sendFile(__dirname + '/static/emoji-new/300.png');
            break;
        case '460':
            res.sendFile(__dirname + '/static/emoji-new/460.png');
            break;
        case '700':
            res.sendFile(__dirname + '/static/emoji-new/700.png');
            break;
        case '1040': 
            res.sendFile(__dirname + '/static/emoji-new/1040.png');
            break;
        default:
            res.sendFile(__dirname + '/static/emoji-new.png');
    }
});


// ============================================= Handler Function =============================================

function handleFollow(replyToken, source) {
    console.log("\tGive introduction with token " + replyToken);
    
    addUserToDatabase(source.userId);
    
    client.getProfile(source.userId)
    .then((profile) => {
      console.log(profile.displayName);
      console.log(profile.userId);
      var message = {
        type: 'text',
        text: 'Hai '+profile.displayName+' perkenalkan, saya Bang Teti. Saya akan melaporkan berita yang dapat dipercaya!'
    };
    
      client.replyMessage(replyToken, message)
          .then(() => console.log("\tSending reply " + replyToken))
          .catch((err) => {
              console.log("\tTerjadi kesalahan " + err)
          });
    })

    .catch((err) => {
      console.log("\tTerjadi kesalahan profile" + err)
    });
    
}

function handleCommand(command, replyToken, source) {
    console.log("\tProcessing command " + command + " with token " + replyToken);

    command = command.trim();

    const pattern = new RegExp("^cari");
    if (pattern.test(command.toLowerCase())) {
        handleSearch(command, replyToken,source);
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
      			handleSearch(command, replyToken,source);
      			break;
        case 'image' :
            var reply = { type: 'image', originalContentUrl: "http://style.tribunnews.com/2017/11/20/setya-novanto-masuk-penjara-kpk-perlawanan-belum-selesai-inilah-jurus-jurus-serangan-balik" , previewImageUrl : "https://ruclip.com/chimg/e4/UCvYygswZM7vKjdMA90d0YIg.jpg"};
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'breakingnews':
            var reply = { type: 'image', originalContentUrl: "http://style.tribunnews.com/2017/11/20/setya-novanto-masuk-penjara-kpk-perlawanan-belum-selesai-inilah-jurus-jurus-serangan-balik" , previewImageUrl : baseURL+"/static/breakingnewsdummy/breakingnews1.png"};
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
            handleHelp(replyToken, source);
            break;
        case 'mau kasih feedback nih bang.':
            handleFeedback(replyToken);
            break;
		case 'semua':
			var reply = { type: 'text', text: 'Lingkup pencarian saat ini berada pada kategori '+command};
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				   console.log("\tTerjadi kesalahan " + err)
			});;
      		editFilter(source.userId, "semua");
			break;
		case 'politik':
			var reply = { type: 'text', text: 'Lingkup pencarian saat ini berada pada kategori '+command};
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				   console.log("\tTerjadi kesalahan " + err)
			});;
      		editFilter(source.userId, "politik");
			break;
		case 'hiburan':
			searchState = "hiburan";
			var reply = { type: 'text', text: 'Lingkup pencarian saat ini berada pada kategori '+searchState};
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				console.log("\tTerjadi kesalahan " + err)
			});;
      		editFilter(source.userId, "hiburan");
			break;
		case 'kesehatan':
			searchState = "kesehatan";
			var reply = { type: 'text', text: 'Lingkup pencarian saat ini berada pada kategori '+searchState};
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				console.log("\tTerjadi kesalahan " + err)
			});;
			editFilter(source.userId, "kesehatan");
			break;
		case 'teknologi':
			searchState = "teknologi";
			var reply = { type: 'text', text: 'Lingkup pencarian saat ini berada pada kategori '+searchState};
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				console.log("\tTerjadi kesalahan " + err)
			});;
      		editFilter(source.userId, "teknologi");
			break;
		case 'olahraga':
			searchState = "olahraga";
			var reply = { type: 'text', text: 'Lingkup pencarian saat ini berada pada kategori '+searchState};
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				console.log("\tTerjadi kesalahan " + err)
			});;
      		editFilter(source.userId, "olahraga");
			break;
		case 'ekonomi':
			searchState = "ekonomi";
			var reply = { type: 'text', text: 'Lingkup pencarian saat ini berada pada kategori '+searchState};
			client.replyMessage(replyToken, reply)
			.then(() => console.log("\tSending reply " + replyToken))
			.catch((err) => {
				console.log("\tTerjadi kesalahan " + err)
			});;
      		editFilter(source.userId, "ekonomi");
			break;
        case 'yay! seneng banget!':
            var reply = { type: 'text', text: "Wah saya ikut senang :)\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'terhibur deh :d':
            var reply = { type: 'text', text: "Berita abang memang menarik :D\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'wow, sangat menginspirasi!':
            var reply = { type: 'text', text: "Keren ya!\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'bangga banget!':
            var reply = { type: 'text', text: "Memang membanggakan,\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'astaga, seriusan?':
            var reply = { type: 'text', text: "Ciyusss,\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'aku sedih :(':
            var reply = { type: 'text', text: "Cup cup, jangan sedih,\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'duh, merinding, serem..':
            var reply = { type: 'text', text: "Jangan takut, ada abang di sini.\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            break;
        case 'ih ngeselin!':
            var reply = { type: 'text', text: "Iya ih, abang jadi kesel juga.\nTerimakasih feedbacknya!" };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
            handleAfterFeedback(source);
            break;
        default :
            var reply = { type: 'text', text: 'Ehhmm, Bang Teti bingung nih, "'+command+'" maksudnya apa ya ? Jika butuh bantuan panggil aja "Bang"' };
            client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            });;
			break;
    }

}

function handleHelp(replyToken, source) {
    addUserToDatabase(source.userId);
    
    client.getProfile(source.userId)
    .then((profile) => {
        var reply = { 
            type: 'text', 
            text: 'Hai '+profile.displayName+', kamu perlu bantuan? Tenang aja, apapun kesulitannya Bang Teti bakal bantu kok. \n\n- Kalo kamu mau nyari berita ketik aja "Cari <sesuatu>", ntar Bang Teti bakal nyariin berita buat kamu. \n- Nah kalo kamu mau nyari berita yang lagi viral kamu bisa ketik "top10" \n\nGampang kan! Kalo masih bingung panggil Abang lagi aja, ntar bakal dibantu kok \uDBC0\uDC84'
        };
        
        client.replyMessage(replyToken, reply)
            .then(() => console.log("\tSending reply " + replyToken))
            .catch((err) => {
                console.log("\tTerjadi kesalahan " + err)
            }
        );
    }).catch((err) => {
        console.log("\tTerjadi kesalahan profile" + err)
    });

}


function handleTop10(replyToken) {
    crawler.getTop10(function(top10) {
		var messageIntro = {
		  "type": "text",
		  "text": "Ini dia berita top10"
		}
		var msg = '{"type": "template","altText": "Bang Teti ngirimin berita top10 nih","template": {"type": "carousel","columns": []}}';
		var newsCarousel = JSON.parse(msg);
		for (var i=0;i<10;i++) {
		  newsCarousel['template']['columns'].push(new newsItem(top10[i].title,top10[i].link,top10[i].img));
		}
		console.log(JSON.stringify(newsCarousel,null,2));
		client.replyMessage(replyToken, [messageIntro, newsCarousel])
		.then(() => console.log("\tSending reply " + replyToken))
		.catch((err) => {console.log("\tTerjadi kesalahan " + err)})
    });
}



function handleSearch(command, replyToken,source) {
    var keyword = command.substring(4).trim().toLowerCase();
	console.log(getCurrentFilter(source.userId));
	crawler.searchNews(getCurrentFilter(source.userId),keyword,function(news) {
		var reply;
		if (news.length > 0) {
			var msg = '{"type": "template","altText": "Hasil pencarian","template": {"type": "carousel","columns": []}}';
			var newsCarousel = JSON.parse(msg);
			for (var i=0;i<news.length;i++) {
				newsCarousel['template']['columns'].push(new newsItem(news[i].title,news[i].link,news[i].img));
				if (i === 10) {
					break;
				}
			}
			console.log(JSON.stringify(newsCarousel));
			reply = newsCarousel;
		} else {
			reply = {"type": "text","text": "Tidak ada hasil pencarian yang cocok"};
		}
		client.replyMessage(replyToken, reply)
		.then(() => console.log("\tSending reply " + replyToken))
		.catch((err) => {console.log("\tTerjadi kesalahan " + err)})
    });
}

function handleError(replyToken) {
    console.log("\tBang Teti bingung!");

    var reply = { type: 'text', text: "Bang Teti bingung! Jika butuh bantuan panggil aja \"Bang\"" };
    client.replyMessage(replyToken, reply)
    .then(() => console.log("\tSending reply " + replyToken))
    .catch((err) => {
        console.log("\tTerjadi kesalahan " + err)
    });;
}

function handleFeedback(replyToken) {
    console.log("\tBang Teti asks for feedback.");
    var reply = {
      "type": "imagemap",
      "baseUrl": baseURL+"/static/emoji-new",
      "altText": "Bang Teti minta feedback dong.",
      "baseSize": {
          "height": 579,
          "width": 1040
      },
      "actions": [
          {
              "type": "message",
              "text": "Yay! Seneng banget!",
              "area": {
                  "x": 0,
                  "y": 100,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "Terhibur deh :D",
              "area": {
                  "x": 260,
                  "y": 100,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "Wow, sangat menginspirasi!",
              "area": {
                  "x": 520,
                  "y": 100,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "Bangga banget!",
              "area": {
                  "x": 780,
                  "y": 100,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "Astaga, seriusan?",
              "area": {
                  "x": 0,
                  "y": 330,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "Aku sedih :(",
              "area": {
                  "x": 260,
                  "y": 330,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "Duh, merinding, serem..",
              "area": {
                  "x": 520,
                  "y": 330,
                  "width": 200,
                  "height": 200
              }
          },
          {
              "type": "message",
              "text": "Ih ngeselin!",
              "area": {
                  "x": 780,
                  "y": 330,
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
}

// ============================================= Start Server =============================================
app.listen(app.get('port'), function() {
    console.log('Bang Teti is listening on port', app.get('port'));
    top10job.start();
    database = JSON.parse(fileSystem.readFileSync('data/users.json', 'utf8'));
});


function pushBreakingNews() {   
    var targetId = [];
    database.users.forEach(function(user) {
        targetId.push(user.userId);
    });
    console.log("sending to " + JSON.stringify(targetId));

    if (targetId.length == 0) {
        console.log("Bang Teti have no friend :(");
        return;
    }

    const judul = 'Setya Novanto Masuk Penjara KPK';

    const messageIntro = {
        "type": "text",
        "text": "Breaking News!\n \""+judul+"\". Baca info selengkapnya dari Bang Teti!\n\n Sumber: http://tribunnews.com",
    };

    const reply = { 
        "type": 'image', 
        "originalContentUrl": baseURL+"/static/breakingnewsdummy/breakingnews1.png" ,
        "previewImageUrl" : baseURL+"/static/breakingnewsdummy/breakingnews1.png"};

    client.multicast(targetId, [messageIntro, reply])
        .then(() => {
            console.log('Breaking News sent');
        })
        .catch((err) => {
            console.log('Breaking News error: ' + err);
        });
}

app.get('/top10', function(request, response) {
    pushTop10();
    response.send("Pushing top10 to all saved user");
});

function pushTop10() {
    var targetId = [];
    database.users.forEach(function(user) {
        targetId.push(user.userId);
    });
    console.log("sending to " + JSON.stringify(targetId));

    if (targetId.length == 0) {
        console.log("Bang Teti have no friend :(");
        return;
    }

    crawler.getTop10(function(top10) {
        var messageIntro = {
          "type": "text",
          "text": "Ini dia berita top10"
        }
        var msg = '{"type": "template","altText": "Bang Teti ngirimin berita top10 nih","template": {"type": "carousel","columns": []}}';
        var newsCarousel = JSON.parse(msg);
        for (var i=0;i<10;i++) {
          newsCarousel['template']['columns'].push(new newsItem(top10[i].title,top10[i].link,top10[i].img));
        }
        console.log(JSON.stringify(newsCarousel,null,2));
        client.multicast(targetId, [messageIntro, newsCarousel])
        .then(() => console.log("\tSending reply " + replyToken))
        .catch((err) => {console.log("\tTerjadi kesalahan " + err)})
    });

}
