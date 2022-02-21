const express = require('express');
const router = express.Router();

router.get('/', function (_, res) {
    res.setState(200).json({
        // TODO implement leaderboard functionality (with plugin)
    });
});

module.exports = router;
