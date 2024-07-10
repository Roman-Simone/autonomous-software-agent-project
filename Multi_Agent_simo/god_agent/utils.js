import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { Slave } from "./index.js";
export { calculate_pickup_utility, calculate_putdown_utility, me, parcels, client, role, distanceBFS_notMe, findPath_BFS, find_nearest_delivery, map, find_random_delivery, deliveryCoordinates, distanceBFS }

// GOD

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMyMTVmZDM3YzFmIiwibmFtZSI6ImdvZCIsImlhdCI6MTcxNTAwNTM2NX0.mTuS0kYQuqqQE0ttBSfCuBkgk_vwKyy0WykWR8YbCPc'
)

// Function to update the configuration of elements
//!CONFIGURATION
// Config received:  {
//     MAP_FILE: 'map_20',
//     PARCELS_GENERATION_INTERVAL: '5s',
//     PARCELS_MAX: '5',
//     MOVEMENT_STEPS: 1,
//     MOVEMENT_DURATION: 500,
//     AGENTS_OBSERVATION_DISTANCE: 5,
//     PARCELS_OBSERVATION_DISTANCE: 5,
//     AGENT_TIMEOUT: 10000,
//     PARCEL_REWARD_AVG: 50,
//     PARCEL_REWARD_VARIANCE: 10,
//     PARCEL_DECADING_INTERVAL: 'infinite',
//     RANDOMLY_MOVING_AGENTS: 2,
//     RANDOM_AGENT_SPEED: '2s',
//     CLOCK: 50
//   }

var decade_frequency = 0;
var configElements;
client.onConfig((config) => {
    configElements = config;

    let movement_duration = configElements.MOVEMENT_DURATION;
    let parcel_decading_interval = configElements.PARCEL_DECADING_INTERVAL;

    if (parcel_decading_interval == "infinite") {
        parcel_decading_interval = Number.MAX_VALUE;
    } else {
        parcel_decading_interval = parseInt(parcel_decading_interval.slice(0, -1)) * 1000;
    }

    decade_frequency = movement_duration / parcel_decading_interval;
});

function calculate_pickup_utility(parcel) {
    let scoreParcel = parcel.reward;
    let scoreInMind = Slave.get_inmind_score();
    let numParcelInMind = Slave.parcelsInMind.length

    let distance_parcel = distanceBFS(parcel);
    let distance_delivery = distanceBFS_notMe(parcel, find_nearest_delivery());

    for (let parcelInMind of Slave.parcelsInMind) {
        let rewardAtEnd = parcelInMind.reward - decade_frequency * (distance_parcel + distance_delivery);
        if (rewardAtEnd <= 0) {
            numParcelInMind = numParcelInMind - 1;
        }
    }


    let RewardParcel = scoreParcel - decade_frequency * distance_parcel;
    let RewardInMind = scoreInMind - ((decade_frequency * distance_parcel) * numParcelInMind);
    let utility = (RewardParcel + RewardInMind) - (decade_frequency * distance_delivery) * (numParcelInMind + 1);


    let min_distance_parcel_agent = Number.MAX_VALUE;
    let nearest_agent = "";
    for (let a of beliefset.values()) {
        if (distanceBFS_notMe(parcel, a) < min_distance_parcel_agent) {
            min_distance_parcel_agent = distanceBFS_notMe(parcel, a);
            nearest_agent = a.name;
        }
    }

    let mult_malus = 0.7;

    if (min_distance_parcel_agent < distance_parcel) {
        utility -= mult_malus * (distance_parcel - min_distance_parcel_agent);

    }

    return utility;
}

function calculate_putdown_utility() {
    let scoreInMind = Slave.get_inmind_score();
    let distanceDelivery = distanceBFS(find_nearest_delivery());
    let numParcelInMind = Slave.parcelsInMind.length

    for (let parcelInMind of Slave.parcelsInMind) {
        let rewardAtEnd = parcelInMind.reward - (decade_frequency * distanceDelivery);
        if (rewardAtEnd <= 0) {
            numParcelInMind = numParcelInMind - 1;
        }
    }

    var utility = scoreInMind - ((decade_frequency * distanceDelivery) * numParcelInMind);
    return utility;
}

// Define global variables
const beliefset = new Map();
// Function to update beliefset when agents are sensed
client.onAgentsSensing(agents => {
    // Update beliefset with new agent information
    for (let a of agents) {
        beliefset.set(a.id, a);
    }
});

function manhattan({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2))
    const dy = Math.abs(Math.round(y1) - Math.round(y2))
    return dx + dy;
}

function distanceBFS({ x: x, y: y }) {
    return findPath_BFS(x, y).length;
}

function distanceBFS_notMe({ x: startX, y: startY }, { x: endX, y: endY }) {
    return findPath_BFS_notMe(startX, startY, endX, endY).length;
}

export function from_json_to_matrix(width, height, tiles, map) {
    var map = [];
    for (let i = 0; i < width; i++) {
        map[i] = [];
        for (let j = 0; j < height; j++) {
            map[i][j] = 0;                                       // '0' are blocked tiles (empty or not_tile)
            for (let k = 0; k < tiles.length; k++) {
                if (tiles[k].x == i && tiles[k].y == j) {
                    map[i][j] = 1;                               // '1' are walkable non-spawning tiles 
                    if (tiles[k].parcelSpawner) map[i][j] = 3;   // '3' are walkable spawning tiles  
                    if (tiles[k].delivery) map[i][j] = 2;        // '2' are delivery tiles
                }
            }
        }
    }
    return map;
}

