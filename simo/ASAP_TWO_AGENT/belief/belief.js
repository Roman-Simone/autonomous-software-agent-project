import { client } from "../config.js";
import { AgentData } from "./agentData.js";
import { from_json_to_matrix } from "./utils.js";

export { decade_frequency, CollaboratorData, MyData};


var CollaboratorData = new AgentData();
var MyData = new AgentData();


// Function to update the beliefset of the agent
client.onAgentsSensing(agents => {
    for (let a of agents) {
        MyData.adversaryAgents.push(a);
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


client.onMap((width, height, tiles) => {
    MyData.map = from_json_to_matrix(width, height, tiles);
    MyData.deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({ x: t.x, y: t.y }));
    MyData.updateBeliefset();
});



var decade_frequency = 0;
client.onConfig((config) => {

    let movement_duration = config.MOVEMENT_DURATION;
    let parcel_decading_interval = config.PARCEL_DECADING_INTERVAL;

    if (parcel_decading_interval == "infinite") {
        parcel_decading_interval = Number.MAX_VALUE;
    } else {
        parcel_decading_interval = parseInt(parcel_decading_interval.slice(0, -1)) * 1000;
    }

    decade_frequency = movement_duration / parcel_decading_interval;
});