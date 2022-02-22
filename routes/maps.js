const express = require('express');
const router = express.Router();
const config = require('../config.json').maps;
const { getMapState } = require('../backend');

var mapList = [];

function refreshMapList() {
    mapList = [];
    if (config.length > 5) {
        console.log('You can only provide 5 maps. This is a wingman tournament after all.');
        throw 'ToManyMapsError';
    }
    for (var map in config) {
        mapList.push({
            display_name: config[map].mapName,
            mapId: map,
            status: getMapState(map)
        });
    }
    return mapList;
}

router.get('/', function (_, res) {
    refreshMapList();
    res.status(200).json({
        maps: mapList
    });
});


module.exports = router;
