# Progetto test Backend
Web service che consenta di interrogarlo tramite REST-API.

## Tecnologie utilizzate
- Node.js
- TypeScript
- Express.js
- Redis
- Prisma ORM
- MySQL/MariaDB
- TiDB Cloud per il database online
- Jest
- Supertest
- Docker
- Docker Compose

## Avviare il progetto
Per eseguire il progetto in locale è necessario avere un'istanza Redis in esecuzione. In ambiente Render viene invece utilizzato il servizio Key Value tramite la variabile d'ambiente REDIS_URL.

Installare le dipendenze scrivendo nel terminale: `npm install`
Generare il Prisma Client e compilare il progetto scrivendo nel terminale: `npm run build`
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
Il progetto richiede un file `.env` nella root per l'ambiente locale.
Il progetto utilizza le seguenti variabili:
- PORT: porta sulla quale viene avviato il server.
- REDIS_URL: URL di connessione all'istanza Redis. In ambiente Render viene configurata tramite le Environment Variables del servizio.
- DATABASE_URL: URL di connessione al database MySQL/MariaDB.

## Database
Per il requisito bonus ho integrato un database MySQL/MariaDB tramite Prisma ORM.
In produzione e stato utilizzato TiDB Cloud, compatibile con MySQL, per avere un database online raggiungibile dal servizio pubblicato su Render.
Il modello principale e `Post`, salvato nella tabella `Post`.
Per creare o aggiornare la struttura del database: `npx prisma db push --config prisma.config.ts`
Per generare il Prisma Client: `npx prisma generate --config prisma.config.ts`
Per database online TiDB Cloud e necessario usare una connection string con SSL, ad esempio:
`mysql://utente:password@host:4000/tirocinio_db?sslaccept=strict`
e impostare: `DATABASE_SSL=true`

Variabili:
- DATABASE_URL: URL di connessione al database MySQL.
- REDIS_URL: URL di connessione a Redis.

## Test
Il progetto include test automatici con Jest e Supertest.
Eseguire i test: `npm test`
I test verificano gli endpoint principali:
- GET /posts
- GET /posts-filtered
- GET /sync-db
- GET /posts-db

## Deploy
Il progetto puo essere pubblicato su Render o servizi equivalenti.
Su Render devono essere configurate le variabili d'ambiente:
- DATABASE_URL
- DATABASE_SSL
- REDIS_URL
- PORT

Per TiDB Cloud, `DATABASE_URL` deve avere una forma simile a: 
`mysql://utente:password@host:4000/tirocinio_db?sslaccept=strict`
e deve essere presente: `DATABASE_SSL=true`
In produzione non bisogna usare URL locali come: `localhost`

In produzione serve un database online raggiungibile dal servizio cloud.

## Docker
Il progetto prevede un ambiente Docker completo con:
- applicazione Node.js;
- Redis;
- MariaDB.

Per avviare l'ambiente: `docker compose up --build`

Endpoint disponibili in Docker:
`http://localhost:3000/posts`
`http://localhost:3000/posts-filtered?items=5`
`http://localhost:3000/sync-db`
`http://localhost:3000/posts-db`

Per fermare i container: `docker compose down`
Per fermare i container e cancellare anche i dati del database Docker: `docker compose down -v`
Nel file `docker-compose.yml` vengono avviati tre servizi:
- `app`: il servizio Node.js/Express;
- `redis`: il servizio Redis;
- `db`: il database MariaDB.
L'applicazione Docker usa una `DATABASE_URL` interna: `mysql://root:rootpassword@db:3306/tirocinio_db`
Dentro Docker non si usa `localhost` per collegarsi al database, ma il nome del servizio `db`.

## Repository GitHub
Il progetto e caricato su repository GitHub pubblico come richiesto dal requisito bonus.
Prima del push e importante verificare che non vengano caricati file sensibili come:
`.env`
`node_modules`
`dist`
Questi file devono essere esclusi tramite `.gitignore`.

