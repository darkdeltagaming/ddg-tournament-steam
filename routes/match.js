const express = require('express');
const { pickMatches, getMapForMatch } = require('../backend');
const router = express.Router();

function getTeams(_matchNr) {
    return {
        ct: [],
        t: []
    }
}

router.get('/:nr', function (req, res) {
    matchNr = parseInt(req.params.nr);
    res.status(200).json({
        teams: getTeams(matchNr),
        map: getMapForMatch(matchNr)
    });
});

module.exports = router;
