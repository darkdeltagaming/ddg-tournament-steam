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

    app.listen(port, () => console.log(`Listening on port: ${port}`));
}

/**
    * Custom implementation of SSEs to enable one-to-one events.
    */
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

/**
    * Function to send a SSE to one and only one specific client.
    * @param clientId The client that receives the message. Matches the player uuid.
    * @param data The data to be sent as a JS object. NOT JSON!
    * @param event_name Optional parameter to define an event name.
    */
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

/**
    * Function to send a SSE to every client connected to the event stream.
    * @param data The data to be sent as a JS object. NOT JSON!
    * @param event_name Optional parameter to define an event name.
    */
function sseSend(data, event_name) {
    if (typeof event_name === 'undefined')
        clients.forEach(client => client.eventStream.write(`data: ${JSON.stringify(data)}\n\n`))
    else
        clients.forEach(client => client.eventStream
            .write(`event: ${event_name}\ndata: ${JSON.stringify(data)}\n\n`));
}

/** 
    * Function to check if a client is connected.
    * @param clientId The clientId of the client to check for.
    * @returns true if client is online, false otherwise.
    */
function isConnected(clientId) {
    return typeof clients.find(client => client.id == clientId) === 'undefined';
}

module.exports = {
    init:init,
    sseSendTo: sseSendTo,
    sseSend: sseSend,
    isConnected: isConnected
};
