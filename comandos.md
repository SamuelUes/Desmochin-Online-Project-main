# Scripts de setup y arranque creados
## package.json raíz (npm scripts)

- npm run setup - Instala dependencias, construye imágenes Docker, inicia contenedores y muestra puertos

- npm run start - Solo inicia contenedores ya creados y muestra puertos

- npm run stop - Detiene contenedores

- npm run clean - Limpia todo (contenedores, volúmenes)


## Scripts PowerShell (Windows)

- ./start.ps1 - Setup completo: instala deps, construye imágenes, inicia contenedores, resalta puerto frontend

- ./start-only.ps1 - Solo inicia contenedores existentes y muestra puertos

## Puertos configurados

- Frontend: http://localhost:3001 (resaltado en verde)
- Backend: http://localhost:3000
- MongoDB: localhost:5001
- Mongo Express: http://localhost:8082

El docker-compose.yml raíz ya usa los Dockerfiles correctos:

- Frontend: frontend/Dockerfile
- Backend: backend/Dockerfile
- Database: imagen mongo:7 con database/init-db.js para inicialización