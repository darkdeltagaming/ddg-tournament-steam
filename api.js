const express = require('express');
const config = require('./config.json');

function init() {
    const app = express();
    const port = config.api.port || 5500;
    
    const match = require('./routes/match');
    const maps = require('./routes/maps');
    const mapImage = require('./routes/mapImage');
    const leaderboard = require('./routes/leaderboard');
    const ban = require('./routes/ban');

    app.use(express.json());
    app.use('/match', match);
    app.use('/maps', maps);
    app.use('/mapImage', mapImage);
    app.use('/leaderboard', leaderboard);
    app.use('/ban', ban);

    app.listen(port, () => console.log(`Listening on port: ${port}`));
}

module.exports = new exportApi();
function exportApi() { 
    return {
        init:init
    };
};
