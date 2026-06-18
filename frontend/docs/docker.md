# Docker del proyecto

Este proyecto usa Docker para separar la aplicacion y la base de datos.

## Contenedores

- `app`: ejecuta Next.js en modo desarrollo con `npm run dev`.
- `mongo`: ejecuta MongoDB y guarda los datos en el volumen `mongo_data`.

El servicio `app` espera a que `mongo` pase su `healthcheck`, asi se evita que
la autenticacion intente conectar antes de que la base de datos este lista.

## Comandos utiles

Levantar todo el stack:

```bash
docker compose up --build
```

Levantarlo en segundo plano:

```bash
docker compose up -d --build
```

Levantar solo MongoDB y correr Next.js localmente:

```bash
docker compose up -d mongo
npm run dev
```

Detener los contenedores:

```bash
docker compose down
```

Detener y borrar tambien los datos de MongoDB:

```bash
docker compose down -v
```

## Variables

Para desarrollo local con Next.js fuera de Docker:

```env
MONGODB_URI="mongodb://localhost:27017/condega-casino"
AUTH_SECRET="change-this-dev-secret-with-at-least-32-characters"
```

Dentro de Docker, el contenedor `app` se conecta a MongoDB usando el nombre
del servicio:

```env
MONGODB_URI="mongodb://mongo:27017/condega-casino"
```
