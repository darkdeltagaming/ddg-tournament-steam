const SteamUser = require('steam-user');
const config = require('./config.json');

const WebSocketServer = require('websocket').server;

// WebSocket Handling
const socket = new WebSocketServer();

socket.on('request', (request) => {
    const isConnectionAllowed = (_origin) => {
        return true;
    };

    if (!isConnectionAllowed(request.origin)) {
        request.reject();
        return;
    }

    const connection = request.accept('echo-protocol' , request.origin);
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
        }
    });
    connection.on('close', function(_reasonCode, _description) {
        console.log('Connection to ' + connection.remoteAddress + ' closed.');
    });
});

// Steam Client Handling
const client = new SteamUser();

if (config.accountName === '' || config.password === '') {
    console.log('Please provide a steam account for the steam bot. No accountName or password given.');
    throw 'CredentialsMissingError';
}

const logOnOptions = {
    accountName: config.accountName,
    password: config.password,
};

client.logOn(logOnOptions);

client.on('loggedOn', () => {
    console.log('Logged into steam account: ' + config.accountName);
    
    client.setPersona(SteamUser.EPersonaState.Online);
});

client.on('friendsList', () => {
    return;
});

client.on('friendRelationship', (steamid, relationship) => {
    // received friend request
    if (relationship === SteamUser.EFriendRelationship.RequestRecipient) {
        console.log('Friend request received from ' + steamid);
        client.removeFriend(steamid);
    } else if (relationship === SteamUser.EFriendRelationship.Friend) {
        client.chatMessage(steamid, 'Hallo :D');
    }
});
