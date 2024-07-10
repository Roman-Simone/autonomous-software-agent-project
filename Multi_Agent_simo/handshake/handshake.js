import { handshake, slaveStateMessage, masterRevision, CollaboratorData, MyData  } from "./communication/coordination.js";
import { client } from "./config.js";



await handshake();

while(true){
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Hello from agent: ", client.name);

    if(MyData.role == "SLAVE"){
        console.log("sto facendo parte: SLAVE");
        await slaveStateMessage();
    } else if (MyData.role == "MASTER"){
        console.log("sto facendo parte: MASTER");
        let ok = await masterRevision();
        
        if(ok)
        console.log("returned best_option_master: ", MyData.best_option)
        console.log("returned best_option_slave: ", CollaboratorData.best_option)

    } 

    console.log("Correctly exchanged data between agents!");
}




