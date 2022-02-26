const express = require('express');
const { getCurrentTeam, getMapForMatch } = require('../backend');
const router = express.Router();

router.get('/:nr', function (req, res) {
    matchNr = parseInt(req.params.nr);
    if (req.params.nr === null) {
        res.status(200).json({
            teams: getCurrentTeam(),
            map: getCurrentMap()
        });
    } else {
        res.status(200).json({
            teams: getTeamForMatch(matchNr),
            map: getMapForMatch(matchNr)
        });
    }
});

module.exports = router;
