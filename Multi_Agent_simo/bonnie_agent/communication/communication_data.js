export { CommunicationData }

class CommunicationData{

    //INFORMATION ABOUT THE AGENT
    name = ""
    id = ""
    pos = { x: -1, y: -1};
    score = 0
    role = ""
    parcels = [];
    inmind = 0;
    options = [];
    best_option = [];
    
    
    constructor(){
        this.name = "";
        this.id = "";
        this.pos = { x: -1, y: -1};
        this.score = 0;
        this.role = "";
        this.parcels = [];
        this.inmind = 0;
        this.options = [];
        this.best_option = []; 
    }
    
    // Copy the data from another CommunicationData object
    copy(data){
        this.name = data.name;
        this.id = data.id;
        this.pos = data.pos;
        this.score = data.score;
        this.role = data.role;
        this.parcels = data.parcels;
        this.inmind = data.inmind;
        this.options = data.options;
        this.best_option = data.best_option;
    }

    // Search for a parcel by id
    getParcelById(idToFind){
        for (let parcel of this.parcels) {
            if (idToFind == parcel.id){
                return parcel;
            }
        }
        return false;
    }

    // Print all the parcels
    printParcels(){
        for (let elem of this.parcels) {
            console.log(elem)
        }
    }

    // Print all the data
    print(){
        console.log("name: ", this.name);
        console.log("id: ", this.id);
        console.log("role: ", this.role);
        console.log("pos: ", this.pos);

    }
}