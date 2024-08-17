import { Map } from "./map.js";
import { AgentData } from "./agentData.js";
import { client } from "../socketConnection.js";
import { from_json_to_matrix, existAgentById } from "./utilsBelief.js";


var MyData = new AgentData();       // Instance of AgentData for the agent itself
var CollaboratorData = new AgentData();     // Instance of AgentData for the collaborator agent 
var MyMap = new Map();        // Instance of Map for the agent itself
var movement_duration;      // Movement duration of the agent used only in belief.js
var parcel_decading_interval;   // Parcel decading interval of the agent used only in belief.js
const start = Date.now();   // Start time of the agent used only in belief.js

// Update the position of the agent
client.onYou(({ id, name, x, y, score }) => {

    // if first time, set the id and name
    if (MyData.id == "" || MyData.id == "") {
        MyData.id = id;
        MyData.name = name;
    }
    MyData.pos.x = Math.round(x);
    MyData.pos.y = Math.round(y);
})

// Update the parcels perceived by the agent
client.onParcelsSensing((perceived_parcels) => {

    let UpdateParcel = [];  // Array to store the updated parcels
    let now = Date.now();   // Get the current time

    // Take the perceived parcels 
    for (let perceived_parcel of perceived_parcels) {
        perceived_parcel.timestamp = now;
        UpdateParcel.push(perceived_parcel);
    }

    // Update the parcels seen in the past and now not seen (due to distance)
    for (let parcel of MyData.parcels) {
        if (!UpdateParcel.some(p => p.id == parcel.id)) {

            let diff_time = now - parcel.timestamp;
            parcel.reward = parcel.reward - (diff_time / parcel_decading_interval);

            if (parcel.reward >= 2 && diff_time < (15 * 1000)) {
                parcel.timestamp = now;
                UpdateParcel.push(parcel);
            }
        }
    }

    // Reset and update the parcels array
    MyData.parcels = []
    MyData.parcels = JSON.parse(JSON.stringify(UpdateParcel));
});

// Update the original map and the map perceived by the agent ONLY FIRST TIME
client.onMap((width, height, tiles) => {

    MyMap.original_map = from_json_to_matrix(width, height, tiles);

    MyMap.map = from_json_to_matrix(width, height, tiles);

    MyMap.deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({ x: t.x, y: t.y }));   // Delivery coordinates

    MyMap.spawningCoordinates = tiles.filter(t => t.parcelSpawner).map(t => ({ x: t.x, y: t.y, score: MyMap.computeSpawningScore(t.x, t.y) }));  // Spawning coordinates

});

// Take the information about the level configuration
client.onConfig((config) => {

    parcel_decading_interval = config.PARCEL_DECADING_INTERVAL;

    movement_duration = config.MOVEMENT_DURATION;

    if (config.PARCEL_DECADING_INTERVAL == "infinite") {
        MyMap.parcel_observation_distance = Number.MAX_VALUE;
    }
    else {
        MyMap.parcel_observation_distance = config.PARCELS_OBSERVATION_DISTANCE;
    }

    MyMap.parcel_reward_avg = config.PARCEL_REWARD_AVG;

    if (parcel_decading_interval == "infinite") {
        parcel_decading_interval = Number.MAX_VALUE;
    } else {
        parcel_decading_interval = parseInt(parcel_decading_interval.slice(0, -1)) * 1000;
    }

    // Calculate the frequency of the parcels decading for the agent (movement/decading_interval)
    MyMap.decade_frequency = movement_duration / parcel_decading_interval;

});

// Update the adversary agents
client.onAgentsSensing((agents) => {

    // Reset the map with the original values
    MyMap.resetMap(-1);

    let timestamp = Date.now() - start;

    for (let a of agents) {
        a.timestamp = timestamp
        // MyMap.updateMap(a.x, a.y, -1);  // NOt necessary We'll do it later

        if (!MyData.adversaryAgents.some(agent => existAgentById(a.id, agent.id))) {
            a.direction = 'none';
            MyData.adversaryAgents.push(a)
        }
        else {
            //Calculate the direction of the adversary agent and set the first tile in direction as wall
            let previousIndex = MyData.adversaryAgents.findIndex(agent => existAgentById(a.id, agent.id));
            let previous = MyData.adversaryAgents[previousIndex];

            if (timestamp - previous.timestamp < movement_duration * 3) {
                if (previous.x < a.x) {
                    a.direction = 'right';
                    MyMap.updateMap(a.x + 1, a.y, -1);
                } else if (previous.x > a.x) {
                    a.direction = 'left';
                    MyMap.updateMap(a.x - 1, a.y, -1);
                } else if (previous.y < a.y) {
                    a.direction = 'up';
                    MyMap.updateMap(a.x, a.y + 1, -1);
                } else if (previous.y > a.y) {
                    a.direction = 'down';
                    MyMap.updateMap(a.x, a.y - 1, -1);
                } else {
                    a.direction = 'none';
                }
            }
            MyData.adversaryAgents.splice(previousIndex, 1, a);
        }
    }
    for (let a of MyData.adversaryAgents) {
        MyMap.updateMap(a.x, a.y, -1);      // Set the adversary agent position on the map as wall
    }
})


export { CollaboratorData, MyData, MyMap };