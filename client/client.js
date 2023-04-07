const net = require("net");
const readline = require("readline");
const port = 5000;
const host = "127.0.0.1";
const dgram = require("dgram");
const udpClient = dgram.createSocket("udp4");
const CryptoJS = require("crypto-js");
const udpPort = 3004;
const secretKey = "your-secret-key";
const foundServers = [];


udpClient.on("listening", () => {
  console.log(" _____ _____ _     _____ ________  ___")
  console.log("|_   _|  ___| |   /  __ \  _  |  \/  |")
  console.log("  | | | |__ | |   | /  \/ | | | .  . | )")
  console.log("  | | |  __|| |   | |   | | | | |\/| | ");
  console.log("  | | | |___| |___| \__/\ \_/ / |  | | ");
  console.log("  \_/ \____/\_____/\____/\___/\_|  |_/ ")
  console.log("Recherche de serveurs de chat...");
  setTimeout(() => {
  udpClient.close();
  showServerListAndConnect();
}, 10000);
});

udpClient.on("message", (msg, rinfo) => {
  const [announcement, tcpPort] = msg.toString().split(":");

  if (announcement === "chat_server_announcement") {
    const serverAddress = `${rinfo.address}:${tcpPort}`;

    if (!foundServers.includes(serverAddress)) {
      foundServers.push(serverAddress);
      console.log(`Serveur de chat trouvé : ${serverAddress}`);
    }
  }
});



udpClient.bind(udpPort);


function displayPrompt() {
  process.stdout.write("> ");
}
function encryptMessage(message) {
  const cipherText = CryptoJS.AES.encrypt(message, secretKey).toString();
  return cipherText;
}

function decryptMessage(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  const originalMessage = bytes.toString(CryptoJS.enc.Utf8);
  return originalMessage;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


function showServerListAndConnect() {
  if (foundServers.length === 0) {
    console.log("Aucun serveur trouvé. Veuillez réessayer plus tard.");
    process.exit(1);
  }

  console.log("Serveurs trouvés :");
  foundServers.forEach((server, index) => {
    console.log(`${index + 1}. ${server}`);
  });

  rl.question("Entrez le numéro du serveur auquel vous souhaitez vous connecter : ", (choice) => {
    const serverIndex = parseInt(choice) - 1;

    if (serverIndex >= 0 && serverIndex < foundServers.length) {
      const [host, port] = foundServers[serverIndex].split(":");

      // Connectez-vous au serveur choisi
      const client = new net.Socket();
      client.connect(port, host, () => {
        console.log("Connecté au serveur de chat");
        console.log("Bienvenue sur le serveur de chat!");
        console.log("Utilisez /register <username> <password> pour vous inscrire.");
        console.log("Utilisez /login <username> <password> pour vous connecter.");
        console.log("Utilisez les autres commandes disponibles pour interagir avec le chat.");
        displayPrompt();
      
      
          rl.addListener("line", (line) => {
            const encryptedMessage = encryptMessage(line);
            client.write(encryptedMessage);
          });
        });
      
      
      client.on("data", (data) => {
        const decryptedMessage = decryptMessage(data.toString().trim());
        console.log(decryptedMessage);
        displayPrompt();
      });
      client.on("end", () => {
        console.log("Déconnecté du serveur de chat");
        rl.close();
      });
      
      client.on("error", (err) => {
        console.log(`Erreur: ${err}`);
        rl.close();
      });

      // Gestionnaires d'événements et logique du client
      // ...
    } else {
      console.log("Choix invalide. Veuillez réessayer.");
      showServerListAndConnect();
    }
  });
}


