// Importo Express, creo un'applicazione e definisco la porta su cui il server ascolterà le richieste
import express, { Request, Response } from 'express';
import { createClient } from 'redis';
interface Post {
    title: {
    rendered: string;
  };
}

// Log della variabile d'ambiente REDIS_URL per debug
console.log("REDIS_URL:", process.env.REDIS_URL);


const app = express();
const PORT = Number(process.env.PORT) || 3000;  // process.env.PORT è una variabile d'ambiente che Render mi passa quando avvio il server. Se non è definita, uso la porta 3000 di default.

// Creo un client Redis usando l'URL definito nella variabile d'ambiente REDIS_URL
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL non è definita");
}
const redisClient = createClient({
  url: redisUrl,
});


// Gestione degli errori di connessione a Redis
redisClient.on('error', (err) => {
  console.error('Errore Redis:', err);
});
// Indirizzo del feed esterno da cui recuperare i post
const FEED_URL = 'https://d3r6kmd22dkoyn.cloudfront.net/';
const POSTS_CACHE_KEY = 'posts';
const CACHE_SECONDS_TIMER = 60;

// Endpoint che ritorna tutti i post presi dal feed esterno
app.get('/posts', async (req: Request, res: Response) => {
  try {
    const risposta = await fetch(FEED_URL);
    // Controllo se la risposta HTTP è ok (status 200-299). Se no, lancio un errore
    if (!risposta.ok) {
      throw new Error(`Errore HTTP ${risposta.status}`);
    }
    const posts = await risposta.json();
    res.json(posts);        // perché ora la risposta è un oggetto/lista, non una semplice stringa. 
                            // Express si occupa lui di trasformarla nel formato giusto.
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
      
      const risposta = await fetch(FEED_URL); //fetch va a prendere dati da internet.
      posts = await risposta.json();

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
      risultato = risultato.filter((post: Post) => post.title.rendered.toLowerCase().includes(String(titleCheck)));
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

// Avvio il server sulla porta definita
async function startServer(){
  await redisClient.connect();
  app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
  });
}
startServer();
