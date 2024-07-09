export { CommunicationData }

class CommunicationData{

    name = ""
    
    id = ""

    role = ""

    friend_pos = { x: -1, y: -1};
    
    options = [];
    
    best_option = [];

    constructor(){
        this.name = "";
        this.id = "";
        this.friend_pos = { x: -1, y: -1};
        this.role = "";
        this.options = [];
        this.best_option = []; 
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