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

mongoose.connect('mongodb://localhost/riders', function(err, db) {
    if (err) {
        console.log('Unable to connect to the server. Please start the server. Error:', err);
    } else {
        console.log('Connected to Server successfully!');
    }
});

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

// make requests here 

// steps 
// step 0: user says hello, callback = saves their name and fb profile (assuming everyone is rider atm)
// step 1: when do you want to leave? callback = updates date they want to leave - start off at step 1
// step 2: what time do you want to leave? callback = updates what time
// step 3: where do you want to leave from? callback = updates where they want to leave from
// step 4: where do you want to go? callback = updates where they want to go


/*
* POST /create_rider
* Content-Type: application/json
* Body: {
*     name: String,
*	  fbID: Integer,
*	  fbProfile: String
* }
}
*/

app.post('/create_rider', function(req, res){
  let rider = new Rider({
    name: req.body.name, // if body doesnt work, try params 
    fbID: req.body.fbID, 
    fbProfile: req.body.fbProfile, 
    foundRide: false, 
    step: 1
  });
  rider.save(function(err){
    if (err) return res.status(500).send(err);
    console.log('Rider created!');
    res.status(204).end();
  });
});

/*
* POST /update_rider_date
* Content-Type: application/json
* Body: {
*     leavingDate: String
* }
}
*/

app.post('/update_rider_date', function(req, res) {
	leavingDate = req.body.leavingDate
	Tank.findByOneAndUpdate({fbID: req.body.fbID}, { "$set": { "leavingDate": req.body.leavingDate, $inc: {"step": 1} }}, { new: true }, function (err, tank) {
	  if (err) return handleError(err);
	  res.send(tank);
	});
});


// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
  // Make sure this is a page subscription
  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) {
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.postback) {
          processPostback(event);
        }
      });
    });

    res.sendStatus(200);
  }
});

function findType(userId) {
	message = {
	    attachment: {
	        type: "template",
	        payload: {
	            template_type: "generic",
	            elements: [{
	                title: "Are you a rider or a driver?",
	                buttons: [{
	                    type: "postback",
	                    title: "Rider",
	                    payload: "Rider"
	                }, {
	                    type: "postback",
	                    title: "Driver",
	                    payload: "Driver"
	                }]
	            }]
	        }
	    }
	};
    
    sendMessage(userId, message);
}

function processPostback(event) {
    var senderId = event.sender.id;
    var payload = event.postback.payload;

    if (payload === "Greeting") {
        // Get user's first name from the User Profile API
        request({
            url: "https://graph.facebook.com/v2.6/" + senderId,
            qs: {
                access_token: process.env.PAGE_ACCESS_TOKEN,
                fields: "first_name"
            },
            method: "GET"
        }, function(error, response, body) {
            var greeting = "";
            if (error) {
                console.log("Error getting user's name: " +  error);
            } else {
                var bodyObj = JSON.parse(body);
                name = bodyObj.first_name;
                greeting = "Hi " + name + ". ";
            }
            var message = greeting + "My name is RideEasy bot. I can help you find a driver!";
            sendMessage(senderId, {text: message});
            findType(senderId); 
        });
    } else if (payload === "Rider") {
        sendTextMessage(senderId, {text: "You are a rider!"});
    } else if (payload === "Driver") {
        sendTextMessage(senderId, {text: "You are a driver!"});
    }
}

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}


// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})