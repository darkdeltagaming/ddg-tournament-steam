const express = require('express');
const cors = require('cors');
const config = require('./config.json');

let clients = [];

function init() {
    const app = express();
    const port = config.api.port || 5500;
    const corsOptions = {
        // adjust to needs before production
        origin: ['http://turnier.norysq.com', 'http://localhost:5000'],
        optionSuccessStatus: 200
    }
    app.use(cors(corsOptions));
    app.use(express.json());

    app.get('/events/:uid', sseHandler);
    
    const match = require('./routes/match');
    const maps = require('./routes/maps');
    const mapImage = require('./routes/mapImage');
    const leaderboard = require('./routes/leaderboard');
    const ban = require('./routes/ban');
    const allowBan = require('./routes/allowBan');
    const tournament = require('./routes/tournament');

    app.use('/match', match);
    app.use('/maps', maps);
    app.use('/mapImage', mapImage);
    app.use('/leaderboard', leaderboard);
    app.use('/ban', ban);
    app.use('/tournament', tournament);
    app.use('/allowBan', allowBan);

    const { startTournament } = require('./backend');
    startTournament(config.players);

    app.listen(port, () => console.log(`Listening on port: ${port}`));
}

function sseHandler(req, res, _next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    }
    if (req.params.uid === null) {
        res.writeHead(403);
        res.close();
        return;
    }
    res.writeHead(200, headers);
    const clientId = req.params.uid;

    const newClient = {
        id: clientId,
        eventStream: res
    }
    clients.push(newClient);
    
    console.log('Connect Client with id ' + clientId);
    console.log(clients.length);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
}

function sseSendTo(clientId, data, event_name) {
    if (isConnected(clientId))
        return false;
    if (typeof event_name === 'undefined')
        clients.find(client => client.id == clientId).eventStream.write(`data: ${JSON.stringify(data)}\n\n`);
    else
        clients.find(client => client.id == clientId).eventStream
            .write(`event: ${event_name}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
}

function sseSend(data, event_name) {
    if (typeof event_name === 'undefined')
        clients.forEach(client => client.eventStream.write(`data: ${JSON.stringify(data)}\n\n`))
    else
        clients.forEach(client => client.eventStream
            .write(`event: ${event_name}\ndata: ${JSON.stringify(data)}\n\n`));
}

function isConnected(clientId) {
    return typeof clients.find(client => client.id == clientId) === 'undefined';
}

module.exports = {
    init:init,
    sseSendTo: sseSendTo,
    sseSend: sseSend,
    isConnected: isConnected
};
