# Progetto test Backend
Web service che consenta di interrogarlo tramite REST-API.

## Tecnologie utilizzate
- NodeJS
- TypeScript
- ExpressJS

## Avviare il progetto
Per eseguire il progetto in locale è necessario avere un'istanza Redis in esecuzione. In ambiente Render viene invece utilizzato il servizio Key Value tramite la variabile d'ambiente REDIS_URL.

Installare le dipendenze scrivendo nel terminale: `npm install`
Compilare il progetto scrivendo nel terminale: `npm run build`
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

### GET /sync-db
Legge i post dal feed esterno e li salva nella tabella posts del database. Se un post è già presente, viene aggiornato.

### GET /posts-db
Legge e restituisce tutti i post salvati nella tabella posts.

## Variabili d'ambiente
Il progetto utilizza le seguenti variabili:
- PORT: porta sulla quale viene avviato il server.
- REDIS_URL: URL di connessione all'istanza Redis. In ambiente Render viene configurata tramite le Environment Variables del servizio.

## Database
Per il requisito bonus ho integrato un database MySQL tramite Prisma ORM.
Variabili:
- DATABASE_URL: URL di connessione al database MySQL.
- REDIS_URL: URL di connessione a Redis.
