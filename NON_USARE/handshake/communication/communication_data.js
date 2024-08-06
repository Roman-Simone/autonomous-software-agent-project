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
}