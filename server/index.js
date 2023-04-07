const net = require("net");
const bcrypt = require("bcrypt");
const port = 5000;
const dgram = require("dgram");
const sqlite3 = require("sqlite3").verbose();
const CryptoJS = require("crypto-js");
const db = new sqlite3.Database("chat.db", (err) => {
  if (err) {
    console.error("Erreur lors de l'ouverture de la base de données:", err);
    process.exit(1);
  }
});
const secretKey = "your-secret-key";


// Initialisez la base de données
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, room TEXT, username TEXT, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

const udpServer = dgram.createSocket("udp4");

// Utilisez un port différent de celui du serveur TCP
const udpPort = 3001;

// Diffusez la présence du serveur toutes les 10 secondes
setInterval(() => {
  // Incluez le port TCP (server.address().port) dans le message
  const message = Buffer.from(`chat_server_announcement:${server.address().port}`);
  udpServer.send(message, 0, message.length, 3004, "255.255.255.255");
}, 10000);

// Autorisez la diffusion (broadcast)
udpServer.bind(udpPort, () => {
  udpServer.setBroadcast(true);
});



let clients = [];
let chatRooms = new Map();

const server = net.createServer((socket) => {
  clients.push(socket);
  console.log(`Nouveau client connecté: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on("data", (data) => {
    let encryptedMessage = data.toString().trim();
    let message = decryptMessage(encryptedMessage);
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

function encryptMessage(message) {
  const cipherText = CryptoJS.AES.encrypt(message, secretKey).toString();
  return cipherText;
}

function decryptMessage(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  const originalMessage = bytes.toString(CryptoJS.enc.Utf8);
  return originalMessage;
}

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

    case "/register":
      registerUser(socket, args[0], args[1]);
      break;
    case "/login":
      loginUser(socket, args[0], args[1]);
      break;
    case "/users":
      listUsers(socket);
      break;

    default:
      broadcast(socket, message);
  }
}

function joinRoom(socket, room) {
  if (!socket.isAuthenticated) {
    socket.write(encryptMessage("Veuillez vous connecter pour rejoindre un salon.\n"));
    return;
  }

  if (!room) {
    socket.write(encryptMessage("Veuillez spécifier un nom de salon.\n"));
    return;
  }

  leaveRoom(socket);

  if (!chatRooms.has(room)) {
    chatRooms.set(room, []);
  }

  chatRooms.get(room).push(socket);
  socket.currentRoom = room;
  socket.write(encryptMessage(`Vous avez rejoint le salon ${room}\n`));
  db.all("SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT 10", [room], (err, rows) => {
    if (err) {
      console.error("Erreur lors de la récupération des messages :", err);
      return;
    }

    // Affichez les 10 derniers messages à l'utilisateur qui vient de rejoindre le salon
    socket.write(encryptMessage("10 derniers messages du salon :\n"));
    rows.reverse().forEach((row) => {
      socket.write(encryptMessage(`${row.username}: ${row.message}\n`));
    });
  });
}

function leaveRoom(socket) {
  if (socket.currentRoom) {
    chatRooms.get(socket.currentRoom).splice(chatRooms.get(socket.currentRoom).indexOf(socket), 1);
    socket.currentRoom = null;
  }
}

function listUsers(socket) {
  let userList = [];

  chatRooms.forEach((usersInRoom, room) => {
    usersInRoom.forEach((user) => {
      userList.push({
        nickname: user.nickname,
        room: room,
      });
    });
  });

  if (userList.length === 0) {
    socket.write(encryptMessage("Aucun utilisateur connecté actuellement.\n"));
  } else {
    socket.write(encryptMessage("Liste des utilisateurs connectés :\n"));
    userList.forEach((user) => {
      socket.write(encryptMessage(`${user.nickname} (salle : ${user.room})\n`));
    });
  }
}

function privateMessage(socket, target, message) {
  const targetSocket = clients.find((client) => client.nickname === target);

  if (!targetSocket) {
    socket.write(encryptMessage("Utilisateur introuvable.\n"));
    return;
  }

  if (!message) {
    socket.write(encryptMessage("Veuillez entrer un message.\n"));
    return;
  }

  targetSocket.write(encryptMessage(`\n${socket.nickname} (privé): ${message}\n`));
}

function broadcast(socket, message) {
  if (!socket.isAuthenticated) {
    socket.write(encryptMessage("Veuillez vous connecter pour envoyer des messages.\n"));
    return;
  }

  if (!socket.currentRoom) {
    socket.write(encryptMessage("Veuillez rejoindre un salon pour envoyer des messages.\n"));
    return;
  }

  chatRooms.get(socket.currentRoom).forEach((client) => {
    if (client === socket) {
      client.write(encryptMessage(`Vous: ${message}\n`));
    } else {
      client.write(encryptMessage(`\n${socket.nickname}: ${message}\n`));
    }
  });
  // Enregistrez le message dans la base de données
  db.run("INSERT INTO messages (room, username, message) VALUES (?, ?, ?)", [socket.currentRoom, socket.nickname, message]);
}


function listRooms(socket) {
  const rooms = Array.from(chatRooms.keys()).join(", ");
  socket.write(encryptMessage(`Salons disponibles: ${rooms}\n`));
}


function setNickname(socket, nickname) {
  if (!nickname) {
    socket.write(encryptMessage("Veuillez spécifier un pseudo.\n"));
    return;
  }

  if (clients.some((client) => client.nickname === nickname)) {
    socket.write(encryptMessage("Ce pseudo est déjà utilisé. Veuillez en choisir un autre.\n"));
    return;
  }

  socket.nickname = nickname;
  socket.write(encryptMessage(`Votre pseudo est maintenant ${nickname}\n`));
}

function loginUser(socket, username, password) {
  if (!username || !password) {
    socket.write(encryptMessage("Veuillez fournir un nom d'utilisateur et un mot de passe pour vous connecter.\n"));
    return;
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err || !row) {
      socket.write(encryptMessage("Nom d'utilisateur ou mot de passe incorrect.\n"));
      return;
    }

    bcrypt.compare(password, row.password, (err, result) => {
      if (err || !result) {
        socket.write(encryptMessage("Nom d'utilisateur ou mot de passe incorrect.\n"));
        return;
      }

      socket.nickname = username;
      socket.isAuthenticated = true;
      socket.write(encryptMessage(`Vous êtes maintenant connecté en tant que ${username}\n`));
    });
  });
}


function registerUser(socket, username, password) {
  if (!username || !password) {
    socket.write(encryptMessage("Veuillez fournir un nom d'utilisateur et un mot de passe pour vous inscrire.\n"));
    return;
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      socket.write(encryptMessage("Erreur lors du hachage du mot de passe.\n"));
      return;
    }

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
      if (err) {
        socket.write(encryptMessage("Erreur lors de l'inscription : l'utilisateur existe déjà.\n"));
        return;
      }

      socket.write(encryptMessage("Inscription réussie! Vous pouvez maintenant vous connecter.\n"));
    });
  });
}



server.listen(port, () => {
  console.log(`Serveur de chat en écoute sur le port ${port}`);
});

