// Importo Express, creo un'applicazione e definisco la porta su cui il server ascolterà le richieste
import express, { Request, Response } from 'express';
// Importo la funzione createClient da redis per creare un client Redis
import { createClient } from 'redis';
// Importo dotenv per leggere le variabili d'ambiente dal file .env
import "dotenv/config";
// Importo PrismaClient per interagire con il database tramite Prisma
import { PrismaClient } from "./generated/prisma/client";
// Importo PrismaMariaDb per usare il connettore MariaDB di Prisma
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Definisco un'interfaccia TypeScript per i post, che rappresenta la struttura dei dati che mi aspetto di ricevere dal feed esterno
interface FeedPost {
  id: number;
  title: {
    rendered: string;
  };
  content?: {
    rendered: string;
  };
  link?: string;
  date?: string;
}

// Creo un'istanza di Express per gestire le richieste HTTP
const app = express();
// Creo un'istanza di PrismaClient per interagire con il database, usando l'adapter MariaDB e le informazioni di 
// connessione prese dalla variabile d'ambiente DATABASE_URL
const databaseUrl = new URL(process.env.DATABASE_URL!);
// Controllo se la connessione al database deve usare SSL, basandomi sulla variabile d'ambiente DATABASE_SSL o 
// sul parametro sslaccept dell'URL del database. Se DATABASE_SSL è impostata a "true" o se sslaccept è "strict", 
// allora uso SSL. SSL è un protocollo di sicurezza che cripta i dati trasmessi tra il server e il client, 
// proteggendo le informazioni sensibili.
const useSsl =
  process.env.DATABASE_SSL === "true" ||
  databaseUrl.searchParams.get("sslaccept") === "strict";
// Metto host, port, user, password e database in un oggetto adapter per PrismaMariaDb. 
// Uso decodeURIComponent per decodificare eventuali caratteri speciali nell'username e nella password. 
// Uso databaseUrl.pathname.slice(1) per ottenere il nome del database senza lo slash iniziale.
// Se useSsl è true, aggiungo l'opzione ssl: true all'oggetto adapter.
const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
  ...(useSsl ? { ssl: true } : {}),
});
// Creo un'istanza di PrismaClient usando l'adapter MariaDB appena creato. PrismaClient è la classe principale 
// di Prisma che permette di interagire con il database in modo semplice e tipizzato.
const prisma = new PrismaClient({ adapter });

const PORT = Number(process.env.PORT) || 3000;  // process.env.PORT è una variabile d'ambiente che Render mi passa quando avvio il server. Se non è definita, uso la porta 3000 di default.
// Creo un client Redis usando l'URL definito nella variabile d'ambiente REDIS_URL
const redisUrl = process.env.REDIS_URL; // REDIS_URL è una variabile d'ambiente che contiene l'URL del server Redis. Render la definisce automaticamente quando creo un servizio Redis. Se non è definita, lancio un errore.
// Se REDIS_URL non è definita, lancio un errore. Questo serve a evitare di avere un client Redis senza URL, che causerebbe errori difficili da capire.
if (!redisUrl) {
  throw new Error("REDIS_URL non è definita");
}
const redisClient = createClient({  // creo un client Redis usando l'URL definito nella variabile d'ambiente REDIS_URL
  url: redisUrl,
});


// Gestione degli errori di connessione a Redis
redisClient.on('error', (err) => { console.error('Errore Redis:', err); });

// Indirizzo del feed esterno da cui recuperare i post
const FEED_URL = 'https://d3r6kmd22dkoyn.cloudfront.net/';
const POSTS_CACHE_KEY = 'posts';
const CACHE_SECONDS_TIMER = 60;

// Funzione che recupera i post dal feed esterno
async function getPostsFromFeed() {
    const risposta = await fetch(FEED_URL);
    // Controllo se la risposta HTTP è ok (status 200-299). Se no, lancio un errore
    if (!risposta.ok) {
      throw new Error(`Errore HTTP ${risposta.status}`);
    }
    const posts = await risposta.json();
    return posts;        // perché ora la risposta è un oggetto/lista, non una semplice stringa.
}

// Endpoint che ritorna tutti i post presi dal feed esterno
app.get('/posts', async (req: Request, res: Response) => {
  try {
    // Recupero i post dal feed esterno usando la funzione getPostsFromFeed
    const posts = await getPostsFromFeed();
    // Ritorno i post in formato JSON
    res.json(posts);
  } catch (errore) {
    console.error('Errore nel leggere il feed:', errore);
    res.status(500).json({ messaggio: 'Errore nel recuperare i post' });    // se c'è un errore, rispondo con il codice 
                                                                            // HTTP 500 (vuol dire "errore del server") 
                                                                            // insieme a un messaggio. I codici HTTP sono 
                                                                            // uno standard: 200 = ok, 404 = non trovato, 
                                                                            // 500 = errore server, ecc.
  }
});

