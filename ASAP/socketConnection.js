import { default as config } from "./config.js";
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

function getToken(my_name) {
    
    // Determine the friend's name based on the current agent's name.
    if (my_name === 'agent_1') {
        friend_name = 'agent_2';
    } else {
        friend_name = 'agent_1';
    }

    // Return the token corresponding to the agent's name.
    return config.tokens[my_name] || 'Token not found';
}

// Variable to store the friend's name.
var friend_name = "";

// Extract the arguments passed to the process.
const args = process.argv.slice(2);

// Current agent's name obtained from the arguments.
const mode = args[0];
const my_name = args[1];

// Print the agent's name and the obtained token.
console.log('AGENT: ', my_name, '\nTOKEN: ', getToken(my_name) + '\n');

// Obtain the current agent's token.
const token = getToken(my_name);

const client = new DeliverooApi(config.host, token);
client.onConnect(() => console.log("socket", client.socket.id));
client.onDisconnect(() => console.log("disconnected", client.socket.id));

export { client, friend_name, mode };
