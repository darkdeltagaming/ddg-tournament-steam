const SteamUser = require('steam-user');
const config = require('./config.json').steam;

function init() {
    const client = new SteamUser();

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
        return;
    });

    client.on('friendRelationship', (steamid, relationship) => {
        // received friend request
        if (relationship === SteamUser.EFriendRelationship.RequestRecipient) {
            console.log('Friend request received from ' + steamid);
            client.removeFriend(steamid);
        } else if (relationship === SteamUser.EFriendRelationship.Friend) {
            client.chatMessage(steamid, 'Hallo :D');
        }
    });
}
module.exports = new exportSteamBot();
function exportSteamBot() {
    return {
        init:init
    };
};
