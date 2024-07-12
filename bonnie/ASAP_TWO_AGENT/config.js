import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

/**
 * Funzione per ottenere il token di un agente basato sul suo nome.
 * @param {string} my_name - Nome dell'agente.
 * @returns {string} Token dell'agente.
 */
function getToken(my_name) {
    // Mappa dei token per ogni agente.
    const tokens = {
        'agent_1': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkwNmNiOWZjNTJkIiwibmFtZSI6ImFnZW50XzEiLCJpYXQiOjE3MjA1MDg1OTl9.AKtfhbXdLaqcZ0d_IhVRU1GAgKTPaAECjKYhtWNR7AM', // Token per agent_1 (bonnie)
        'agent_2': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZjYjlmYzUyZGVjIiwibmFtZSI6ImFnZW50XzIiLCJpYXQiOjE3MjA1MDg2NjJ9.tLgCugK--NQzW0EKFtTMt_XAs4ucktTaK9ZxZJctzFM'  // Token per agent_2 (god)
    };

    // Determina il nome dell'amico in base al nome dell'agente corrente.
    if (my_name === 'agent_1') {
        friend_name = 'agent_2';
    } else {
        friend_name = 'agent_1';
    }

    // Restituisce il token corrispondente al nome dell'agente.
    return tokens[my_name] || 'Token non trovato';
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

// Crea una nuova istanza del client DeliverooApi utilizzando l'URL del server e il token dell'agente.
const client = new DeliverooApi(
    'http://localhost:8080',
    token
)

// Esporta il client e il nome dell'amico per l'uso in altri moduli.
export { client, friend_name };
