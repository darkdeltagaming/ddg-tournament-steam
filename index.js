const backend = require('./backend');
const api = require('./api');
const socket = require('./socket');
const steamBot = require('./steam');

// steamBot.init(backend);
// backend.init(steamBot);
socket.init(backend, 22121);
api.init();
