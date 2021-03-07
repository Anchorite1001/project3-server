const users = [];

const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room)
};

const getUser = (id) => users.find((user) => user.id === id);

const addUser = ( { id, name, room } ) => {
  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  const existingUser  = users.find((user) => user.room === room && user.name === name);

  if(existingUser) {
    return {error: 'Username has been taken in this room.'}
  };

  const user = { id, name, room }; // === {id:id, name:name, room:room}
  users.push(user);

  return{ user }
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if(index !== -1) {
    return users.splice(index, 1)[0];
  }
};

module.exports = { getUsersInRoom, getUser, addUser, removeUser }
