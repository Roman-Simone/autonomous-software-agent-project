import { client } from "../config.js";
import { MyData } from "../communication/coordination.js";
import { from_json_to_matrix } from "./utils.js";

export { beliefset, map, deliveryCoordinates, configElements, decade_frequency };

// Define global variables
const beliefset = new Map();
// Function to update beliefset when agents are sensed
client.onAgentsSensing(agents => {
    // Update beliefset with new agent information
    for (let a of agents) {
        beliefset.set(a.id, a);
    }
});

client.onYou(({ id, name, x, y, score }) => {
    MyData.id = id
    MyData.name = name
    MyData.pos.x = Math.round(x);
    MyData.pos.y = Math.round(y);
    MyData.score = score
})

client.onParcelsSensing(async (perceived_parcels) => {
    MyData.parcels = []
    for (let p of perceived_parcels) {
        MyData.parcels.push(p)
    }
})

var map = [];
var deliveryCoordinates = [];
client.onMap((width, height, tiles) => {
    // console.log("Map received: ", width, height, tiles.length)
    map = from_json_to_matrix(width, height, tiles, map);
    deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({ x: t.x, y: t.y }));
});


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