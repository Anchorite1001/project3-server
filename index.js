const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const http = require('http');
const moment = require('moment');

const router = require('./router');

const PORT = process.env.PORT || 5000;

//set up express application
const app = express();
const server = http.Server(app);
const io = socketio(server, {
  cors: {
    origin: 'https://retro-chat-123.netlify.app/',
    methods:['GET', 'POST', 'OPTIONS'],
    allowHeaders: ["my-custom-header"],
    credentials: true
  }
});

app.use(router);

//set up socket.io
const { getUsersInRoom, getUser, getReceiver, addUser, removeUser } = require ('./controllers/userController');

io.on('connection', (socket) => {

  //user join the room
  socket.on('join', ({ name,room }, callback) => {
    //if join successfully then add user
    const{ error, user } = addUser({ id:socket.id, name, room});
    if(error) {
      return callback(error);
    };

    //joining message: for user(me)
    socket.emit('message', {user:'admin', time:moment().format('MMMM Do YYYY, h:mm:ss a'), text: `${user.name}, welcome to ${user.room}!`});
    //joining message: for other users in the chatroom
    socket.broadcast.to(user.room).emit('message', {user:'admin', time:moment().format('MMMM Do YYYY, h:mm:ss a'), text: `${user.name} has joined ${user.room}`});//message to everyone in the room except the user.

    socket.join(user.room);

    //get & update user data in a room
    io.to(user.room).emit('roomUsers', {room:user.room, users:getUsersInRoom(user.room)});

    callback();
  });

  //handling message send
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', {user:user.name, time:moment().format('MMMM Do YYYY, h:mm:ss a'), text:message});

    callback();
  })

  //handling user leaving
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', {user:'admin', time:moment().format('MMMM Do YYYY, h:mm:ss a'), text:`${user.name} has left ${user.room}`});

      io.to(user.room).emit('roomUsers', {room:user.room, users:getUsersInRoom(user.room)});//update user data in a room
    }
  })

  //handling private message
  socket.on('sendPrivate', async ({ name, room }, message, callback) => {
    const sender = getUser(socket.id);
    const receiver = getReceiver(name,room);

    io.to(socket.id).emit('private', {user:sender.name, time:moment().format('MMMM Do YYYY, h:mm:ss a'), text:message});
    io.to(receiver.id).emit('private', {user:sender.name, time:moment().format('MMMM Do YYYY, h:mm:ss a'), text:message});
    callback();
  });

  //handling videocall
  socket.on('sendCall', ({ name, room, signal }, callback) => {
    const caller = getUser(socket.id);
    const receiver = getReceiver(name, room);

    io.to(receiver.id).emit('callUser', {signal, from:caller.name, to:name }) //not finish
  });

  socket.on('answerCall', ({ signal }) => {
    io.to(socket.id).emit('callAccepted', { signal })
  })
})

server.listen(PORT, () => console.log(`Server started on port ${PORT}.`));
