'use strict'

const express = require('express'),
      path = require('path'),
      mongoose = require('mongoose'),
      bodyParser = require('body-parser'),
      Driver = require ('./models/driver'),
      Rider  = require ('./models/rider'),
      PORT = process.env.PORT || 8080,
      app = express(),
      request = require('request'); 

app.use(express.static(path.join(__dirname, 'app', 'public')));
app.use(bodyParser.json())

const token = process.env.FB_VERIFY_TOKEN

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === token) {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
	// Make sure this is a page subscription
	if (req.body.object == "page") {
		// Iterate over each entry
		// There may be multiple entries if batched
		req.body.entry.forEach(function(entry) {
		  	// Iterate over each messaging event
		  	if (entry.messaging) {
				entry.messaging.forEach(function(event) {
			    if (event.postback) {
			    	processPostback(event);
			    }
			  });
			}
		})
    res.sendStatus(200);
  	}
});

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token:token,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        console.log("bodyObj", bodyObj)
        let name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      var message = greeting + "My name is RideEasy Bot. I can help you with your ride!";
      sendMessage(senderId, {text: message});
    });
  }
}

// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token:token},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}


// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})