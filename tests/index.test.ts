// Importo supertest che è una libreria che permette di chiamare una API Express senza aprire il browser e senza dover scrivere manualmente fetch.
import request from "supertest";
// Importo l'applicazione Express dal file index.ts per poterla testare.
import { app, redisClient,  prisma } from "../src/index";

// beforeAll è una funzione di Jest che viene eseguita prima di tutti i test. In questo caso, serve a connettersi al database Redis prima di eseguire i test.
beforeAll(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
});

// afterAll è una funzione di Jest che viene eseguita dopo tutti i test. In questo caso, serve a chiudere la connessione al database Redis dopo aver eseguito i test.
afterAll(async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();

    await prisma.$disconnect();
  }
});

// describe serve a raggruppare dei test. Descrivo i test relativi all’endpoint GET /posts.
describe("GET /posts", () => {
    // it serve a definire un singolo test. Descrivo il test che verifica che l’endpoint ritorni una lista di post. 
    // async serve perché una chiamata HTTP non è immediata
    it("ritorna una lista di post", async () => {
        // aspetta che arrivi la risposta di request che dice a supertest: "usa questa app Express" per fare una richiesta a GET a /posts.
        const response = await request(app).get("/posts");
        // Mi aspetto che /posts risponda con status 200 (ok). Se invece risponde 500, 404, ecc., il test fallisce.
        expect(response.status).toBe(200);
        // Mi aspetto che la risposta sia un array. Se invece è un oggetto, una stringa, ecc., il test fallisce.
        expect(Array.isArray(response.body)).toBe(true);
    });
});

// describe serve a raggruppare dei test. Descrivo i test relativi all’endpoint GET /posts-filtered.
describe("GET /posts-filtered", () => {
  it("ritorna al massimo il numero di post richiesto", async () => {
    const response = await request(app).get("/posts-filtered?items=5"); // Chiama l’endpoint con il parametro items=5

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // Controlla che la lista non abbia più di 5 elementi.
    expect(response.body.length).toBeLessThanOrEqual(5);
  });
  // Test per verificare che l’endpoint ritorni 400 se items non è un numero valido
  it("ritorna 400 se items non è valido", async () => {
    const response = await request(app).get("/posts-filtered?items=abc");

    expect(response.status).toBe(400);
  });
});

// describe serve a raggruppare dei test. Descrivo i test relativi all’endpoint GET /posts-filtered.
describe("GET /sync-db", () => {
  it("sincronizza i post nel database", async () => {
    const response = await request(app).get("/sync-db");

    expect(response.status).toBe(200);
    // Controlla che il messaggio di /sync-db abbia restituito la risposta attesa
    expect(response.body.messaggio).toBe("Database sincronizzato correttamente");
    // Controlla che il numero di post sincronizzati sia un numero
    expect(typeof response.body.totale).toBe("number");
  });
});

// describe serve a raggruppare dei test. Descrivo i test relativi all’endpoint GET /posts-db.
describe("GET /posts-db", () => {
  it("ritorna i post salvati nel database", async () => {
    const response = await request(app).get("/posts-db");

    expect(response.status).toBe(200);
    // Controlla che /posts-db restituisca una lista.
    expect(Array.isArray(response.body)).toBe(true);
  });
});
