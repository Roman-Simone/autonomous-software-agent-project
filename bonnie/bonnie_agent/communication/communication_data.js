import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { client } from "../config.js";
import { myAgent } from "../index.js";
import { friend_id, parcels, me, beliefset } from "../utils.js";
export { CommunicationData }

class CommunicationData{
    
    friend_pos = { x: -1, y: -1};
    
    role = ""

    parcels = [];

    agents = [];

    // curr_goal = { x: -1, y: -1, info: ''};          // info = delivery, put_down, random

    goals = [];

    order = [];

    constructor(){
        this.friend_pos = { x: -1, y: -1};
        this.role = ""
        this.parcels = [];
        this.agents = [];    
        this.curr_goal = { x: -1, y: -1, info: ""};          // info = delivery, put_down, random
        this.goals = [];
        this.order = [];   
    }

    // constructor(friend){
    //     this.friend_pos = { x: -1, y: -1};
    //     this.role = ""
    //     this.parcels = [];
    //     this.agents = [];    
    //     this.curr_goal = { x: -1, y: -1, info: ""};          // info = delivery, put_down, random
    //     this.goals = [];
    //     this.order = [];   
    // }

    async handshake(){
        while (!ack) {
            role = "MASTER"
            console.log("WAITING FOR ACK")
            let reply = await client.ask( friend_id, {
                hello: '[HANDSHAKE] master_slave_connection MASTER_OK',
                iam: client.name,
                id: client.id
            });
    
            let rep = reply.split(" ");
    
            if (rep[0] == "[HANDSHAKE]" && rep[1] == "master_slave_connection" && rep[2] == "SLAVE_OK"){
                console.log("PAIRED COMPLETE")
                friend_id ==  rep[4];
                ack = true;
            }
        }
    } 

    set_role(role){
        this.role = role;
    }

    set_data(order = []){
        this.friend_pos.x = me.x;
        this.friend_pos.y = me.y;
        this.parcels = parcels;
        this.agents = beliefset;
        this.goals = myAgent.intention_queue;
        this.order = order;
    }

    update_data(new_data){
        this.friend_pos = new_data.get_friend_pos();
        this.parcels = new_data.get_parcels();
        this.agents = new_data.get_agents();
        this.goals = new_data.get_goals();
        this.order = new_data.get_order();
    }

    get_friend_pos(){
        return this.friend_pos;
    }

    get_role(){
        return this.role;
    }

    get_parcels(){  
        return this.parcels;
    }

    get_agents(){
        return this.agents;
    }

    get_curr_goal(){
        return this.curr_goal;
    }

    get_goals(){
        return this.goals;
    }

    get_order(){
        return this.order;
    }

    // update_friend_pos(x, y){
    //     this.friend_pos.x = x;
    //     this.friend_pos.y = y;
    // }

    // update_parcels(parcels){
    //     this.parcels = parcels;
    // }

    // update_agents(agents){
    //     this.agents = agents;
    // }




}