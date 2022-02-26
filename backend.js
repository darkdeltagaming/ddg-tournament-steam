const config = require('./config.json');
const { sseSend, sseSendTo } = require('./api');
const events = require('events');

const TOURNAMENT_STATES = {
    NONE: -2,
    REVEAL_TEAM: 0,
    MAP_BANNING: 1,
    SHOW_MAP_OVERVIEW: 2,
    MATCH_PLAYING: 3,
    SHOW_LEADERBOARD: 4
}

const MAP_STATES = {
    NONE: 0,
    BANNED: 1,
    PICKED: 3
}

let mapList = [];
let matches = [];
let tournament = {
    state: TOURNAMENT_STATES.MAP_BANNING,
    match: 0
};
let additional = new Map();

let eventEmitter = new events.EventEmitter();

function getEventEmitter() {
    return eventEmitter;
}

function getTournamentInfo() {
    return tournament;
}

function getTournamentState() {
    return tournament.state;
}

function getMapState(mapId) {
    let map = mapList.find(map => map.mapId === mapId);
    if (map === undefined)
        return 0;
    return map.status;
}

function getCurrentTeam() {
    return matches[tournament.match].team;
}

/** 
    * @returns a Map with additional information:
    * 'currentBanPlayer': The player who is banning right now (only set in ban phase)
    * 
*/
function getAdditionalInfo() {
    return additional;
}

function setMapState(mapId, newState) {
    let map = mapList.find(map => map.mapId === mapId);
    if (map === undefined) {
        console.log(`An error occoured while trying to read MapState of map with ${mapId}`);
        return;
    }
    map.status = newState;
}

function resetMapStates() {
    for (let mapObj of mapList) {
        mapObj.status = 0;
    }
}

// this function gets called by the CS:GO plugin when a tournament is started.
async function startTournament(players) {
    let team_reveal = new Promise(res => setTimeout(res, 5000));
    refreshMapList();
    computeMatches(players);
    setMatch(0);
    additional = new Map();
    for (let match of matches) {
        setTournamentState(TOURNAMENT_STATES.REVEAL_TEAM);
        await team_reveal;
        setTournamentState(TOURNAMENT_STATES.MAP_BANNING);
        await manageBanPhase(match);
        // launch match on server and do other stuff
        // also do leaderboard logic
        setTournamentState(TOURNAMENT_STATES.SHOW_LEADERBOARD);
        let delay = new Promise(res => setTimeout(res, 15000));
        await delay;
        if (tournament.match + 1 === matches.length)
            break;
        console.log('Starting next round');
        resetMapStates();
        setMatch(tournament.match + 1);
    }
}

async function manageBanPhase(match) {
    let players = match.team;
    for (let player of players) {
        additional.set('currentBanPlayer', player);
        console.log("player:" + player);
        if (!sseSendTo(player, {}, 'DDG_EVENT_ALLOWBAN'))
            console.log('Waiting for player connection');
        await new Promise(resolve => eventEmitter.on('mapBanned', resolve));
    }
    console.log('ban phase done');
    additional.delete('currentBanPlayer');
    match.map = mapList.find(map => map.status === MAP_STATES.PICKED).mapId;
}

function setMatch(newMatchNumber) {
    tournament.match = newMatchNumber;
    sseSend(tournament, 'DDG_EVENT_NEWSTATE');
}

function setTournamentState(newState) {
    tournament.state = newState;
    sseSend(tournament, 'DDG_EVENT_NEWSTATE');
}

function banCsMap(mapId) {
    setMapState(mapId, MAP_STATES.BANNED);
    sseSend({
        mapId: mapId
    }, 'DDG_EVENT_MAPBAN');
}

function pickMapIfPossible() {
    let pickCanidates = mapList.filter(mapObj => mapObj.status === MAP_STATES.NONE);
    if (pickCanidates.length === 1) {
        setMapState(pickCanidates[0].mapId, MAP_STATES.PICKED);
        sseSend({
            mapId: pickCanidates[0].mapId
        }, 'DDG_EVENT_MAPPICK');

        setTournamentState(TOURNAMENT_STATES.SHOW_LEADERBOARD);
    }
}

function computeMatches(players) {
    const cap = players.length - 4;
    matches = [];
    let prio = {};
    for (let player of players) {
        prio[player] = 0;
    }
    while (Object.entries(prio).filter(([_, v]) => v !== cap).length) {
        let game = [];
        let copy = [...players];
        for (let [player, _] of Object.entries(prio).filter(([_, v]) => v === cap)) {
            if (game.length > 4) {
                console.log('PANIC');
                throw new 'MatchTooBigError';
            }
            game.push(player);
            copy.splice(copy.indexOf(player), 1);
        }
        while (game.length < 4) {
            let randomIdx = Math.floor(Math.random() * copy.length);
            game.push(copy[randomIdx]);
            copy.splice(randomIdx, 1);
        }
        matches.push({
            team: game.sort((_1, _2) => 0.5 - Math.random()),
            map: null
        });
        for (let player of copy) {
            prio[player]++;
        }
    }
}

function refreshMapList() {
    if (config.maps.length !== 5) {
        console.log('You can only provide 5 maps. This is a wingman tournament after all.');
        throw 'NotFiveMapsError';
    }
    for (let mapIndex in config.maps) {
        mapList.push({
            display_name: config.maps[mapIndex].mapName,
            mapId: mapIndex,
            status: 0
        });
    }
    return mapList;
}

function getMapList() {
    return mapList;
}

module.exports = {
    TOURNAMENT_STATES: TOURNAMENT_STATES,
    MAP_STATES: MAP_STATES,
    getEventEmitter: getEventEmitter,
    startTournament: startTournament,
    getTournamentInfo: getTournamentInfo,
    getMapState: getMapState,
    getCurrentTeam: getCurrentTeam,
    getTournamentState: getTournamentState,
    getAdditionalInfo: getAdditionalInfo,
    setMapState: setMapState,
    resetMapStates: resetMapStates,
    banCsMap: banCsMap,
    pickMapIfPossible: pickMapIfPossible,
    refreshMapList: refreshMapList,
    getMapList: getMapList
};
