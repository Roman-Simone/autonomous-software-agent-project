import { client } from "../socketConnection.js";
import { AgentData } from "./agentData.js";
import { Map } from "./map.js";
import { from_json_to_matrix} from "./utilsBelief.js";

export { decade_frequency, parcel_reward_avg, parcel_observation_distance, CollaboratorData, MyData, MyMap };

var CollaboratorData = new AgentData();
var MyData = new AgentData();
var MyMap = new Map();
var parcel_reward_avg;
var parcel_observation_distance;
var decade_frequency;

// Function to update the beliefset of the agent
client.onAgentsSensing(agents => {

    MyMap.resetMap();

    MyData.adversaryAgents = [];

    for (let a of agents) {
        MyData.adversaryAgents.push(a);
        MyMap.updateMap(a.x, a.y, -1);
    }
    
    MyMap.updateBeliefset();
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

    console.log("width: ", width, " height: ", height)

    // console.log("tiles: ", tiles)

    MyMap.original_map = from_json_to_matrix(width, height, tiles);
    MyMap.resetMap();

    MyMap.deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({ x: t.x, y: t.y }));

    console.log("MyMap.deliveryCoordinates: ", MyMap.deliveryCoordinates)

    MyMap.spawningCoordinates = tiles.filter(t => t.parcelSpawner).map(t => ({ x: t.x, y: t.y, score: MyMap.computeSpawningScore(t.x, t.y) }));
    
    // console.log("MyMap.spawningCoordinates: ", MyMap.spawningCoordinates)

    
    // MyMap.printMapAsTable();

    MyMap.updateBeliefset();
});

client.onConfig((config) => {

    console.log("ENTRATO config");

    let movement_duration = config.MOVEMENT_DURATION;
    let parcel_decading_interval = config.PARCEL_DECADING_INTERVAL;
    parcel_observation_distance = config.PARCELS_OBSERVATION_DISTANCE;

    parcel_reward_avg = config.PARCEL_REWARD_AVG;

    console.log("parcel_reward_avg: ", parcel_reward_avg)
    
    if (parcel_decading_interval == "infinite") {
        parcel_decading_interval = Number.MAX_VALUE;
    } else {
        parcel_decading_interval = parseInt(parcel_decading_interval.slice(0, -1)) * 1000;
    }

    decade_frequency = movement_duration / parcel_decading_interval;
});