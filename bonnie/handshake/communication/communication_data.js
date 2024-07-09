export { CommunicationData }

class CommunicationData{

    friend_name = ""
    
    friend_id = ""

    friend_pos = { x: -1, y: -1};
    
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

    // set_mydata(order = []){
    //     this.friend_pos.x = me.x;
    //     this.friend_pos.y = me.y;
    //     this.parcels = parcels;
    //     this.agents = beliefset;
    //     this.goals = myAgent.intention_queue;
    //     this.order = order;
    // }

    // update_data(new_data){
    //     this.friend_pos = new_data.get_friend_pos();
    //     this.parcels = new_data.get_parcels();
    //     this.agents = new_data.get_agents();
    //     this.goals = new_data.get_goals();
    //     this.order = new_data.get_order();
    // }
}