var me = {};
await client.onYou(({ id, name, x, y, score }) => {
    me.id = id
    me.name = name
    me.x = Math.round(x);
    me.y = Math.round(y);
    me.score = score
})


export var friend = {};
var role = "";

client.onMsg( (id, name, msg, reply) => {
    
    let words = msg.hello.split(" ");

    console.log("message: ", msg)

    if (words[0] == "[HANDSHAKE]") {
        if (words[1] == "master_slave_connection" && words[2] == "MASTER_OK") {
            role = "SLAVE"
            console.log("I'm a SLAVE");
            var answer = "[HANDSHAKE] master_slave_connection SLAVE_OK " + me.name + " " + me.id;
        }
    }

    if (words[0] == "[STATE]") {
        friend.x = parseInt(words[1]);
        friend.y = parseInt(words[2]);
        friend.inmind = parseInt(words[3]); 
    } 

    if (words[0] == "[INT]") {
        let split = words[1].split(",")
        friend.intention = split[0];
        friend.intention_x = parseInt(split[1]);
        friend.intention_y = parseInt(split[2]);
    }

    if (reply && answer)
        try { 
            console.log("sending reply: ", answer)
            reply(answer) } catch { (error) => console.error(error) 
        }
});

var parcels = new Map()
client.onParcelsSensing(async (perceived_parcels) => {
    parcels.clear()
    for (const p of perceived_parcels) {
        parcels.set(p.id, p)
    }
})

var map = [];
var deliveryCoordinates = [];
await client.onMap((width, height, tiles) => {
    map = from_json_to_matrix(width, height, tiles, map);
    deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({ x: t.x, y: t.y }));
});

//* Find nearest delivery 
function find_nearest_delivery() {

    let min_distance = Number.MAX_VALUE;
    let nearest_delivery = { x: -1, y: -1 };
    for (var i = 0; i < deliveryCoordinates.length; i++) {
        if (distanceBFS(deliveryCoordinates[i]) < min_distance) {
            min_distance = distanceBFS(deliveryCoordinates[i]);
            nearest_delivery = deliveryCoordinates[i];
        }
    }

    // console.log("nearest_delivery: ", nearest_delivery, "(I'm on x: ", me.x, " y: ", me.y, ")");
    return nearest_delivery;
}

//* Find random delivery 
function find_random_delivery() {

    let random_delivery = deliveryCoordinates[Math.floor(Math.random() * deliveryCoordinates.length)];

    let delivery_coordinates = { x: random_delivery.x, y: random_delivery.y };

    return delivery_coordinates;
}

//* BFS
function getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: 0 },   // right
        { dx: 0, dy: -1 },  // down
        { dx: 0, dy: 1 }    // up
    ];

    for (const direction of directions) {
        const neighborX = x + direction.dx;
        const neighborY = y + direction.dy;

        if (isValidPosition(neighborX, neighborY)) {
            neighbors.push({ x: neighborX, y: neighborY });
        }
    }

    return neighbors;
}

function isValidPosition(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    const width = map.length;
    const height = map[0].length;

    return x >= 0 && x < width && y >= 0 && y < height && map[x][y] !== 0;
}

function findPath_BFS(endX, endY) {

    const visited = new Set();
    const queue = [];


    var startX = me.x;
    var startY = me.y;

    queue.push({ x: startX, y: startY, pathSoFar: [] });
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        const { x, y, pathSoFar } = queue.shift();

        if (x === endX && y === endY) {
            // Found the end point, return the path
            return [...pathSoFar, { x: endX, y: endY }]; // Include the end point in the path
        }

        const neighbors = getNeighbors(x, y);
        for (const neighbor of neighbors) {
            const { x: neighborX, y: neighborY } = neighbor;

            if (!visited.has(`${neighborX},${neighborY}`)) {
                visited.add(`${neighborX},${neighborY}`);
                queue.push({ x: neighborX, y: neighborY, pathSoFar: [...pathSoFar, { x, y }] });
            }
        }
    }

    // If no path is found, return an empty array
    return [];
}

function findPath_BFS_notMe(startX, startY, endX, endY) {

    const visited = new Set();
    const queue = [];

    queue.push({ x: startX, y: startY, pathSoFar: [] });
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        const { x, y, pathSoFar } = queue.shift();

        if (x === endX && y === endY) {
            // Found the end point, return the path
            return [...pathSoFar, { x: endX, y: endY }]; // Include the end point in the path
        }

        const neighbors = getNeighbors(x, y);
        for (const neighbor of neighbors) {
            const { x: neighborX, y: neighborY } = neighbor;

            if (!visited.has(`${neighborX},${neighborY}`)) {
                visited.add(`${neighborX},${neighborY}`);
                queue.push({ x: neighborX, y: neighborY, pathSoFar: [...pathSoFar, { x, y }] });
            }
        }
    }

    // If no path is found, return an empty array
    return [];
}