// import express from 'express'
// import serverless from 'serverless-http'
// import mongoose from 'mongoose'
// import Pusher from 'pusher'
// // import Messages from './dbMessages.js'
// // import Users from './dbUsers.js'
// import { User, Chat, Message } from './dbUsers.js'
// const 

const express = require('express')
const serverless = require('serverless-http')
const mongoose = require('mongoose')
const Pusher = require('pusher')
const DBUsers = require('./dbUsers.js')

const User = DBUsers.User
const Chat = DBUsers.Chat
const Message = DBUsers.Message

//app configuration
const app = express()
// const port = process.env.PORT || 5000;

//middlewares
app.use(express.json())

const router = express.Router();

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
//     next();
// })


//routes
router.get('/', (req, res) => {
    console.log('YKTV')
    res.status(200).send('hello world')
})

router.post('/register', (req, res) => {
    const dbRegister = req.body
    User.findOne({email: dbRegister.email})
    .then(user => {
        if (!user) {
            User.create(dbRegister, (error, data) => {
                if (error) {
                    res.status(500).send(error)
                } else {
                    res.status(201).send(data)
                }
            })
        } else {
            User.find({email: dbRegister.email}, (error, data) => {
                if (error) {
                    res.status(500).send(error)
                } else {
                    res.status(201).send(data[0])
                }
            })
        }
    })
})


router.post('/chat', (req, res) => {
    const dbChat = req.body
    const datum = []
    Chat.create(dbChat, (error, data) => {
        if (error) {
            res.status(500).send(error)
            return
        } else {
            datum.push(data)
        }
        const messageAuthors = {
            authors: data._id,
            messages: []
        }
        Message.create(messageAuthors, (error, data) => {
            if (error) {
                res.status(500).send(error)
            } else {
                datum.push(data)
            }               
            res.status(201).send(datum)
        })
    })
})


router.post('/contacts', (req, res) => {
    const criteria = req.body
    Chat.find({$or: [ {'participants.sender': criteria.user}, {'participants.receiver': criteria.user}] }, (error, data) => {
    // Chat.find({'participants.receiver': criteria.user}, (error, data) => {
        if (error) {
            res.status(500).send(error)
        } else {
            const finalResponse = data.map(async dat => {
                const idOfSender = dat.participants[0].sender;
                const idOfReceiver = dat.participants[1].receiver;
                
                const detailsOfSender = await User.findById(idOfSender).exec()
                .then(data => data)
                .catch(error => res.status(500).send(error))
                
                const detailsOfReceiver = await User.findById(idOfReceiver).exec()
                .then(data => data)
                .catch(error => res.status(500).send(error))
                return {
                    _id: dat._id,
                    participants: [
                        {
                            _id: dat.participants[0]._id,
                            sender: detailsOfSender
                        },
                        {
                            _id: dat.participants[1]._id,
                            receiver: detailsOfReceiver
                        }
                    ]
                }
            })
            Promise.all(finalResponse).then(resp => {
                res.status(201).send(resp)
            })
        }       
    })
})

router.post('/contacts/contactId/:contactId', (req, res) => {
    const author = req.body
    Message.find({authors: author.ath}, async (error, data) => {
        if (error) {
            res.status(500).send("err", error)
        } else {
            const Authors = await Chat.find({_id: author.ath}).exec()
            .then(async data => {
                const theData = data[0]
                const theSender = theData.participants[0].sender
                const theReceiver = theData.participants[1].receiver
                const authorNames = await User.find({$or: [ {_id: theSender}, {_id: theReceiver}] }).exec()
                .then(result => result)
                .catch(error => error)
                
                return authorNames
            })
            .catch(error => error)
            const ans = {
                _id: data[0]._id,
                authors: Authors,
                messages: data[0].messages
            }
            // console.log(ans)
            res.status(201).send(ans)
        }
    })
})

router.put('/chat/id/:id', (req, res) => {
    const dbMessage = req.body
    
    Message.findByIdAndUpdate(
        {_id: dbMessage.id},
        {$push: {"messages": {
           message: dbMessage.message,
           sentBy: dbMessage.sender,
           timestamp: dbMessage.timestamp 
        }}},
        {new: true},
        (error, data) => {
            if (error) {
                res.status(500).send(error)
            } else {
                res.status(201).send(data)
            }
        }
    )
})

// app.get('/messages/sync', (req, res) => {
//     Messages.find((error, data) => {
//         if (error) {
//             res.status(500).send(error)
//         } else {
//             res.status(200).send(data)
//         }
//     })
// })

//DATABASE config
const mongodb_connection_url = 'mongodb+srv://admin:kRYqlnA1Iz5oE1Ud@cluster0.kl9ix.mongodb.net/whatsappMDB?retryWrites=true&w=majority'
mongoose.connect(mongodb_connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const pusher = new Pusher({
    appId: '1078994',
    key: '32f57dadcb8ff9637c3c',
    secret: '0f2c30d199195ee83ade',
    cluster: 'eu',
    encrypted: true
});

const db = mongoose.connection
db.once('open', () => {
    console.log('DB is connected')
    
    // const msgCollection = db.collection("messagecontents");
    // const changeStream = msgCollection.watch()
    // const changeStream = Messages.watch()
    const changeChat = Message.watch({fullDocument: 'updateLookup'})

    // changeStream.on('change', (change) => {
    //     console.log(change)

    //     if (change.operationType === 'insert') {
    //         const messageDetails = change.fullDocument;
    //         pusher.trigger('messages', 'inserted', {
    //             _id: messageDetails._id,
    //             name: messageDetails.name,
    //             message: messageDetails.message,
    //             timestamp: messageDetails.timestamp,
    //             received: messageDetails.received
    //         })
    //     } else {
    //         console.log("Error triggering pusher.")
    //     }
    // })

    changeChat.on('change', (change) => {
        console.log(change.fullDocument)

        if (change.operationType === 'update') {
            const messageDetails = change.fullDocument;
            const chat = messageDetails.messages.slice(-1)[0]
            pusher.trigger('chats', 'updated', {
                _id: chat._id,
                sentBy: chat.sentBy,
                message: chat.message,
                timestamp: chat.timestamp,
            })
        } else {
            console.log("Error triggering pusher.")
        }
    })


})


app.use('/.netlify/functions/server', router)
// app.listen(port, () => console.log(`app is running on localhost:${port}`))
module.exports.handler = serverless(app)