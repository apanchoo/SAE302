// Client CLI avec Node.js et Socket.IO
const readline = require('readline');
const io = require('socket.io-client');
const hideCursor = '\x1B[?25l';
const showCursor = '\x1B[?25h';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let serverAddress, username, password;
let socket;

function askServerAddress() {
  rl.question('Adresse du serveur : ', addr => {
    serverAddress = addr;
    askUsername();
  });
}

function askUsername() {
  rl.question('Identifiant : ', user => {
    username = user;
    askPassword();
  });
}

function askPassword() {
  process.stdout.write('Mot de passe : ');
  process.stdout.write(hideCursor);

  let passwordInput = '';
  process.stdin.on('keypress', (ch, key) => {
    if (key && key.name === 'return') {
      process.stdout.write(showCursor);
      process.stdin.removeAllListeners('keypress');
      password = passwordInput;
      connectToServer();
    } else {
      passwordInput += ch;
      process.stdout.write('*');
    }
  });
}

function connectToServer() {
  socket = io(serverAddress);

  socket.on('connect', () => {
    console.log('\nConnexion en cours...');
    socket.emit('authentication', { username, password });

    socket.on('authenticated', () => {
      console.log('Connexion établie');
      socket.on('salons', salons => {
        console.log(`Salons disponibles : ${salons.join(', ')}`);
        commandPrompt();
      });
    });

    socket.on('unauthorized', () => {
      console.log('Authentification échouée');
      process.exit(1);
    });

    socket.on('message', msg => {
      console.log(`\n${msg.user}: ${msg.text}`);
      commandPrompt();
    });

    socket.on('private_message', msg => {
      console.log(`\n[PRIVÉ] ${msg.user}: ${msg.text}`);
      commandPrompt();
    });
  });
}

function commandPrompt() {
  rl.question('\n> ', command => {
    const args = command.split(' ');
    const cmd = args.shift();

    switch (cmd) {
      case 'join':
        if (args.length !== 1) {
          console.log('Usage : join <sallon>');
        } else {
          socket.emit('join', args[0]);
        }
        break;
      case 'send':
        if (args.length < 2) {
          console.log('Usage : send <sallon> <message>');
        } else {
          socket.emit('message', { room: args[0], text: args.slice(1).join(' ') });
        }
        break;
      case 'list_users':
        if (args.length !== 1) {
          console.log('Usage : list_users <sallon>');
        } else {
          socket.emit('list_users', args[0], users => {
            console.log(`Utilisateurs dans ${args[0]} : ${users.join(', ')}`);
          });
        }
        break;
      case 'private':
        if (args.length < 2) {
          console.log('Usage : private <utilisateur> <message>');
        } else {
          socket.emit('private_message', { user: args[0], text: args.slice(1).join(' ') });
          }
          break;
        default:
          console.log('Commande inconnue');
      }
      commandPrompt();
    });
  }
  
  askServerAddress();
  