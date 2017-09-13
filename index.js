'use strict'

// TO DO:
// make created at for riders and drivers
// instead of findoneandupdate -- use findone and then save if you cant figure how to find most recent
// otherwise use findoneandupdate to find most recent

const express = require('express'),
      path = require('path'),
      mongoose = require('mongoose'),
      bodyParser = require('body-parser'),
      Driver = require ('./models/driver'),
      Rider  = require ('./models/rider'),
      User = require ('./models/user'),
      PORT = process.env.PORT || 8080,
      app = express(),
      request = require('request'), 
      moment = require('moment'); 

app.use(express.static(path.join(__dirname, 'app', 'public')));
app.use(bodyParser.json())

const token = process.env.FB_VERIFY_TOKEN
var db = mongoose.connect(process.env.MONGODB_URI);

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
			    } else if (event.message) {
			    	processMessage(event); 
			    }
			  });
			}
		})
    res.sendStatus(200);
  	}
});


// classify user 
function findType(userId) {
	let message = {
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


function processDriverStep(id, step, senderId, formattedMsg) {
	switch (step) {
		case 1:
		    // hopefully format will be "jan-6 11:30pm"
			// set leaving date and time
			var dateTime = moment(formattedMsg, "MMM D h:ma").format(); 
			if (dateTime) {
				Driver.findOneAndUpdate({_id: id}, { "$set": { "leavingDateTime": dateTime, "step": step + 1}}, {new: true}, 
					function (err, updatedDriver) {
					if (err) {
						console.log("Could not find and update driver", err);  
						sendMessage(senderId, {text: "I cannot` understand your request. Please format it like jan 6 11:30pm"}); 
				  	} else {
				  		sendMessage(senderId, {text: "Where are you leaving from?"}); 
				  	}
				});        				
			}
			break; 
		case 2:
			// update where they are leaving from 
			// must be one word
			Driver.findOneAndUpdate({_id: id}, { "$set": { "leavingLocation": formattedMsg, "step": step + 1}}, {new: true}, function (err, updatedDriver) {
				if (err) {
					console.log("Could not find and update driver.")
				  	sendMessage(senderId, {text: "I cannot understand your request. Where are you leaving from?"}); 
				} else {
				  	sendMessage(senderId, {text: "Where do you want to go?"}); 
				}
			});
			break;    
		case 3:
			// update where they want to go 
			Driver.findOneAndUpdate({_id: id}, { "$set": { "arrivingLocation": formattedMsg, "step": step + 1}}, {new: true}, function (err, updatedDriver) {
				if (err) {
					console.log("Could not find and update driver", err);  
			  		sendMessage(senderId, {text: "I cannot understand your request. Where are you going?"}); 
			  	} else {
			  		sendMessage(senderId, {text: "How much do you want to charge for one guest?"});
			  	}
			});
			break;
		case 4:
			// update where they want to go 
			Driver.findOneAndUpdate({_id: id}, { "$set": { "price": formattedMsg, "step": step + 1}}, {new: true}, function (err, updatedDriver) {
				if (err) {
			  		console.log("Could not find and update driver", err)
			  		sendMessage(senderId, {text: "I cannot understand your request. How much do you want to charge per guest?"}); 
			  	} else {
			  		findRiders(updatedDriver.leavingDateTime, updatedDriver.leavingLocation, updatedDriver.arrivingLocation, senderId); 
			  	}
			});
			break;
	}	
}


function findRiders(dateTime, from, to, senderId) {
	Rider.find({ requestedDateTime: dateTime, requestedFromLocation: from, requestedToLocation: to}, function (err, riders) {
		if (err) {
			console.log("Uh oh. An error occured while finding drivers.")
			sendMessage(senderId, {text: "An error occured. Please delete this conversation and restart."}); 
		} else if (riders.length > 0) {
			var responseString = "Success! We have found match(es)! These are their Facebook links so you can message them! "; 
			var r; 
			for (r in riders) { responseString += `Facebook Profile : ${riders[r].fbProfile} `; }
			sendMessage(senderId, {text: responseString}); 
		} else {
			sendMessage(senderId, {text: "Sorry no matches today. Check again later!"}); 
		} 
	}); 
}

var person = {fname:"John", lname:"Doe", age:25}; 

function processRiderStep(id, step, senderId, formattedMsg) {
	switch (step) {
		// cases starting from 1 will be for riders
		case 1:
		    // hopefully format will be "jan-6 11:30pm"
			// set leaving date and time
			var dateTime = moment(formattedMsg, "MMM D h:ma").format(); 
			if (dateTime) {
				Rider.findOneAndUpdate({_id: id}, { "$set": { "requestedDateTime": dateTime, "step": step + 1}}, {new: true}, 
					function (err, updatedRider) {
					if (err) {
						console.log("Could not find and update rider."); 
						sendMessage(senderId, {text: "I cannot` understand your request. Please format it like jan 6 11:30pm"}); 
				  	} else {
				  		sendMessage(senderId, {text: "Where are you leaving from?"}); 
				  	}
				});        				
			}
			break;  
		case 2:
			// update where they are leaving from 
			// must be one word
			Rider.findOneAndUpdate({_id: id}, { "$set": { "requestedFromLocation": formattedMsg, "step": step + 1}}, {new: true}, function (err, updatedRider) {
				if (err) {
					console.log("Could not find and update rider.")
				  	sendMessage(senderId, {text: "I cannot understand your request. Where are you leaving from?"}); 
				} else {
				  	sendMessage(senderId, {text: "Where do you want to go?"}); 
				}
			});
			break;    
		case 3:
			// update where they want to go 
			Rider.findOneAndUpdate({_id: id}, { "$set": { "requestedToLocation": formattedMsg, "step": step + 1}}, {new: true}, function (err, updatedRider) {
				if (err) {
			  		console.log("Could not find and update rider.")
			  		sendMessage(senderId, {text: "I cannot understand your request. Where are you going?"}); 
			  	} else {
			  		findDrivers(updatedRider.requestedDateTime, updatedRider.requestedFromLocation, updatedRider.requestedToLocation, senderId); 
			  	}
			});
			break;
	}
}

function findDrivers(dateTime, from, to, senderId) {
	Driver.find({ leavingDateTime: dateTime, leavingLocation: from, arrivingLocation: to}, function (err, drivers) {
		if (err) {
			console.log("Uh oh. An error occured while finding drivers.")
			sendMessage(senderId, {text: "An error occured. Please delete this conversation and restart."}); 
		} else if (drivers.length > 0) {
			var responseString = "Success! We have found match(es)! These are their Facebook links so you can message them! "; 
			var d; 
			for (d in drivers) { 
				responseString += `FB : ${drivers[d].fbProfile}, Price: ${drivers[d].price} \n`;
			}
			sendMessage(senderId, {text: responseString}); 
		} else {
			sendMessage(senderId, {text: "Sorry no matches today. Check again later!"}); 
		} 
	}); 
}

// find the user
function findDriver(id, senderId, formattedMsg) {
	Driver.findOne({ _id: id}, function (err, doc) {
		if (doc) {
			console.log("Processing driver step.."); 
			processDriverStep(doc._id, doc.step, senderId, formattedMsg);
		} else {
			console.log("Error finding driver.");  
		} 
	}); 
}

// find the user
function findRider(id, senderId, formattedMsg) {
	Rider.findOne({ _id: id}, function (err, doc) {
		if (doc) {
			processRiderStep(doc._id, doc.step, senderId, formattedMsg);
		} else {
			console.log("Error finding rider.");  
		} 
	}); 
}

function createUser(fbID, rdID, type) {
	let user = new User({
		fbID: fbID, 
		rdID: rdID, 
		type: type
	}); 
	user.save(function(error){
		if (error) {
		    console.log("Error creating user: " +  error);
		} else {
		    console.log('User created!');
		}
	});
}


// handle initial messaging 
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
			let name = bodyObj.first_name;
			greeting = "Hi " + name + ". ";
		}
		var message = greeting + "My name is RideEasy Bot. I can help you with your ride!";
		sendMessage(senderId, {text: message});
		findType(senderId); 
    });
  } else if (payload === "Rider") {
		let rider = new Rider({
	    	fbID: senderId, 
	    	fbProfile: "https://www.facebook.com/profile?id=" + senderId, 
	    	foundRide: false, 
	    	step: 1
	  	});
		rider.save(function(err){
		    if (err) {
		    	console.log("Error creating rider: " +  error);
		    	sendMessage(senderId, {text: "Error creating user. Please delete this conversation and try again."}); 
		    } else {
		    	console.log('Rider created!');
		    	createUser(senderId, rider._id, "Rider");
				sendMessage(senderId, {text: "When do time and date do you want to leave? Please format it like jan 6 11:30pm."}); 
		    }
		});
	} else if (payload == "Driver") {
		let driver = new Driver({
			fbID: senderId, 
	    	fbProfile: "https://www.facebook.com/profile?id=" + senderId, 
	    	step: 1
		});
		driver.save(function(err){
		    if (err) {
		    	console.log("Error creating driver: " +  error);
		    	sendMessage(senderId, {text: "Error creating user. Please delete this conversation and try again."}); 
		    } else {
		    	createUser(senderId, driver._id, "Driver");
		    	sendMessage(senderId, {text: "When do time and date do you want to leave? Please format it like jan 6 11:30pm."}); 
		    }
		});
	}
}


function processMessage(event) {
    if (!event.message.is_echo) {
        var message = event.message;
        var senderId = event.sender.id;

        console.log("Received message from senderId: " + senderId);
        console.log("Message is: " + JSON.stringify(message));

        if (message.text) {
			var formattedMsg = message.text.toLowerCase().trim();
	        User.findOne({ fbID: senderId}, {}, { sort: {_id: -1} }, function (err, doc) {
	        	if (doc && doc.type == "Driver") {
	        		findDriver(doc.rdID, senderId, formattedMsg); 
	        	} else if (doc && doc.type == "Rider") {
	        		findRider(doc.rdID, senderId, formattedMsg); 
	        	} else {
	        		console.log("Error finding user."); 
	        		sendMessage(senderId, {text: "Sorry, I don't understand your request. Try deleting this conversation and start again."});
	        	} 
	        }); 
        } else if (message.attachments) {
            sendMessage(senderId, {text: "Sorry, I don't understand your request."});
        }
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