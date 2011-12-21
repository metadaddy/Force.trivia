/*
 * Faye Quiz server adapted from Soapbox by James Coglan
 * (https://github.com/jcoglan/faye/tree/master/examples)
 */
var express = require('express'),
    faye    = require('faye'),
    rest    = require('./rest.js'),
    oauth   = require('./oauth.js');

var fayeServer = new faye.NodeAdapter({mount: '/faye', timeout: 20}),
    client     = fayeServer.getClient(),
    port       = process.env.PORT || '8000';

var app = express.createServer(
    express.bodyParser(),
    express.cookieParser(),
		express.logger(),
    express.session({ secret: process.env.CLIENT_SECRET  || "1088793090219252439"}),
    express.query());
    
/*var oauthMiddleware = oauth.oauth({
   	clientId: process.env.CLIENT_ID,
   	clientSecret: process.env.CLIENT_SECRET,
   	loginServer: process.env.LOGIN_SERVER,
   	redirectUri: process.env.REDIRECT_URI
	});*/
	var oauthMiddleware = oauth.oauth({
	    clientId: process.env.CLIENT_ID || "3MVG9QDx8IX8nP5RwKyTXo_vDe8bDN9A8i174wBFpLpu.wRNZ_OcBf0uVdIE4YQwhSOmyr7MqgVfibT.db47u",
	    clientSecret: process.env.CLIENT_SECRET || "1088793090219252439",
	    loginServer: process.env.LOGIN_SERVER || "https://login.salesforce.com",
	    redirectUri: process.env.REDIRECT_URI || "http://localhost:8000/master"
	});

console.log(process.argv[2]);

app.set('views', __dirname + '/views');
if (process.argv.length > 2) {
	app.set('view engine', process.argv[2]);
} else {
	app.set('view engine', 'jade');
}

// Require OAuth login at /master.html
app.get('/master', oauthMiddleware, function(req, res) {
    var id = req.query.id;
    if (id) {
    	rest.api(req).query("SELECT Number__c, Question__r.Question__c, Question__r.Answer__c FROM Quiz_Question__c WHERE Quiz__c = '"+id+"' ORDER BY Number__c", function(data) {
    	    console.log(data);
    		res.render('showquiz', data);
    	});        
    } else {
    	rest.api(req).query("SELECT Id, Date__c, Location__c FROM Quiz__c ORDER BY Date__c DESC", function(data) {
    	    console.log(data);
    		res.render('selectquiz', data);
    	});
    }
});

app.post('/player', oauthMiddleware, function(req, res) {
		console.log("In the app.post handler...");
		console.log("req body:\n" + JSON.stringify(req.body));
		rest.api(req).query("Select Id, Name, Name__c From Player__c Where Quiz__c = '" + req.body.Quiz__c + "' AND Name = '" + req.body.Name + "'", function(data) {
			if (data.totalSize == 0) {
				rest.api(req).create('Player__c', req.body, function(data){
		    	res.send(data);
		    	}, function(data, response){
		        res.send(data, response.statusCode);
		    	});
			}else {
				res.send(data);
			}
		});
	});

app.post('/incscore', oauthMiddleware, function(req, res) {
    var restClient = rest.api(req);
    restClient.query("SELECT Id, Score__c FROM Player__c WHERE Quiz__c = '"+req.body.Quiz__c+"' AND Name = '"+req.body.Name+"'", function(data) {
	    console.log(data);
	    var score = data.records[0].Score__c + 1;
	    restClient.update('Player__c', data.records[0].Id, { Score__c: score }, function(data) {
	        res.end();
	    });
	});
});

app.get('/question', oauthMiddleware, function(req, res) {
    rest.api(req).query("SELECT Question_Number__c FROM Quiz__c WHERE Id = '"+req.query.Quiz__c+"'", function(data) {
	    console.log(data);
        res.send(data);
	});
});

app.post('/question', oauthMiddleware, function(req, res) {
        rest.api(req).update('Quiz__c', req.body.Quiz__c, { Question_Number__c: req.body.Question_Number__c }, function(data) {
	        res.end();
	    });
	});

app.get('/highscores', oauthMiddleware, function(req, res) {
    rest.api(req).query("SELECT Id, Name, Score__c FROM Player__c WHERE Quiz__c = '"+req.query.Quiz__c+"' ORDER BY Score__c DESC", function(data) {
	    console.log(data);
        res.send(data);
	});
});

app.use(express.static(__dirname + '/public'));

fayeServer.attach(app);

app.listen(Number(port));

console.log('Listening on ' + port);
