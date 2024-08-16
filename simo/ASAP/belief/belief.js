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
var malus; // Malus used only in belief.js

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

    let UpdateParcel = [];
    let now = Date.now();

    // Aggiorna i pacchi percepiti con il timestamp attuale
    for (let perceived_parcel of perceived_parcels) {
        perceived_parcel.timestamp = now;
        UpdateParcel.push(perceived_parcel);
        // console.log(perceived_parcel)
    }

    // Aggiorna i pacchi esistenti e calcola il nuovo reward
    for (let parcel of MyData.parcels) {
        if (!UpdateParcel.some(p => p.id == parcel.id)) {

            let diff_time = now - parcel.timestamp;
            parcel.reward = parcel.reward - Math.floor(diff_time / parcel_decading_interval - malus);

            if (parcel.reward >= 2 && diff_time < 15 * 1000) {
                parcel.timestamp = now;
                UpdateParcel.push(parcel);
                console.log("My POS: ", MyData.pos)
                console.log("Parcel POS: ", parcel.x," ", parcel.y, " ", parcel.reward)
            }
        }
    }

    MyData.parcels = []
    // Copia i nuovi pacchi nei pacchi dell'agente
    MyData.parcels = JSON.parse(JSON.stringify(UpdateParcel));
    console.log(MyData.parcels.length)
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

    MyMap.parcel_observation_distance = config.PARCELS_OBSERVATION_DISTANCE;

    MyMap.parcel_reward_avg = config.PARCEL_REWARD_AVG;
    malus = MyMap.parcel_reward_avg / 7

    if (parcel_decading_interval == "infinite") {
        parcel_decading_interval = Number.MAX_VALUE;
    } else {
        parcel_decading_interval = parseInt(parcel_decading_interval.slice(0, -1)) * 1000;
    }

    MyMap.decade_frequency = movement_duration / parcel_decading_interval;

});


client.onAgentsSensing((agents) => {

    MyMap.resetMap(-1);

    let timestamp = Date.now() - start;

    for (let a of agents) {
        a.timestamp = timestamp
        MyMap.updateMap(a.x, a.y, -1);

        if (!MyData.adversaryAgents.some(agent => existAgentById(a.id, agent.id))) {
            a.direction = 'none';
            MyData.adversaryAgents.push(a)
        }
        else {
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
        MyMap.updateMap(a.x, a.y, -1);
    }
})


export { CollaboratorData, MyData, MyMap };