# 🎰 Pharons Project

### A Premium Online Casino Gaming Platform

Developed by **Condega Studios**

*"Strategy, Luck, and Competition in One Place."*

\

---

## 📖 About The Project

**Pharons Project** is a modern online casino gaming platform developed by **Condega Studios**, designed to deliver a competitive, social, and immersive gaming experience through multiple classic card games.

The platform combines real-time multiplayer systems, secure authentication, modern web technologies, and scalable cloud-ready architecture to provide players with a professional gaming environment.

Players can create accounts, join game rooms, compete against others online, and enjoy a seamless casino-style experience directly from their web browser.

---

## 🎮 Available Games

### 🃏 Desmoche

A popular competitive card game focused on strategy, decision-making, and player interaction.

**Features**

* Online multiplayer
* Private rooms
* Public matchmaking
* Real-time game synchronization
* Spectator mode (planned)

---

### ♠️ Poker

A complete Texas Hold'em Poker experience designed for casual and competitive players.

**Features**

* Multiplayer tables
* Betting system
* Turn management
* Hand evaluation engine
* Leaderboards (planned)

---

### 🕹️ Solitaire

A classic single-player card game for players who prefer a relaxed experience.

**Features**

* Single-player gameplay
* Statistics tracking
* Save progress
* Daily challenges (planned)

---

## ✨ Core Features

* 🔐 Secure Authentication System
* 👤 User Profiles
* 🎲 Real-Time Multiplayer
* 🏠 Private and Public Rooms
* 📡 WebSocket Communication
* 📊 Match History
* 🏆 Rankings and Achievements
* 🎨 Responsive User Interface
* ⚡ High Performance Architecture
* 🐳 Docker-Based Deployment

---

## 🏗️ System Architecture

```text
┌───────────────────────┐
│      Frontend         │
│   Next.js + React     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│      API Gateway      │
└───────────┬───────────┘
            │
 ┌──────────┼──────────┐
 ▼          ▼          ▼
Auth      Users      Rooms
Service   Service    Service
            │
            ▼
      Game Services
   ┌──────┬──────┬──────┐
   ▼      ▼      ▼
Poker  Desmoche Solitaire
   │
   ▼
Socket.IO Server
   │
   ▼
MongoDB Database
```

---

## 🛠️ Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Three.js
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* REST API

### Database

* MongoDB

### DevOps

* Docker
* Docker Compose
* GitHub
* GitHub Actions

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/Condega-Studio/pharons-project.git
cd pharons-project
```

### Scripts de setup y arranque creados - Start Containers

```bash
## package.json raíz (npm scripts)

- npm run setup - Instala dependencias, construye imágenes Docker, inicia contenedores y muestra puertos

- npm run start - Solo inicia contenedores ya creados y muestra puertos

- npm run stop - Detiene contenedores

- npm run clean - Limpia todo (contenedores, volúmenes)


## Scripts PowerShell (Windows)

- ./start.ps1 - Setup completo: instala deps, construye imágenes, inicia contenedores, resalta puerto frontend

- ./start-only.ps1 - Solo inicia contenedores existentes y muestra puertos


## El docker-compose.yml raíz ya usa los Dockerfiles correctos:

- Frontend: frontend/Dockerfile
- Backend: backend/Dockerfile
- Database: imagen mongo:7 con database/init-db.js para inicialización
```

### Puertos configurados

```text
- Frontend: http://localhost:3001 (resaltado en verde)
- Backend: http://localhost:3000
- MongoDB: localhost:5001
- Mongo Express: http://localhost:8082
```

---

## 🔒 Security

Pharons Project implements:

* JWT Authentication
* Password Hashing
* Rate Limiting
* Helmet Security Headers
* CORS Protection
* Input Validation
* Session Management

---

## 👥 Development Team

### Condega Studios

An independent software development studio focused on creating innovative digital experiences, multiplayer systems, web applications, and interactive entertainment solutions.

**Specializations**

* Web Development
* Multiplayer Systems
* Game Development
* Software Architecture
* Cloud Solutions

---

## 📜 License

Copyright © 2026 Condega Studios.

All rights reserved.

This software and its source code are proprietary and confidential. Unauthorized copying, distribution, modification, or use is strictly prohibited.

---

### 🎰 Pharons Project

**Developed with passion by Condega Studios**

*Play Smart. Play Together. Play Pharons.*