// Endpoint che ritorna i post filtrati per titolo e/o limitati per numero
// GET /posts-filtered?title=<testo>&items=<numero> Ritorna i post filtrati per titolo (se passato 'title')
// e limitati nel numero (se passato 'items')
app.get('/posts-filtered', async (req: Request, res: Response) => {
  try {
    const cachedPosts = await redisClient.get(POSTS_CACHE_KEY);
    let posts;
    if (cachedPosts != null) {
      // Se ci sono post in cache, li uso invece di fare la fetch
      console.log('Post letti dalla cache Redis');

      posts = JSON.parse(cachedPosts);  // parse trasforma la stringa JSON in un oggetto, perché Redis salva solo stringhe
    } else {
      console.log('Post letti dal feed esterno');
  
      posts = await getPostsFromFeed();

      // Salvo i post in cache
      await redisClient.set(POSTS_CACHE_KEY, JSON.stringify(posts));  // stringify trasforma l'oggetto in una stringa JSON, perché Redis può salvare solo stringhe
      
      await redisClient.expire(POSTS_CACHE_KEY, CACHE_SECONDS_TIMER);   // dopo un po' (60 secondi) la cache scade e i dati vengono riletti dal feed
    }

    // Parametri ricevuti nella query string (dopo il '?' nell'URL)
    // Esempio: /posts-filtered?title=esempio&items=5
    // req.query è un oggetto che contiene i parametri della query string
    // In questo caso, title e items saranno undefined se non sono stati passati nella query string
    // Se sono stati passati, saranno stringhe. Ad esempio, se l'URL è /posts-filtered?title=esempio&items=5
    // allora title sarà 'esempio' e items sarà '5' (una stringa, non un numero)
    const { title, items } = req.query;

    // let risultato servirà a contenere i post filtrati. Inizialmente contiene tutti i post
    let risultato = posts;

    // Se è stato passato il parametro 'title', filtriamo per titolo
    // Metto tutto in minuscolo per fare un confronto case-insensitive
    // Uso rendered perché il titolo è dentro un oggetto con chiave 'rendered'
    if (title != null) {
      const titleCheck = String(title).toLowerCase().trim(); // Converto in stringa, minuscolo e tolgo spazi iniziali efinali
      if (titleCheck.length === 0) { // === controlla anche il tipo, quindi se titleCheck è una stringa vuota
        res.status(400).json({ messaggio: 'Errore nel parametro title, deve essere una stringa non vuota' });
        return; // esco dalla funzione per non continuare l'esecuzione
      }
      risultato = risultato.filter((post: FeedPost) => post.title.rendered.toLowerCase().includes(String(titleCheck)));
    } 


    // Se è stato passato il parametro 'items', limitiamo il numero di risultati
    // Slice prende i primi 'items' elementi dell'array, in pratica da 0 a 'items' (non incluso). 
    // Uso Number() per convertire la stringa in numero
    
    if (items != null) {
      const itemsNum = Number(items);
      if (Number.isNaN(itemsNum) || itemsNum <= 0) {
        res.status(400).json({ messaggio: 'Errore nel parametro items, deve essere un numero positivo maggiore di zero' });
        return; // esco dalla funzione per non continuare l'esecuzione
      }
      risultato = risultato.slice(0, itemsNum);
    }

    res.json(risultato);
  } catch (errore) {
    console.error('Errore nel filtrare i post:', errore);
    res.status(500).json({ messaggio: 'Errore nel recuperare i post filtrati' });
  }
});

// Endpoint che sincronizza il database con i post del feed esterno
app.get("/sync-db", async (req: Request, res: Response) => {
  try {
    // Recupero i post dal feed esterno e li casto (li converto) a FeedPost[]
    const posts = await getPostsFromFeed() as FeedPost[];
    // Uso Promise.all per eseguire in parallelo tutte le operazioni di upsert (update o insert) dei post nel database.
    const savedPosts = await Promise.all(
      // Per ogni post, faccio un upsert: se il post esiste (cercando per wpId), lo aggiorno; altrimenti lo creo.
      posts.map((post) =>
        prisma.post.upsert({
          where: {
            wpId: post.id,
          },
          update: {
            title: post.title.rendered, // Aggiorno il titolo del post con quello del feed esterno
            content: post.content?.rendered ?? "",  // Aggiorno il contenuto del post con quello del feed esterno, se esiste; altrimenti metto una stringa vuota. 
                                                    // I ? sevono per evitare errori se post.content è undefined. La struttura è: 
                                                    // se post.content esiste(?), prendi post.content.rendered se non è definito o null (?); altrimenti(?), usa la stringa vuota.
            publishedAt: new Date(post.date ?? Date.now()), // Aggiorno la data di pubblicazione del post con quella del feed esterno, se esiste; altrimenti uso la data corrente.
          },
          create: {
            wpId: post.id,
            title: post.title.rendered,
            content: post.content?.rendered ?? "",  // La struttura è: se post.content esiste(?), prendi post.content.rendered se non è definito o null (?); altrimenti(?) usa la stringa vuota.
            link: post.link ?? "",
            publishedAt: new Date(post.date ?? Date.now()),
          },
        })
      )
    );
    // Ritorno un messaggio di successo e il numero di post salvati nel database
    res.json({
      messaggio: "Database sincronizzato correttamente",
      totale: savedPosts.length,
    });
  } catch (errore) {
    console.error("Errore durante la sincronizzazione:", errore);
    res.status(500).json({
      messaggio: "Errore durante la sincronizzazione",
    });
  }
});

// Endpoint che ritorna tutti i post salvati nel database, ordinati per data di pubblicazione decrescente
app.get("/posts-db", async (req: Request, res: Response) => {
  try {
    // Recupero tutti i post dal database usando Prisma, ordinati per data di pubblicazione decrescente
    const posts = await prisma.post.findMany({  // findMany ritorna tutti i post salvati nel database
      orderBy: {
        publishedAt: "desc",    // ordina per data di pubblicazione decrescente (dal più recente al più vecchio)
      },
    });

    res.json(posts);
  } catch (errore) {
    console.error("Errore nel leggere i post dal database:", errore);
    res.status(500).json({
      messaggio: "Errore nel recuperare i post dal database",
    });
  }
});



// Avvio il server sulla porta definita
async function startServer() {
  await redisClient.connect();

  app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
  });
}
// Esporto l'applicazione Express per poterla usare in altri moduli (per i test)
export { app, redisClient, prisma };
// Se il file viene eseguito direttamente (non importato come modulo), avvio il server
if (require.main === module) {
  startServer();
}