const { getSSE } = require('./api');

let mapStates = new Map();

function getMapState(mapId) {
    if (mapStates.has(mapId))
        return mapStates.get(mapId);
    return 0;
}

function setMapState(mapId, newState) {
    mapStates.set(mapId, newState);
}

function resetMapStates() {
    mapStates = new Map();
}

function dispatchMapBannedEvent(mapId) {
    getSSE().send({
        mapId: mapId
    }, 'DDG_EVENT_MAPBAN');
}

function pickMatchTeams() {
    return [];
}

function addMap(mapId) {
    matchMaps.push(mapId);
}

function getMapForMatch(matchNr) {
    return matchMaps[matchNr];
}

module.exports = {
    getMapState: getMapState,
    setMapState: setMapState,
    resetMapStates: resetMapStates,
    dispatchMapBannedEvent: dispatchMapBannedEvent,
    pickMatchTeams: pickMatchTeams,
    addMap: addMap,
    getMapForMatch: getMapForMatch
};
