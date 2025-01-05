src/
├── config/
│   ├── config.js
│   └── logger.config.js
│   └── database.js           # Nuova configurazione DB
├── middleware/
│   ├── errorHandler.js
│   ├── auth.js
│   ├── validate.js
│   └── loggerMiddleware.js
├── utils/
│   └── logger/
│   │    └── logger.js
│   └── errors/
│       ├── AppError.js
│       └── errorTypes.js
│
└── logs/
│   └── error.log
│
├── models/                   # Schema e modelli MongoDB
│   ├── index.js             # Esporta tutti i modelli
│   ├── School.js
│   ├── User.js
│   ├── Class.js
│   ├── Student.js
│   └── Test.js
│
├── repositories/            # Layer per operazioni DB
│   ├── base/
│   │   └── BaseRepository.js
│   ├── SchoolRepository.js
│   ├── UserRepository.js
│   ├── ClassRepository.js
│   ├── StudentRepository.js
│   ├── TestRepository.js
│   └── index.js
│
├── database/               # Utilities DB
│   ├── connection.js      # Gestione connessione
│   └── migrations/        # Per eventuali migrazioni future
├── routes/
│   ├── schoolRoutes.js
│   ├── userRoutes.js
│   ├── classRoutes.js
│   ├── studentRoutes.js
│   └── testRoutes.js
├── controllers/
│   ├── schoolController.js
│   ├── userController.js
│   ├── classController.js
│   ├── studentController.js
│   └── testController.js





Spiegazione delle cartelle e file:

config/database.js

Configurazioni MongoDB
Opzioni di connessione
Variabili ambiente DB


models/

Contiene gli schemi Mongoose
Ogni modello in un file separato
index.js per esportare tutti i modelli


repositories/

Pattern Repository per separare logica DB
BaseRepository.js con operazioni CRUD comuni
Repository specifici per ogni modello


database/

Gestione connessione DB
Supporto per future migrazioni
Utilities database-specifiche