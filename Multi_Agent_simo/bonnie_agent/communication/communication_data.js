export { CommunicationData }

class CommunicationData{

    name = ""
    
    id = ""

    role = ""

    pos = { x: -1, y: -1};
    
    options = [];

    parcels = new Map();

    inmind = 0;

    best_option = [];

    constructor(){
        this.name = "";
        this.id = "";
        this.friend_pos = { x: -1, y: -1};
        this.role = "";
        this.options = [];
        this.best_option = []; 
        this.parcels = new Map();
    }

    getParcelgivenId(idToFind){

        for (const [id, parcel] of this.parcels.entries()) {
            console.log("idToFind: ", idToFind);
            console.log("parcel.id: ", parcel.id);
            if (idToFind == parcel.id){
                return parcel;
            }
        }
        return false
    }

}