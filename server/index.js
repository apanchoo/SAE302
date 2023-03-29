const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// Stockage des utilisateurs et salons pour la démonstration
const users = [
  { username: 'user1', password: 'pass1' },
  { username: 'user2', password: 'pass2' }
];

const salons = ['sallon1', 'sallon2', 'sallon3'];
const userRooms = new Map();

io.use((socket, next) => {
  socket.on('authentication', ({ username, password }) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      socket.user = user;
      next();
    } else {
      socket.emit('unauthorized');
      socket.disconnect(true);
    }
  });
});

io.on('connection', socket => {
  socket.emit('authenticated');
  socket.emit('salons', salons);

  socket.on('join', room => {
    if (salons.includes(room)) {
      socket.join(room);
      userRooms.set(socket.id, room);
    } else {
      socket.emit('error', `Salon ${room} introuvable`);
    }
  });

  socket.on('message', ({ room, text }) => {
    if (socket.rooms.has(room)) {
      io.to(room).emit('message', { user: socket.user.username, text });
    } else {
      socket.emit('error', `Vous n'êtes pas dans le salon ${room}`);
    }
  });

  socket.on('list_users', (room, callback) => {
    if (salons.includes(room)) {
      const clients = io.sockets.adapter.rooms.get(room);
      const usersInRoom = Array.from(clients)
        .map(clientId => io.sockets.sockets.get(clientId).user.username);
      callback(usersInRoom);
    } else {
      socket.emit('error', `Salon ${room} introuvable`);
    }
  });

  socket.on('private_message', ({ user, text }) => {
    const recipientSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.user.username === user);
    if (recipientSocket) {
      recipientSocket.emit('private_message', { user: socket.user.username, text });
    } else {
      socket.emit('error', `Utilisateur ${user} introuvable`);
    }
  });
});

http.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});