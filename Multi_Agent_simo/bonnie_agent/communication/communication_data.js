export { CommunicationData }

class CommunicationData{

    name = ""
    
    id = ""

    role = ""

    pos = { x: -1, y: -1};
    
    options = [];

    parcels = [];

    inmind = 0;

    best_option = [];

    constructor(){
        this.name = "";
        this.id = "";
        this.pos = { x: -1, y: -1};
        this.role = "";
        this.options = [];
        this.best_option = []; 
        this.parcels = [];
    }
    
    copy(data){
        this.name = data.name;
        this.id = data.id;
        this.pos = data.pos;
        this.role = data.role;
        this.options = data.options;
        this.best_option = data.best_option;
        this.parcels = data.parcels;
    }

    getParcelById(idToFind){

        for (let parcel of this.parcels) {
            // console.log("idToFind: ", idToFind);
            // console.log("parcel.id: ", parcel.id);
            if (idToFind == parcel.id){
                return parcel;
            }
        }
        return false;
    }

    

    printParcels(){
        for (let elem of this.parcels) {
            console.log(elem)
        }
    }

    print(){
        console.log("name: ", this.name);
        console.log("id: ", this.id);
        console.log("role: ", this.role);
        console.log("pos: ", this.pos);

    }
}