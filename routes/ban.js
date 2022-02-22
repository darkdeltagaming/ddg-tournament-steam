const express = require('express');
const router = express.Router();
const { setMapState, dispatchMapBannedEvent } = require('../backend');

router.post('/', function (req, res) {
    // TODO implement map banning with website and SSE
    
    //check if mapId is correct
    if (req.body.mapId < 0 || req.body.mapId > 5)
        return;
    setMapState(req.body.mapId, 1);
    dispatchMapBannedEvent(req.body.mapId);
    res.status(404);
});

module.exports = router;
