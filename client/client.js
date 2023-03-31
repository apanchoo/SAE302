const net = require("net");
const readline = require("readline");
const port = 5000;
const host = "127.0.0.1";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const client = net.createConnection(port, host, () => {
  console.log("Connecté au serveur de chat!");

  rl.question("Entrez votre pseudo: ", (nickname) => {
    client.write(`/nick ${nickname}`);
    console.log(`Pseudo défini sur ${nickname}`);

    rl.addListener("line", (line) => {
      client.write(line);
    });
  });
});

client.on("data", (data) => {
  console.log(data.toString().trim());
});

client.on("end", () => {
  console.log("Déconnecté du serveur de chat");
  rl.close();
});

client.on("error", (err) => {
  console.log(`Erreur: ${err}`);
  rl.close();
});

