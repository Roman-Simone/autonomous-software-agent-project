import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
export { distance, me, parcels, client, findPath_BFS, find_nearest_delivery, mypos, updateMe, map, find_random_delivery, distanceBFS }


const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRiYjQ5YjZiMzAxIiwibmFtZSI6InNpbW9zIiwiaWF0IjoxNzE0OTAwMjQ3fQ.Ln_OcLohraWwFOrMFTldjltybg_Pp283R_azBuWxyVs'
)
function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2))
    const dy = Math.abs(Math.round(y1) - Math.round(y2))
    return dx + dy;
}

function distanceBFS({ x: x2, y: y2 }) {
    return findPath_BFS(x2, y2).length;
}

export function from_json_to_matrix(width, height, tiles, map) {
    var map = [];
    for (let i = 0; i < width; i++) {
        map[i] = [];
        for (let j = 0; j < height; j++) {
            map[i][j] = 0;                                       // '0' are blocked tiles (empty or not_tile)
            for (let k = 0; k < tiles.length; k++) {
                if (tiles[k].x == i && tiles[k].y == j) {
                    map[i][j] = 3;                               // '3' are walkable non-spawning tiles 
                    if (tiles[k].parcelSpawner) map[i][j] = 1;   // '1' are walkable spawning tiles  
                    if (tiles[k].delivery) map[i][j] = 2;        // '2' are delivery tiles
                }
            }
        }
    }
    return map;
}

var me = {};
await client.onYou(({ id, name, x, y, score }) => {
    // console.log('me', {id, name, x, y, score})
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
})

async function updateMe() {
    return new Promise(function (resolve) {
        client.onYou(({ id, name, x, y, score }) => {
            // console.log('me', {id, name, x, y, score})
            me.id = id
            me.name = name
            me.x = x
            me.y = y
            me.score = score
        });
    });
}
async function mypos() {
    let myPromise = new Promise(function (resolve) {
        client.onYou(({ x, y }) => {
            resolve({ x, y });
        });
    });

    return await myPromise;
}



var parcels = new Map()
client.onParcelsSensing(async (perceived_parcels) => {
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



function options() {
    const options = []
    for (const parcel of parcels.values())
        options.push({ intention: 'pick up parcel', args: [parcel] });
    for (const tile of tiles.values())
        if (tile.delivery) options.push({ intention: 'deliver to', args: [tile] });
}

function select(options) {
    for (const option of options) {
        if (option.intention == 'pick up parcel' && picked_up.length == 0)
            return option;
    }
}


export function find_nearest(me, map) {

    let dist_0 = Number.MAX_VALUE;
    let dist_1 = Number.MAX_VALUE;
    let dist_2 = Number.MAX_VALUE;
    let dist_3 = Number.MAX_VALUE;

    let coordinates = [];
    for (var i = 0; i < 4; i++) {
        coordinates.push({ x: -1, y: -1, type: -1 });
    }

    for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {
            if (i == me.x && j == me.y) {
                continue;
            }

            var b = { i, j }

            switch (map[i][j]) {
                case 0:
                    if (distance(me, b) < dist_0) {
                        dist_0 = distance(me, b);
                        coordinates[0] = { x: i, y: j, type: 0 };
                    }
                    break;
                case 1:
                    if (distance(me, b) < dist_1) {
                        dist_1 = distance(me, b);
                        coordinates[1] = { x: i, y: j, type: 1 };
                    }
                    break;
                case 2:
                    if (distance(me, b) < dist_2) {
                        dist_2 = distance(me, b);
                        coordinates[2] = { x: i, y: j, type: 2 };
                    }
                    break;
                case 3:
                    if (distance(me, b) < dist_3) {
                        dist_3 = distance(me, b);
                        coordinates[3] = { x: i, y: j, type: 3 };
                    }
                    break;
                default:
                    // Handle other cases if needed
                    break;
            }
        }
    }

    return coordinates;
}


//* Find nearest delivery 
function find_nearest_delivery() {

    let min_distance = 1000000;
    let nearest_delivery = { x: -1, y: -1 };
    for (var i = 0; i < deliveryCoordinates.length; i++) {
        if (distance(me, deliveryCoordinates[i]) < min_distance) {
            min_distance = distance(me, deliveryCoordinates[i]);
            nearest_delivery = deliveryCoordinates[i];
        }
    }
    return nearest_delivery;
}

//* Find random delivery 
function find_random_delivery() {

    let random_delivery = deliveryCoordinates[Math.floor(Math.random() * deliveryCoordinates.length)];

    delivery_coordinates = { x: random_delivery.x, y: random_delivery.y };

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