# Progetto test Backend
Web service che consenta di interrogarlo tramite REST-API.

## Tecnologie utilizzate
- NodeJS
- TypeScript
- ExpressJS
- Redis
- Prisma ORM
- MySQL/MariaDB
- Jest
- Supertest

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
Risposte:
- 200 OK: elenco dei post in formato JSON.
- 500 Internal Server Error: errore durante il recupero del feed.

### GET /posts-filtered
Ritorna i post filtrati per titolo ('title') e/o limitati per numero ('items')
- title è opzionale e il tipo è String
- items è opzionale e il tipo è numero e deve essere maggiore di 0
Risposte:
- 200 OK: elenco dei post filtrati.
- 400 Bad Request: parametro passato ma non valido.
- 500 Internal Server Error: errore interno del server.

### GET /sync-db
Legge i post dal feed esterno e li salva nella tabella posts del database. Se un post è già presente, viene aggiornato.
Se non e presente, viene creato.
Risposte:
- 200 OK: sincronizzazione completata.
- 500 Internal Server Error: errore durante la sincronizzazione.

### GET /posts-db
Legge e restituisce tutti i post salvati nella tabella posts.
Risposte:
- 200 OK: elenco dei post salvati nel database.
- 500 Internal Server Error: errore durante la lettura dal database.

## Variabili d'ambiente
Il progetto utilizza le seguenti variabili:
- PORT: porta sulla quale viene avviato il server.
- REDIS_URL: URL di connessione all'istanza Redis. In ambiente Render viene configurata tramite le Environment Variables del servizio.
- DATABASE_URL: URL di connessione al database MySQL/MariaDB.

## Database
Per il requisito bonus ho integrato un database MySQL tramite Prisma ORM.
Per creare o aggiornare la struttura del database: `npx prisma db push --config prisma.config.ts`
Per generare il Prisma Client: `npx prisma generate --config prisma.config.ts`

Variabili:
- DATABASE_URL: URL di connessione al database MySQL.
- REDIS_URL: URL di connessione a Redis.

## Test
Il progetto include test automatici con Jest e Supertest.
Eseguire i test: `npm test`
I test verificano gli endpoint principali:
GET /posts
GET /posts-filtered
GET /sync-db
GET /posts-db

## Deploy
Il progetto puo essere pubblicato su Render o servizi equivalenti.
Su Render devono essere configurate le variabili d'ambiente:
DATABASE_URL
REDIS_URL
PORT

In produzione serve un database online raggiungibile dal servizio cloud.

## Docker
Il progetto prevede un ambiente Docker completo con:
- applicazione Node.js;
- Redis;
- MariaDB.

Per avviare l'ambiente: `docker compose up --build`