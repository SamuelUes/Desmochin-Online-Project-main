// init-db.js

db = db.getSiblingDB("pharonsdb");

// ========================================
// COLLECTIONS
// ========================================

db.createCollection("users");
db.createCollection("rooms");
db.createCollection("matches");
db.createCollection("gameStates");
db.createCollection("rankings");
db.createCollection("logs");

// ========================================
// INDEXES
// ========================================

// USERS
db.users.createIndex(
  { email: 1 },
  { unique: true }
);

db.users.createIndex(
  { username: 1 },
  { unique: true }
);

// ROOMS
db.rooms.createIndex(
  { roomCode: 1 },
  { unique: true }
);

// MATCHES
db.matches.createIndex(
  { roomId: 1 }
);

// GAME STATES
db.gameStates.createIndex(
  { roomId: 1 },
  { unique: true }
);

// RANKINGS
db.rankings.createIndex(
  { elo: -1 }
);

// LOGS
db.logs.createIndex(
  { matchId: 1 }
);

db.logs.createIndex(
  { roomId: 1 }
);

db.logs.createIndex(
  { userId: 1 }
);

db.logs.createIndex(
  { category: 1 }
);

db.logs.createIndex(
  { timestamp: -1 }
);

// ========================================
// USERS SAMPLE DOCUMENT
// ========================================

db.users.insertOne({
  username: "example_user",

  email: "example@email.com",

  passwordHash: "hashed_password",

  avatar: "avatar_default.png",

  coins: 0,

  level: 1,

  inventory: [],

  stats: {
    wins: 0,
    losses: 0,
    matchesPlayed: 0
  },

  createdAt: new Date(),

  updatedAt: new Date(),

  lastLogin: null
});

// ========================================
// ROOMS SAMPLE DOCUMENT
// ========================================

db.rooms.insertOne({
  roomCode: "ROOM001",

  game: "Desmoche",

  hostId: "user15",

  players: [
    {
      userId: "user14",
      username: "Carlos",
      connected: true
    },
    {
      userId: "user15",
      username: "Ana",
      connected: true
    }
  ],

  status: "waiting",

  maxPlayers: 4,

  createdAt: new Date()
});

// ========================================
// MATCHES SAMPLE DOCUMENT
// ========================================

db.matches.insertOne({
  roomId: "ROOM001",

  players: [
    "user14",
    "user15"
  ],

  winnerId: "user15",

  moves: [],

  duration: 0,

  finishedAt: null
});

// ========================================
// GAME STATES SAMPLE DOCUMENT
// ========================================

db.gameStates.insertOne({
  roomId: "ROOM001",

  players: [
    {
      userId: "user14",
      username: "Carlos",

      connected: true,

      deck: [
        {
          suit: "Espadas",
          value: "As"
        }
      ]
    },

    {
      userId: "user15",
      username: "Ana",

      connected: true,

      deck: [
        {
          suit: "Corazones",
          value: "10"
        }
      ]
    },

    {
      userId: "user16",
      username: "Luis",

      connected: false,

      deck: []
    }
  ],

  mainDeck: [],

  currentTurn: "user14",

  cards: [],

  score: {
    user14: 0,
    user15: 0,
    user16: 0
  },

  timer: 30,

  phase: "waiting",

  updatedAt: new Date()
});

// ========================================
// RANKINGS SAMPLE DOCUMENT
// ========================================

db.rankings.insertOne({
  userId: "user15",

  elo: 1000,

  rank: "Bronce",

  updatedAt: new Date()
});

// ========================================
// LOGS SAMPLE DOCUMENT
// ========================================

db.logs.insertOne({
  matchId: "match001",

  roomId: "ROOM001",

  userId: "user15",

  category: "SYSTEM",

  event: "DATABASE_INITIALIZED",

  data: {
    message: "PharonsDB initialized successfully"
  },

  severity: "INFO",

  timestamp: new Date()
});

// ========================================

print("====================================");
print("PHARONSDB INITIALIZED SUCCESSFULLY");
print("Collections created:");
print("- users");
print("- rooms");
print("- matches");
print("- gameStates");
print("- rankings");
print("- logs");
print("====================================");
