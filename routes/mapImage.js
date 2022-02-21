const express = require('express');
const { dirname } = require('path');
const router = express.Router();

const rootDir = dirname(require.main.filename);

router.get('/:mapId', function (req, res) {
    res.sendFile(rootDir + '/images/' + parseInt(req.params.mapId) + '.png');
});

module.exports = router;
