# node:26-alpine è un'immagine ufficiale di Node.js basata su Alpine Linux, che è una distribuzione leggera e sicura. 
# Questa immagine contiene Node.js 26 e npm (Node Package Manager) preinstallati, ed è ottimizzata per essere piccola 
# e veloce da scaricare.
FROM node:26-alpine     

# Lavora dentro la cartella /app nel container.
WORKDIR /app

# Copia i file package.json e package-lock.json (se presente) nella cartella di lavoro del container.
COPY package*.json ./

# Installa le dipendenze del progetto. Questo comando legge il file package.json e installa tutte le dipendenze elencate nella sezione "dependencies" e "devDependencies".
RUN npm install

# Copia il resto del progetto.
COPY . .

# Genera Prisma e compila TypeScript.
RUN npm run build

EXPOSE 3000

# Quando il container parte, avvia il server.
CMD ["npm", "start"]