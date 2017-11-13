var fs = require('fs'),xml2js = require('xml2js'),util = require('util'),parser = new xml2js.Parser({explicitArray : false}),http = require('http'),jsdom = require('jsdom'),kmp = require('kmp');
const { JSDOM } = jsdom;


function toLowerCase(title){
	return title.toLowerCase();
}
function xmlToJson(url, callback) {
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
			parser.parseString(xml, function(err, result) {
				callback(null, result);
			});
		});
	});
}
function crawlNews(url,keyword) {
	var news = new Array();
	xmlToJson(url, function(err, result) {
		if (err) {
			console.log(err)
		}
		for(var i = 0; i < result.rss.channel.item.length; i++) {
			var title = result.rss.channel.item[i].title;
			var link = result.rss.channel.item[i].link;
			var dom = new JSDOM(result.rss.channel.item[i].description,{ includeNodeLocations: true });
			var img = dom.window.document.querySelector("img");
			var src;
			if (img == null) {
			  	src = "none";
			} else {
			  	src = img.getAttribute('src');
			}
			if (kmp(toLowerCase(title),keyword) != -1) {
				news.push({"title" : title,"link" : link,"img" : src});
			}
		}
		callback(news);
		//return news;
		//console.log(JSON.stringify(news,null,1));
	});
}
var all = "http://rss.viva.co.id/get/all";
var politic = "http://rss.viva.co.id/get/politik";
var technology = "http://rss.viva.co.id/get/teknologi";
var sport = "http://rss.viva.co.id/get/sport";
var economy = "http://rss.viva.co.id/get/bisnis"
function searchNews(topic,keyword) {
	if (topic === "all") {
		console.log(JSON.stringify(crawlNews(all,keyword),null,1));
		//crawlNews(all,keyword);
	} else if (topic === "olahraga") {
		crawlNews(sport,keyword);
	} else if (topic === "politik") {
		crawlNews(politic,keyword);
	} else if (topic === "teknologi") {
		crawlNews(technology,keyword);
	} else if (topic === "ekonomi") {
		crawlNews(economy,keyword);
	}
}
module.exports.searchNews = searchNews;
var keyword = "ronaldo";
searchNews("all",keyword);
