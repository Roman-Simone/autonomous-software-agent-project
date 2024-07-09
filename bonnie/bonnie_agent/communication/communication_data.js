import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { client } from "../config.js";
import { myAgent } from "../index.js";
import { friend_id, parcels, me, beliefset } from "../utils.js";
export { CommunicationData }

class CommunicationData{

    friend_name = ""
    
    friend_id = ""

    friend_pos = { x: -1, y: -1};
    
    // role = ""

    parcels = [];

    agents = [];

    // curr_goal = { x: -1, y: -1, info: ''};          // info = delivery, put_down, random

    goals = [];

    order = [];

    constructor(){
        this.friend_name = "";
        this.friend_id = "";
        this.friend_pos = { x: -1, y: -1};
        this.parcels = [];
        this.agents = [];    
        this.curr_goal = { x: -1, y: -1, info: ""};          // info = delivery, put_down, random
        this.goals = [];
        this.order = [];   
    }

    // set_role(role){
    //     this.role = role;
    // }

    set_friend_name(friend_name){
        this.friend_name = friend_name;
    }

    set_friend_id(friend_id){
        this.friend_id = friend_id;
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
}