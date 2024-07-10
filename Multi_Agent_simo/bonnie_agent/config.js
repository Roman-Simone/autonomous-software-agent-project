import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

var friend_name = "";

function getToken(my_name) {
    const tokens = {
        'agent_1': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkwNmNiOWZjNTJkIiwibmFtZSI6ImFnZW50XzEiLCJpYXQiOjE3MjA1MDg1OTl9.AKtfhbXdLaqcZ0d_IhVRU1GAgKTPaAECjKYhtWNR7AM',   // bonnie
        'agent_2': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZjYjlmYzUyZGVjIiwibmFtZSI6ImFnZW50XzIiLCJpYXQiOjE3MjA1MDg2NjJ9.tLgCugK--NQzW0EKFtTMt_XAs4ucktTaK9ZxZJctzFM'    // god 
    };

    if (my_name == 'agent_1') {
        friend_name = 'agent_2';
    } else {
        friend_name = 'agent_1';
    }

    return tokens[my_name] || 'Token non trovato';
}

const args = process.argv.slice(2); 

const my_name = args[0];

console.log('Agent:', my_name, " token:", getToken(my_name));
const token = getToken(my_name);

const client = new DeliverooApi(
    'http://localhost:8080',
    token
)


export { client, friend_name };