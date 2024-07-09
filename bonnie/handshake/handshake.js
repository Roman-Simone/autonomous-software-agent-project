import { handshake, slaveStateMessage, masterRevision, CollaboratorData, MyData  } from "./communication/coordination.js";
import { client } from "./config.js";





await handshake();

while(true){
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Hello from agent: ", client.name);

    if(MyData.role == "SLAVE"){
        await slaveStateMessage();
    } else if (MyData.role == "MASTER"){
        await masterRevision();
    } 

    console.log("Correctly exchanged data between agents!");
}




