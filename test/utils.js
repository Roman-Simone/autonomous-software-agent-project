// import { client } from './index.js'
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

export { distance, me, parcels, client}


const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3ZmFkMDk3NjE1IiwibmFtZSI6InNpbW8iLCJpYXQiOjE3MTM4NjYxNjZ9.f-keGEwZf6riqFHycBepx240fDIeRCTQPSTAnp0m-uI'
)


function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

const me = {};
await client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )


const parcels = new Map()
client.onParcelsSensing( async ( perceived_parcels ) => {
    for (const p of perceived_parcels) {
        parcels.set( p.id, p)
    }
} )



function options () {
    const options = []
    for (const parcel of parcels.values())
        options.push( { intention: 'pick up parcel', args: [parcel] } );
    for (const tile of tiles.values())
        if (tile.delivery) options.push( { intention: 'deliver to', args: [tile] } );
}

function select (options) {
    for (const option of options) {
        if ( option.intention == 'pick up parcel' && picked_up.length == 0)
            return option;
    }
}