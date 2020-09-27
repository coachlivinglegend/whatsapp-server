// import mongoose from 'mongoose'
const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    appPhoneNumber: String,
    displayName: String,
    email: String,
    avatar: String,
})

const chatSchema = mongoose.Schema({
    participants: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            receiver: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ]
})

const messageSchema = mongoose.Schema({
    authors: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    },
    messages: [
        {
            message: String,
            sentBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            timestamp: String,
        }
    ]
})

module.exports = {
    User: mongoose.model('User', userSchema),
    Chat: mongoose.model('Chat', chatSchema),
    Message: mongoose.model('Message', messageSchema),
}

// export const User = mongoose.model('User', userSchema)
// export const Chat = mongoose.model('Chat', chatSchema)
// export const Message = mongoose.model('Message', messageSchema)
