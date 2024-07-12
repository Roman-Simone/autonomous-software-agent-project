import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { default as config } from "./config.js";

function getToken(my_name) {
    
    // Determina il nome dell'amico in base al nome dell'agente corrente.
    if (my_name === 'agent_1') {
        friend_name = 'agent_2';
    } else {
        friend_name = 'agent_1';
    }

    // Restituisce il token corrispondente al nome dell'agente.
    return config.tokens[my_name] || 'Token non trovato';
}

// Variabile per memorizzare il nome dell'amico.
var friend_name = "";

// Estrae gli argomenti passati al processo.
const args = process.argv.slice(2);

// Nome dell'agente corrente ottenuto dagli argomenti.
const my_name = args[0];

// Stampa il nome dell'agente e il token ottenuto.
console.log('AGENT: ', my_name, '\nTOKEN: ', getToken(my_name) + '\n');

// Ottiene il token dell'agente corrente.
const token = getToken(my_name);


const client = new DeliverooApi( config.host, token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );

// Esporta il client e il nome dell'amico per l'uso in altri moduli.
export { client, friend_name };
