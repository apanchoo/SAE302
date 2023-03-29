const readline = require('readline');
const WebSocket = require('ws');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour se connecter au serveur Websocket
function connectToWebSocketServer(serverAddress, identifiant, motDePasse) {
  const ws = new WebSocket(serverAddress);

  ws.on('open', function open() {
    // Envoyer les identifiants au serveur
    ws.send(JSON.stringify({ identifiant: identifiant, motDePasse: motDePasse }));
  });

  ws.on('message', function incoming(data) {
    

    const message = JSON.parse(data);
    if (message.authentification === 'réussie') {
      console.log(`Liste des salons disponibles: ${message.salons}`);
    }

    ws.close();
  });
}

rl.question('Entrez l\'adresse du serveur Websocket: ', (serverAddress) => {
  rl.question('Entrez votre identifiant: ', (identifiant) => {
    rl.question('Entrez votre mot de passe: ', (motDePasse) => {
      console.log(`Identifiant: ${identifiant}, Mot de passe: ${'*'.repeat(motDePasse.length)}`);
      
      // Se connecter au serveur Websocket
      connectToWebSocketServer(serverAddress, identifiant, motDePasse);

      rl.close();
    });

    // Configuration pour cacher les caractères entrés par l'utilisateur
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted)
        rl.output.write("*");
      else
        rl.output.write(stringToWrite);
    };
    rl.stdoutMuted = true;
    process.stdin.on('keypress', function (chunk, key) {
      if (key && key.name === 'return') {
        rl.stdoutMuted = false;
      }
    });
  });
});

