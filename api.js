const express = require('express');
const cors = require('cors');
const SSE = require('express-sse');
const config = require('./config.json');

let sse;

function init() {
    const app = express();
    const port = config.api.port || 5500;
    app.use(cors());
    app.use(express.json());

    sse = new SSE();
    app.get('/events', sse.init);
    
    const match = require('./routes/match');
    const maps = require('./routes/maps');
    const mapImage = require('./routes/mapImage');
    const leaderboard = require('./routes/leaderboard');
    const ban = require('./routes/ban');

    app.use('/match', match);
    app.use('/maps', maps);
    app.use('/mapImage', mapImage);
    app.use('/leaderboard', leaderboard);
    app.use('/ban', ban);

    app.listen(port, () => console.log(`Listening on port: ${port}`));
}

function getSSE() {
    return sse;
}

module.exports = {
    init:init,
    getSSE:getSSE
};
