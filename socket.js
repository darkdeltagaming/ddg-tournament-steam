const WebSocketClient = require('websocket').client;

const client = new WebSocketClient();
let serverResponsive;

function init(backend, WEBSOCKET_PORT) {

    client.on('connectFailed', err => {
        console.log(`Connect Error: ${err.toString()}`);
    });

    client.on('connect', connection => {
        console.log('Websocket connected');

        connection.on('error', function(error) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', async () => {
            // try a reconnect if the CS:GO server is updating / down
            console.log('Websocket Connection closed. Trying to reconnect every 5 seconds.');
            while (!connection.connected) {
                connection.connect('ws://localhost:' + WEBSOCKET_PORT, 'echo-protocol');
                await new Promise(res => setTimeout(res, 5000));
            }
        });
        connection.on('message', function(message) {
            console.log('Received message of type ' + message.type);
            if (message.type === 'utf8') {
                if (message.utf8Data === 'pong') {
                    serverResponsive = true;
                } else if (message.utf8Data.startsWith('tournament:START/')) { // if noone is online in the CS:GO server the message would be 'tournament:START'
                    // tournament:START/STEAM_ID1+STEAM_ID2+STEAM_ID3+...
                    let playerData = (message.utf8Data.split('/')[1]).split('+');
                    // if there are too few players on the server we need to stop as computing matches will fail otherwise
                    if (playerData.length < 4)
                        return;
                    backend.startTournament(playerData);
                } else if (message.utf8Data.startsWith('tournament:STOP/')) {
                    if (backend.getTournamentInfo().state === backend.TOURNAMENT_STATES.NONE)
                        return;
                }
                console.log("Received: '" + message.utf8Data + "'");
            }
        });

        function sendPing() {
            if (connection.connected && serverResponsive) {
                serverResponsive = false;
                connection.sendUTF('ping');
                setTimeout(sendPing, 2500);
            } else {
                if (connection.connected)
                    connection.close();
            }
        }
        serverResponsive = true;
        sendPing();
    });

    client.connect('ws://localhost:' + WEBSOCKET_PORT, 'echo-protocol');
}

module.exports = new exportSocket();
function exportSocket() {
    return {
        init:init
    };
};
