// serve per eseguire i test con Jest e TypeScript
module.exports = {      // module.exports è la sintassi di CommonJS per esportare un oggetto che contiene le configurazioni di Jest
  preset: "ts-jest",        // preset è una configurazione predefinita per Jest che permette di usare TypeScript con Jest senza dover configurare manualmente il transpiler (transpiler è un programma che converte il codice TypeScript in JavaScript).
  testEnvironment: "node",  // testEnvironment specifica l'ambiente in cui verranno eseguiti i test. In questo caso, "node" indica che i test verranno eseguiti in un ambiente Node.js.
};