const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const twilio = require('twilio');
const accountSid = 'ACe2fa6b6a989c819b4cf1511f32a0e074';
const authToken = 'b968a315c538d37c778b085693490ee4';
const client = new twilio(accountSid, authToken);

let MessageSchema = new mongoose.Schema({
  phoneNumber: String,
  customerName: String,
  typeOfVehicleInterested: String,
  colorOfVehicle: String
})

let Message = mongoose.model('Message', MessageSchema);

app.use(bodyParser.urlencoded({extended: false}))
mongoose.connect('mongodb://hector:332211@ds111622.mlab.com:11622/paramount-chatbot-db', {useMongoClient: true}).then(() => {
  console.log('db connected');
})

app.get('/', (req,res) => {
  res.end();
})

app.post('/inbound', (req, res) => {
  let from = req.body.From;
  let to = req.body.To;
  let body = req.body.Body;

  Message.find({phoneNumber: req.body.From}, (err, message) => {
    if(message.length !== 0){
      if(!message[0].customerName && !message[0].typeOfVehicleInterested && !message[0].colorOfVehicle) {
        Message.findByIdAndUpdate(message[0]._id, {"$set": {"customerName": body}}, {"new": true, "upsert": true}, () => {
          client.messages.create({
            to: `${from}`,
            from: `${to}`,
            body: `What kind of vehile are you looking for?`
          })

          res.end();
        })
      } else if(!message[0].typeOfVehicleInterested && !message[0].colorOfVehicle) {
        Message.findByIdAndUpdate(message[0]._id, {"$set": {"typeOfVehicleInterested": body}}, {"new": true, "upsert": true}, () => {
          client.messages.create({
            to: `${from}`,
            from: `${to}`,
            body: `What color vehicle are you looking for?`
          })

          res.end();
        })
      } else if(!message[0].colorOfVehicle) {
        Message.findByIdAndUpdate(message[0]._id, {"$set": {"colorOfVehicle": body}}, {"new": true, "upsert": true}, () => {
          client.messages.create({
            to: `${from}`,
            from: `${to}`,
            body: 'Got it! We are working hard to track down your vehicle. A customer service representative will contact you soon with a list of vehicles that match your search. Have a great day!'
          })

          res.end();
        })
      }
    } else{
      if(body === 'SAVE'){
        let newMessage = new Message();
        newMessage.phoneNumber = from;
        newMessage.save(() => {
          client.messages.create({
            to: `${from}`,
            from: `${to}`,
            body: 'Hello from Paramount Auto Center! What is your name?'
          })
        })
      }
    }

    res.end();
  })
})

app.listen(3000, () => {
   console.log('server connected');
})
