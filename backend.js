const config = require('./config.json');
const { sseSend, sseSendTo } = require('./api');
const events = require('events');
const { v4: uuidv4 } = require('uuid');

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
let uuidMap = new Map();
let steamBot;

let eventEmitter = new events.EventEmitter();

/** 
    * @returns The EventEmitter to send events to the backend directly.
    */
function getEventEmitter() {
    return eventEmitter;
}

/**
    * @returns tournament info:
    * 'state': the current tournament phase.
    * 'match': the current match count (0-indexed).
    */
function getTournamentInfo() {
    return tournament;
}

/** 
    * @returns The current tournament state/phase. Corresponds to TOURNAMENT_STATES.
    */
function getTournamentState() {
    return tournament.state;
}

/** 
    * @returns The current map state. Corresponds to MAP_STATES.
    */
function getMapState(mapId) {
    let map = mapList.find(map => map.mapId === mapId);
    if (map === undefined)
        return 0;
    return map.status;
}

/** 
    * @returns The current team information as a 4-element list. The first and third element are the 
    * players of the CT team and the second and last element are the players of the T team. The players are described by
    * their steamID64. The reason for saving the teams this way makes it easier to manage the ban phase with manageBanPhase().
    */
function getCurrentTeam() {
    return matches[tournament.match].team;
}

/** 
    * @returns A Map with additional information:
    * 'currentBanPlayer': The player who is banning right now (only set in ban phase).
*/
function getAdditionalInfo() {
    return additional;
}

/** 
    * @param steamID64 The steamID64 of the player to get the uuid for.
    * @returns The public uuid of the player.
    */
function getUUID(steamID64) {
    if (!uuidMap.contains(steamID64))
        return null;
    return uuidMap.get(steamID64);
}

/**
    * This function is for setting a new map state.
    * @param mapId This is the map id of the map to change the state of.
    * @param newState This is the state the map gets changed to. E.g. MAP_STATES.BANNED.
    */
function setMapState(mapId, newState) {
    let map = mapList.find(map => map.mapId === mapId);
    if (map === undefined) {
        console.log(`An error occoured while trying to read MapState of map with ${mapId}`);
        return;
    }
    map.status = newState;
}

/**
    * Resets the map states to MAP_STATES.NONE (0).
    */
function resetMapStates() {
    for (let mapObj of mapList) {
        mapObj.status = MAP_STATES.NONE;
    }
}

/**
    * This function gets called by the CS:GO plugin via WebSocket when a tournament is started.
    * @param players A list of player steamID64's that participate in the tournament.
    */
async function startTournament(players) {
    let team_reveal = new Promise(res => setTimeout(res, 5000));
    refreshMapList();
    computeMatches(players);
    generateUUIDs(players);
    setMatch(0);
    // send Link to players here
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

/**
    * This function is for managing the ban phase. Each player that plays in the current match gets to ban.
    * The ban phase alternates players of each team.
    * @param match The match for which the ban phase is managed.
    */
async function manageBanPhase(match) {
    let players = match.team;
    for (let player of players) {
        additional.set('currentBanPlayer', player);
        // If the player is online they will receive this SSE. If not they will query the ban state from the api anyway.
        sseSendTo(player, {}, 'DDG_EVENT_ALLOWBAN');
        await new Promise(resolve => eventEmitter.once('mapBanned', resolve));
    }
    additional.delete('currentBanPlayer');
    match.map = mapList.find(map => map.status === MAP_STATES.PICKED).mapId;
}

/**
    * This function sets the current match number.
    * @param newMatchNumber The match number the tournament has to change to.
    */
function setMatch(newMatchNumber) {
    tournament.match = newMatchNumber;
    sseSend(tournament, 'DDG_EVENT_NEWSTATE');
}

/**
    * This functions sets to tournament state.
    * @param newState The new tournament state.
    */
function setTournamentState(newState) {
    tournament.state = newState;
    sseSend(tournament, 'DDG_EVENT_NEWSTATE');
}

/** 
    * This functions bans a map from the map pool. There is no check if the map is already banned, so implement this before.
    * @param mapId The map to ban is defined by this defined by this parameter.
    */
function banCsMap(mapId) {
    setMapState(mapId, MAP_STATES.BANNED);
    sseSend({
        mapId: mapId
    }, 'DDG_EVENT_MAPBAN');
}

/**
    * This function checks if there was a map pick by banning all except one map. This is adding a
    * safety layer if there was a bug in the ban phase. Also sets the tournament state to SHOW_LEADERBOARD.
    */
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

/**
    * Function to generate the steamID64-UUID pairs for backend-client communication
    * @param steamIDs A list of steamID64's that need a UUID. Do not include spectators as they do not need a UUID.
    */
function generateUUIDs(steamIDs) {
    uuidMap = new Map();
    for (let id of steamIDs)
        uuidMap.set(id, uuidv4());
}

/**
    * Function to calculate the matches between players. Clears the match list and resets map picks for matches.
    * Does not reset the current match however!
    * @params players A list of steamID64's of the players that play in the tournament.
    */
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
            // If a team is bigger than 2 players (4 total) something has gone really really wrong.
            // This should never happen but safe is safe.
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
            // Randomize the teams so that team[0] and team[2] are CT and team[1] adn team[3] is T.
            team: game.sort((_1, _2) => 0.5 - Math.random()),
            map: null
        });
        for (let player of copy) {
            prio[player]++;
        }
    }
}

/**
    * Function to refresh the available map list from the config.json file.
    * @returns The new available map list generated from the config.
    */
function refreshMapList() {
    if (config.maps.length !== 5) {
        console.log('You can only provide 5 maps. This is a wingman tournament after all.');
        throw 'NotFiveMapsError';
    }
    for (let mapIndex in config.maps) {
        mapList.push({
            display_name: config.maps[mapIndex].mapName,
            workshop: config.maps[mapIndex].workshop,
            mapId: mapIndex,
            status: 0
        });
    }
    return mapList;
}

/**
    * @returns The available map list of the form: 
    * [{
    *   display_name: string,
    *   workshop: bool,
    *   mapId: int,
    *   status: int | MAP_STATES
    * },...]
    */
function getMapList() {
    return mapList;
}

function init(bot) {
    steamBot = bot;
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
    getMapList: getMapList,
    init: init
};
