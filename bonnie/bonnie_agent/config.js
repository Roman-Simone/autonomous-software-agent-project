import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

var friend_name = "";

function getToken(agent) {
    const tokens = {
        'bonnie': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE1ZmQzN2MxZjM5IiwibmFtZSI6ImJvbm5pZSIsImlhdCI6MTcxNTAwNTQzMH0.Z0WSq1N0xFIc1XRv2EulR12nYKfHFzh0cnJ9hPmJHnQ',   // bonnie
        'god': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMyMTVmZDM3YzFmIiwibmFtZSI6ImdvZCIsImlhdCI6MTcxNTAwNTM2NX0.mTuS0kYQuqqQE0ttBSfCuBkgk_vwKyy0WykWR8YbCPc'    // god 
    };

    if (agent == 'bonnie') {
        friend_name = 'god';
    } else {
        friend_name = 'bonnie';
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