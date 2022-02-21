const WebSocketServer = require('websocket').server;

function init() {
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
}

module.exports = new exportSocket();
function exportSocket() {
    return {
        init:init
    };
};
