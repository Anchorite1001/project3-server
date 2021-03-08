const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const http = require('http');

const { getUsersInRoom, getUser, addUser, removeUser } = require ('./controllers/userController');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express(); //express application
const server = http.createServer(app);//server
const io = socketio(server); //socket.io

app.use(router);
app.use(cors());

io.on('connection', (socket) => {
  console.log('A new user has joined.');

  socket.on('join', ({ name,room }, callback) => {
    const{ error, user } = addUser({ id:socket.id, name, room});
    if(error) {
      return callback(error);
    };

    socket.emit('message', {user:'admin', text: `${user.name}, welcome to ${user.room}!`}); //message for the user
    socket.broadcast.to(user.room).emit('message', {user:'admin', text: `${user.name} has joined ${user.room}`});//message to everyone in the room except the user.

    socket.join(user.room);

    io.to(user.room).emit('roomUsers', {room:user.room, users:getUsersInRoom(user.room)});//get user data in a room

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', {user:user.name, text:message});

    callback();
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', {user:'admin', text:`${user.name} has left ${user.room}.`});

      io.to(user.room).emit('roomUsers', {room:user.room, users:getUsersInRoom(user.room)});//update user data in a room
    }
  })
})

server.listen(PORT, () => console.log(`Server started on port ${PORT}.`))
