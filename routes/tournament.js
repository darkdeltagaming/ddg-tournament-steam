const express = require('express');
const router = express.Router();
const { getTournamentInfo } = require('../backend');

router.get('/', function (_, res) {
    res.status(200).json(getTournamentInfo());
});


module.exports = router;
