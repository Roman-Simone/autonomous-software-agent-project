import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

var friend_name = "";

function getToken(agent) {
    const tokens = {
        'agent_1': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkwNmNiOWZjNTJkIiwibmFtZSI6ImFnZW50XzEiLCJpYXQiOjE3MjA1MDg1OTl9.AKtfhbXdLaqcZ0d_IhVRU1GAgKTPaAECjKYhtWNR7AM',   // bonnie
        'agent_2': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZjYjlmYzUyZGVjIiwibmFtZSI6ImFnZW50XzIiLCJpYXQiOjE3MjA1MDg2NjJ9.tLgCugK--NQzW0EKFtTMt_XAs4ucktTaK9ZxZJctzFM'    // god 
    };

    if (agent == 'agent_1') {
        friend_name = 'agent_2';
    } else {
        friend_name = 'agent_1';
    }

    return tokens[agent] || 'Token non trovato';
}

const args = process.argv.slice(2); 

const agent = args[0];

console.log('Agent:', agent, " token:", getToken(agent));
const token = getToken(agent);

const client = new DeliverooApi(
    'http://localhost:8080',
    token
)

console.log("client configured, friend name: ", friend_name)

export { client, friend_name };