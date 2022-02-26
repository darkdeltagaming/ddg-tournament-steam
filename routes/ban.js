const express = require('express');
const router = express.Router();
const { banCsMap, TOURNAMENT_STATES, 
    getTournamentState, pickMapIfPossible, getEventEmitter, getMapState } = require('../backend');

router.post('/', function (req, res) {
    // TODO add server side userId check
    // check if is map banning phase
    if (getTournamentState() !== TOURNAMENT_STATES.MAP_BANNING)
        return;
    // check if mapId is correct
    let mapId = req.body.mapId;
    if (typeof mapId === 'undefined')
        return;
    mapId = parseInt(mapId);
    if ((mapId < 0 || mapId > 5) 
        && getMapState(req.body))
        return;
    banCsMap(req.body.mapId);

    // check if a map pick was achieved with the last ban
    pickMapIfPossible();
    getEventEmitter().emit('mapBanned');
    res.status(200).send('{}');
});

module.exports = router;
