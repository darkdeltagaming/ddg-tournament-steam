const express = require('express');
const router = express.Router();
const { getTournamentState, TOURNAMENT_STATES, getAdditionalInfo } = require('../backend');

router.get('/:uid', function (req, res) {
    if (getTournamentState() !== TOURNAMENT_STATES.MAP_BANNING)
        return;
    let player = getAdditionalInfo().get('currentBanPlayer');
    if (player == req.params.uid) {
        res.status(200).json(1);
        return;
    }
    res.status(200).json(0);
});

module.exports = router;
