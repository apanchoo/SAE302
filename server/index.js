const net = require("net");
const port = 5000;

let clients = [];
let chatRooms = new Map();

const server = net.createServer((socket) => {
  clients.push(socket);
  console.log(`Nouveau client connecté: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on("data", (data) => {
    let message = data.toString().trim();
    handleMessage(socket, message);
  });

  socket.on("end", () => {
    clients = clients.filter((client) => client !== socket);
    console.log(`Client déconnecté: ${socket.remoteAddress}:${socket.remotePort}`);
  });

  socket.on("error", (err) => {
    console.log(`Erreur: ${err}`);
  });
});

function handleMessage(socket, message) {
  const [command, ...args] = message.split(" ");

  switch (command) {
    case "/join":
      joinRoom(socket, args[0]);
      break;
    case "/leave":
      leaveRoom(socket);
      break;
    case "/msg":
      privateMessage(socket, args[0], args.slice(1).join(" "));
      break;

    case "/nick":
      setNickname(socket, args[0]);
      break;
    
    case "/list":
      listRooms(socket);
      break;
    default:
      broadcast(socket, message);
  }
}

function joinRoom(socket, room) {
  if (!room) {
    socket.write("Veuillez spécifier un nom de salon.\n");
    return;
  }

  leaveRoom(socket);

  if (!chatRooms.has(room)) {
    chatRooms.set(room, []);
  }

  chatRooms.get(room).push(socket);
  socket.currentRoom = room;
  socket.write(`Vous avez rejoint le salon ${room}\n`);
}

function leaveRoom(socket) {
  if (socket.currentRoom) {
    chatRooms.get(socket.currentRoom).splice(chatRooms.get(socket.currentRoom).indexOf(socket), 1);
    socket.currentRoom = null;
  }
}

function privateMessage(socket, target, message) {
  const targetSocket = clients.find((client) => client.nickname === target);

  if (!targetSocket) {
    socket.write("Utilisateur introuvable.\n");
    return;
  }

  if (!message) {
    socket.write("Veuillez entrer un message.\n");
    return;
  }

  targetSocket.write(`${socket.nickname} (privé): ${message}\n`);
}

function broadcast(socket, message) {
  if (!socket.currentRoom) {
    socket.write("Veuillez rejoindre un salon pour envoyer des messages.\n");
    return;
  }

  chatRooms.get(socket.currentRoom).forEach((client) => {
    if (client === socket) {
      client.write(`Vous: ${message}\n`);
    } else {
      client.write(`${socket.nickname}: ${message}\n`);
    }
  });
}


function listRooms(socket) {
  const rooms = Array.from(chatRooms.keys()).join(", ");
  socket.write(`Salons disponibles: ${rooms}\n`);
}


function setNickname(socket, nickname) {
  if (!nickname) {
    socket.write("Veuillez spécifier un pseudo.\n");
    return;
  }

  if (clients.some((client) => client.nickname === nickname)) {
    socket.write("Ce pseudo est déjà utilisé. Veuillez en choisir un autre.\n");
    return;
  }

  socket.nickname = nickname;
  socket.write(`Votre pseudo est maintenant ${nickname}\n`);
}


server.listen(port, () => {
  console.log(`Serveur de chat en écoute sur le port ${port}`);
});
