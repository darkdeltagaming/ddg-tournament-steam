const SteamUser = require('steam-user');
const config = require('./config.json').steam;

let client = new SteamUser();
const myFriendsLoaded = new Promise(res => {});
let backend;

function init(_backend) {
    client = new SteamUser();
    backend = _backend;
    if (config.accountName === '' || config.password === '') {
        console.log('Please provide a steam account for the steam bot. No accountName or password given.');
        throw 'CredentialsMissingError';
    }

    const logOnOptions = {
        accountName: config.accountName,
        password: config.password,
    };

    client.logOn(logOnOptions);

    client.on('loggedOn', () => {
        console.log('Logged into steam account: ' + config.accountName);
        
        client.setPersona(SteamUser.EPersonaState.Online);
    });

    client.on('friendsList', () => {
        myFriendsLoaded.resolve();
    });

    client.on('friendRelationship', (steamid, relationship) => {
        if (relationship === SteamUser.EFriendRelationship.RequestRecipient) {
            // received friend requests always get rejected.
            client.removeFriend(steamid);
        } else if (relationship === SteamUser.EFriendRelationship.Friend) {
            // user with steamid accepted our frind request.
            client.chatMessage(steamid, 'Hallo :D');
        }
    });
}

/** 
    * Sends a friend request to a user if not already a friend.
    *
    * @param steamID64: the steamID64 of the player receiving the friend request.
    */
function addFriend(steamID64) {
    client.addFriend(steamID64);
}

/** 
    * Sends the player specific URLs to the website via the steam bot.
    *
    * @param players: list of players to send the URLs to.
    * @returns displayNames: a Map of player steamID64 to their steam display name.
    */
async function sendURLs(players) {
    if (players.length !== urls.length) {
        console.log('Error in steam.js:45 (sendURLs): player list length does not match url list length.');
        return false;
    }
    await myFriendsLoaded;
    let displayNames = new Map();
    let personas = client.getPersonas(players);
    for (let i = 0; i < players.length; i++) {
        let player = players[i];
        let uuid = backend.getUUID(player);
        if (uuid === null)
            return;
        let url = `https://turnier.norysq.com/?uid=${uuid}`;
        client.chatMessage(player, url);
        displayNames.set(player, personas[player] ? personas[player].player_name : "[" + player + "]");
    }
    return displayNames;
}

module.exports = new exportSteamBot();
function exportSteamBot() {
    return {
        sendURLs: sendURLs,
        addFriend: addFriend,
        init:init
    };
};
