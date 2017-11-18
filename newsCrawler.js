var fs = require('fs'),xml2js = require('xml2js'),util = require('util'),parser = new xml2js.Parser({explicitArray : false}),http = require('http'),jsdom = require('jsdom'),kmp = require('kmp');
const { JSDOM } = jsdom;


function toLowerCase(title){
	return title.toLowerCase();
}
function newsItem(title,link,img) {
	this.thumbnailImageUrl = img;
	this.text = title;
	this.actions = new Array();
	this.actions.push({"type" : "uri","label" : "Selengkapnya","uri" : link});
	this.actions.push({"type" : "message","label" : "Beri feedback","text" : "feedback"});
}
function xmlToJson(url,callback) {
	var request = http.get(url, function(response) {
		var xml = '';
					   
		response.on('data', function(chunk) {
			xml += chunk;
		});
					   
		response.on('error', function(e) {
			callback(e, null);
		});
		
		response.on('timeout', function(e) {
			callback(e, null);
		});
					   
		response.on('end', function() {
			var result = parser.parseString(xml, function(err, result) {
				callback(null, result);
			});
		});
	});
}
function crawlTop10(callback,output) {
	xmlToJson('http://sindikasi.okezone.com/index.php/rss/0/RSS2.0',function(err, result) {
		var news = new Array();
		if (err) {
			callback(err)
		}
		for(var i = 0; i < 10; i++) {
			var title = result.rss.channel.item[i].title;
			var link = result.rss.channel.item[i].link;
			//var dom = new JSDOM(result.rss.channel.item[i].image,{ includeNodeLocations: true });
			//var img = dom.window.document.querySelector("img");
			var src = result.rss.channel.item[i].image.url;
			/*if (img == null) {
			  	src = "none";
			} else {
			  	src = img.getAttribute('src');
			}*/
			news.push({"title" : title,"link" : link,"img" : src});
		}
		return output(news);
	});
}

function crawlNews(url,keyword,callback,output) {
	xmlToJson(url,function(err, result) {
		var news = new Array();
		if (err) {
			callback(err)
		}
		for(var i = 0; i < result.rss.channel.item.length; i++) {
			var title = result.rss.channel.item[i].title;
			var link = result.rss.channel.item[i].link;
			//var dom = new JSDOM(result.rss.channel.item[i].image,{ includeNodeLocations: true });
			//var img = dom.window.document.querySelector("img");
			var src = result.rss.channel.item[i].image.url;
			/*if (img == null) {
			  	src = "none";
			} else {
			  	src = img.getAttribute('src');
			}*/
			if (kmp(toLowerCase(title),keyword) != -1) {
				news.push({"title" : title,"link" : link,"img" : src});
			}
		}
		return output(news);
	});
}
var all = "http://sindikasi.okezone.com/index.php/rss/1/RSS2.0";
var politic = "http://rss.viva.co.id/get/politik";
var technology = "http://rss.viva.co.id/get/teknologi";
var sport = "http://rss.viva.co.id/get/sport";
var economy = "http://rss.viva.co.id/get/bisnis"
function searchNews(topic,keyword,callback) {
	
	if (topic === "all") {
		crawlNews(all,keyword,console.log,function(news) {
			//console.log(news);
			callback(news);
		});
	} else if (topic === "olahraga") {
		crawlNews(sport,keyword,console.log,function(news) {
			//console.log(news);
			callback(news);
		});
	} else if (topic === "politik",console.log) {
		crawlNews(politic,keyword,console.log,function(news) {
			//console.log(news);
			callback(news);
		});
	} else if (topic === "teknologi") {
		crawlNews(technology,keyword,console.log,function(news) {
			//console.log(news);
			callback(news);
		});
	} else if (topic === "ekonomi") {
		crawlNews(economy,keyword,console.log,function(news) {
			//console.log(news);
			callback(news);
		});
	}
}
module.exports.searchNews = searchNews;
module.exports.crawlTop10 = crawlTop10;
crawlTop10(console.log,function(top10) {
	var msg = '{"type": "template","altText": "Hasil pencarian","template": {"type": "carousel","columns": []}}';
	var newsCarousel = JSON.parse(msg);
	for (var i=0;i<10;i++) {
		newsCarousel['template']['columns'].push(new newsItem(top10[i].title,top10[i].link,top10[i].img));
	}
	console.log(JSON.stringify(newsCarousel,null,3));
})