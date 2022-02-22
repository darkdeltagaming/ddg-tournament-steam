const express = require('express');
const router = express.Router();

/* Leaderboard stats
    -> Kills
    -> Deaths
    -> Points
*/

function getLeaderboard() {
    return [];
}

router.get('/', function (_, res) {
    res.status(200).json({
        // TODO implement leaderboard functionality (with plugin)
        leaderboard: getLeaderboard()
    });
});

module.exports = router;
