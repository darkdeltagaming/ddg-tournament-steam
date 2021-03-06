const express = require('express');
const router = express.Router();
const { getMapList } = require('../backend');

router.get('/', function (_, res) {
    res.status(200).json({
        maps: getMapList()
    });
});


module.exports = router;
