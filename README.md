# SAE302
SAE développer des applications communicantes 

# Node.js Chat Application

Une application de chat simple et légère développée en utilisant Node.js, offrant une communication en temps réel entre plusieurs utilisateurs. L'application comprend des fonctionnalités telles que les salons de discussion, les messages privés, l'authentification des utilisateurs et la découverte automatique des serveurs sur le réseau local.

## Prérequis

- Node.js (version recommandée : 14.x ou supérieure)
- NPM (généralement inclus avec Node.js)

## Installation

1. Clonez ce dépôt :

```bash
git clone https://github.com/apanchoo/nodejs-chat-application.git
```


2. Accédez au dossier du projet et installez les dépendances :

```bash
cd nodejs-chat-application
npm install
```

## Utilisation

### Serveur

Pour démarrer le serveur de chat, exécutez la commande suivante dans le dossier du projet :

```bash
node server.js
```

Le serveur commencera à écouter les connexions sur un port disponible et diffusera sa présence sur le réseau local.

### Client

Pour démarrer le client de chat, exécutez la commande suivante dans un autre terminal (toujours dans le dossier du projet) :

```bash
node client.js
```


Le client recherchera les serveurs disponibles sur le réseau local et vous permettra de choisir un serveur pour vous connecter. Une fois connecté, vous devrez vous inscrire ou vous connecter pour commencer à discuter.

## Fonctionnalités

- Salons de discussion : les utilisateurs peuvent rejoindre des salons de discussion publics pour discuter avec d'autres utilisateurs.
- Messages privés : les utilisateurs peuvent envoyer des messages privés à d'autres utilisateurs en utilisant la commande `/private`.
- Authentification des utilisateurs : les utilisateurs doivent s'inscrire et se connecter pour accéder aux fonctionnalités de chat.
- Découverte automatique des serveurs : les clients peuvent découvrir les serveurs de chat disponibles sur le réseau local en utilisant le protocole UDP et la diffusion (broadcast).

## Licence

Ce projet est sous licence MIT. Consultez le fichier `LICENSE` pour plus d'informations.

