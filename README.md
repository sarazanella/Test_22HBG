# Progetto test Backend
Web service che consenta di interrogarlo tramite REST-API.

## Tecnologie utilizzate
- NodeJS
- TypeScript
- ExpressJS

## Avviare il progetto
Installare le dipendenze scrivendo nel terminale: `npm install`
Compilare il progetto scrivendo nel terminale: `npm run build`
Prima di avviare il server, assicurarsi che Redis sia in esecuzione in locale; ad esempio, verificando scrivendo nel terminale `redis-cli ping` e la risposta dovrebbe essere: `PONG`.
Avviare il server scrivendo nel terminale: `npm start`
In alternativa, per compilare e avviare con un solo comando, scrivere nel terminale: `npm run dev`

Il server sarà disponibile su `http://localhost:3000`

## Endpoint disponibili

### GET /posts
Ritorna l'elenco completo di tutti i post presi dal feed esterno (`https://d3r6kmd22dkoyn.cloudfront.net/`).

### GET /posts-filtered
Ritorna i post filtrati per titolo ('title') e/o limitati per numero ('items')
- title è opzionale e il tipo è String
- items è opzionale e il tipo è numero e deve essere maggiore di 0
Se un parametro viene passato ma non è valido viene restituito l'errore 400.
