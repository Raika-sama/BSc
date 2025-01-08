# Brain Scanner - Specifiche Tecniche

## 1. API Endpoints

### 1.1 Autenticazione
```javascript
POST /api/v1/auth/register
// Input
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "role": "admin" | "teacher"
}

POST /api/v1/auth/login
// Input
{
  "email": "string",
  "password": "string"
}
// Output
{
  "status": "success",
  "token": "JWT_TOKEN",
  "data": {
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "schoolId": "string | null"
    }
  }
}

POST /api/v1/auth/forgot-password
PUT /api/v1/auth/reset-password/:token
GET /api/v1/auth/verify
GET /api/v1/auth/me
PUT /api/v1/auth/update-password
POST /api/v1/auth/logout
```

### 1.2 Scuole
```javascript
GET /api/v1/schools
GET /api/v1/schools/:id
POST /api/v1/schools
// Input
{
  "name": "string",
  "schoolType": "middle_school" | "high_school",
  "institutionType": "scientific" | "classical" | "artistic" | "none",
  "sections": ["string"],
  "numberOfYears": number,
  "region": "string",
  "province": "string",
  "address": "string"
}

PUT /api/v1/schools/:id
DELETE /api/v1/schools/:id
GET /api/v1/schools/region/:region
GET /api/v1/schools/type/:type
```

### 1.3 Classi
```javascript
GET /api/v1/classes
GET /api/v1/classes/:id
POST /api/v1/classes
// Input
{
  "year": number,
  "section": "string",
  "academicYear": "string",
  "schoolId": "string",
  "mainTeacher": "string",
  "teachers": ["string"]
}

PUT /api/v1/classes/:id
DELETE /api/v1/classes/:id
GET /api/v1/classes/school/:schoolId
POST /api/v1/classes/:classId/students
```

### 1.4 Studenti
```javascript
GET /api/v1/students
GET /api/v1/students/:id
POST /api/v1/students
// Input
{
  "firstName": "string",
  "lastName": "string",
  "gender": "M" | "F",
  "email": "string",
  "schoolId": "string",
  "currentYear": number,
  "classId": "string",
  "section": "string"
}

PUT /api/v1/students/:id
DELETE /api/v1/students/:id
GET /api/v1/students/search
PUT /api/v1/students/:id/assign-class
GET /api/v1/students/:studentId/tests
GET /api/v1/students/:studentId/results
```

## 2. Modelli Dati

### 2.1 User
```javascript
{
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['teacher', 'admin'] },
  schoolId: { type: ObjectId, ref: 'School' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}
```

### 2.2 School
```javascript
{
  name: { type: String, required: true, unique: true },
  schoolType: { type: String, enum: ['middle_school', 'high_school'] },
  institutionType: { type: String, enum: ['scientific', 'classical', 'artistic', 'none'] },
  sections: [{ type: String, validate: /^[A-Z]$/ }],
  numberOfYears: Number,
  region: String,
  province: String,
  address: String,
  users: [{
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['teacher', 'admin'] }
  }],
  manager: { type: ObjectId, ref: 'User' },
  isActive: Boolean
}
```

### 2.3 Class
```javascript
{
  year: { type: Number, required: true, min: 1, max: 5 },
  section: { type: String, required: true },
  academicYear: { type: String, required: true },
  schoolId: { type: ObjectId, ref: 'School', required: true },
  mainTeacher: { type: ObjectId, ref: 'User', required: true },
  teachers: [{ type: ObjectId, ref: 'User' }],
  students: [{ type: ObjectId, ref: 'Student' }],
  isActive: { type: Boolean, default: true }
}
```

### 2.4 Student
```javascript
{
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ['M', 'F'] },
  email: { type: String, required: true, unique: true },
  classId: { type: ObjectId, ref: 'Class' },
  schoolId: { type: ObjectId, ref: 'School', required: true },
  section: String,
  currentYear: { type: Number, required: true },
  mainTeacher: { type: ObjectId, ref: 'User' },
  teachers: [{ type: ObjectId, ref: 'User' }],
  notes: String,
  needsClassAssignment: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastClassChangeDate: Date,
  classChangeHistory: [{
    fromClass: { type: ObjectId, ref: 'Class' },
    toClass: { type: ObjectId, ref: 'Class' },
    fromSection: String,
    toSection: String,
    fromYear: Number,
    toYear: Number,
    date: Date,
    reason: String
  }]
}
```

## 3. Flow Operativi

### 3.1 Autenticazione
```javascript
// Flow registrazione
1. Validazione input
2. Check email esistente
3. Hash password
4. Creazione utente
5. Generazione JWT
6. Risposta con token

// Flow login
1. Validazione credenziali
2. Verifica password
3. Aggiornamento lastLogin
4. Generazione JWT
5. Risposta con token

// Middleware protezione route
1. Estrazione token
2. Verifica JWT
3. Caricamento utente
4. Aggiunta user a request
```

### 3.2 Gestione Scuole
```javascript
// Flow creazione scuola
1. Verifica permessi admin
2. Validazione input
3. Check nome univoco
4. Creazione scuola
5. Assegnazione manager
6. Aggiunta utente creatore come admin

// Flow assegnazione utenti
1. Verifica permessi
2. Check ruolo valido
3. Aggiunta a users array
4. Aggiornamento schoolId utente
```

### 3.3 Gestione Classi
```javascript
// Flow creazione classe
1. Validazione dati
2. Verifica esistenza scuola
3. Check unicità sezione/anno
4. Creazione classe
5. Aggiornamento relazioni

// Flow assegnazione studenti
1. Verifica capienza
2. Validazione anno/sezione
3. Aggiornamento classe
4. Aggiornamento studenti
```

## 4. Validazioni

### 4.1 Input Validation Middleware
```javascript
// Example for school creation
const validateSchool = (req, res, next) => {
  const { name, schoolType, sections } = req.body;
  
  if (!name?.trim()) {
    throw new ValidationError('Nome scuola richiesto');
  }
  
  if (!['middle_school', 'high_school'].includes(schoolType)) {
    throw new ValidationError('Tipo scuola non valido');
  }
  
  if (sections?.some(s => !/^[A-Z]$/.test(s))) {
    throw new ValidationError('Sezioni non valide');
  }
  
  next();
};
```

### 4.2 Business Rules
```javascript
// Validazioni classi
- Anno massimo in base al tipo scuola (3 o 5)
- Sezioni devono corrispondere a quelle della scuola
- MainTeacher deve essere nella lista teachers

// Validazioni studenti
- Email unica
- Anno corrente valido per tipo scuola
- Classe assegnata deve essere della stessa scuola
```

## 5. Error Handling

### 5.1 Tipi di Errori
```javascript
const ErrorTypes = {
  AUTH: {
    UNAUTHORIZED: { status: 401, code: 'AUTH_001' },
    INVALID_TOKEN: { status: 401, code: 'AUTH_002' },
    // ...
  },
  VALIDATION: {
    INVALID_INPUT: { status: 400, code: 'VAL_001' },
    // ...
  },
  RESOURCE: {
    NOT_FOUND: { status: 404, code: 'RES_001' },
    // ...
  }
};
```

### 5.2 Error Response Format
```javascript
{
  status: 'error',
  error: {
    message: string,
    code: string,
    metadata?: object
  }
}
```

## 6. Sicurezza

### 6.1 Headers
```javascript
// Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  frameguard: { action: 'deny' },
  // ...
}));
```

### 6.2 CORS
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## 7. Testing

### 7.1 Test Structure
```javascript
// Example test suite
describe('Auth Controller', () => {
  describe('POST /auth/register', () => {
    it('should create new user with valid data', async () => {
      // Test implementation
    });
    
    it('should return error for existing email', async () => {
      // Test implementation
    });
  });
});
```

### 7.2 Test Data
```javascript
// Mock data per test
const mockSchool = {
  name: 'Test School',
  schoolType: 'high_school',
  sections: ['A', 'B', 'C'],
  // ...
};

const mockUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  // ...
};
```

## 8. Performance

### 8.1 Indici Database
```javascript
// Indici critici
schoolSchema.index({ name: 1 }, { unique: true });
schoolSchema.index({ 'users.user': 1 });
schoolSchema.index({ region: 1, isActive: 1 });

classSchema.index({ schoolId: 1, year: 1, section: 1, academicYear: 1 }, { unique: true });
classSchema.index({ mainTeacher: 1 });

studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ classId: 1, schoolId: 1 });
```

### 8.2 Query Optimization
```javascript
// Esempio query ottimizzata con select e populate
const getClassDetails = async (classId) => {
  return Class.findById(classId)
    .select('year section academicYear')
    .populate('mainTeacher', 'firstName lastName email')
    .populate('students', 'firstName lastName email')
    .lean();
};
```

## 9. Logging

### 9.1 Log Levels
```javascript
{
  error: 0,    // Errori critici
  warn: 1,     // Warning
  info: 2,     // Info generali
  http: 3,     // Richieste HTTP
  debug: 4     // Debug dettagliato
}
```

### 9.2 Log Format
```javascript
{
  timestamp: '2025-01-08T10:00:00.000Z',
  level: 'info',
  message: 'Request completed',
  metadata: {
    method: 'POST',
    path: '/api/v1/schools',
    statusCode: 201,
    duration: '123ms'
  }
}
```

## 10. Debug & Troubleshooting

### 10.1 Common Error Scenarios
```javascript
// 1. Errori di Autenticazione
{
  code: 'AUTH_001',
  possibleCauses: [
    'Token JWT mancante',
    'Token scaduto',
    'Token malformato'
  ],
  debugSteps: [
    'Verificare presenza header Authorization',
    'Controllare validità token su jwt.io',
    'Verificare timezone server per scadenza token'
  ]
}

// 2. Errori Database
{
  code: 'DB_001',
  possibleCauses: [
    'Violazione unique constraint',
    'Validazione schema fallita',
    'Riferimenti invalidi (ObjectId)'
  ],
  debugSteps: [
    'Controllare log MongoDB per errori specifici',
    'Verificare integrità dati con db.collection.validate()',
    'Controllare indici con db.collection.getIndexes()'
  ]
}

// 3. Errori Validazione
{
  code: 'VAL_001',
  location: 'middleware/validation/',
  debugSteps: [
    'Controllare req.body completo nei log',
    'Verificare schema validazione',
    'Controllare sanitizzazione input'
  ]
}
```

### 10.2 Logging Chiave per Debug
```javascript
// Location log files
/logs/
  ├── error.log     // Errori critici e stack traces
  ├── combined.log  // Tutti i log livello info e superiore
  └── access.log    // Log richieste HTTP

// Query per log rilevanti
grep "ERROR" /logs/error.log | tail -n 50
grep "studentId: ${studentId}" /logs/combined.log
```

### 10.3 Punti di Monitoraggio Critici
```javascript
// 1. Performance Query
mongoQueryTimes = {
  threshold: 200, // ms
  logLocation: 'logs/slow-queries.log'
}

// 2. Memory Usage
memoryThresholds = {
  warning: 80, // % usage
  critical: 90,
  logLocation: 'logs/system-metrics.log'
}

// 3. Response Times
apiResponseTimes = {
  warning: 1000, // ms
  critical: 3000,
  logLocation: 'logs/api-metrics.log'
}
```

### 10.4 Procedure di Recovery
```javascript
// 1. Corrupt Student-Class Association
async function fixStudentClassAssociation(studentId) {
  // 1. Backup current state
  // 2. Fix references
  // 3. Rebuild history
}

// 2. Inconsistent User-School Relationship
async function reconcileUserSchoolRelationship(userId) {
  // Steps to fix...
}

// 3. Orphaned Data Cleanup
async function cleanupOrphanedData() {
  // Steps to clean...
}
```

### 10.5 Testing Tools & Scripts
```javascript
// 1. Load Testing
loadTest = {
  tool: 'artillery',
  configFile: 'tests/load/config.yml',
  command: 'npm run test:load'
}

// 2. Integration Tests
integrationTest = {
  command: 'npm run test:integration',
  coverage: 'npm run test:coverage'
}

// 3. Database Seeding
dbSeed = {
  command: 'npm run db:seed',
  testData: 'tests/fixtures/'
}
```

## 11. Performance & Scalability

### 11.1 Benchmark Operazioni
```javascript
// 1. Read Operations (ms)
const benchmarks = {
  queries: {
    findStudentById: {
      avg: 45,
      p95: 120,
      limit: 200,
      optimizationTips: [
        'Usare .select() per limitare campi',
        'Evitare deep populate',
        'Utilizzare indici compound per filtri comuni'
      ]
    },
    listClassStudents: {
      avg: 150,
      p95: 300,
      limit: 500,
      optimizationTips: [
        'Implementare paginazione',
        'Utilizzare lean() per query di sola lettura',
        'Cache risultati frequenti'
      ]
    },
    schoolStatistics: {
      avg: 250,
      p95: 500,
      limit: 1000,
      optimizationTips: [
        'Utilizzare aggregation pipeline',
        'Implementare materialized views',
        'Cache con invalidazione temporale'
      ]
    }
  },
  
  // 2. Write Operations (ms)
  mutations: {
    createStudent: {
      avg: 100,
      p95: 200,
      limit: 400,
      optimizationTips: [
        'Batch operations per inserimenti multipli',
        'Validazione ottimizzata',
        'Transaction management per operazioni correlate'
      ]
    },
    updateClass: {
      avg: 120,
      p95: 250,
      limit: 450,
      optimizationTips: [
        'Utilizzare updateMany per bulk updates',
        'Minimizzare campi aggiornati',
        'Implementare partial updates'
      ]
    }
  }
};

// 3. Batch Operations (items/sec)
const batchLimits = {
  studentImport: 1000,
  classAssignment: 500,
  gradeUpdate: 2000
};
```

### 11.2 Limiti Sistema
```javascript
// 1. Limiti Operativi
const systemLimits = {
  maxConcurrentUsers: 1000,
  maxRequestsPerMinute: 3000,
  maxPayloadSize: '10MB',
  maxFileUploadSize: '5MB',
  maxBatchSize: 1000,
  
  database: {
    maxConnections: 100,
    queryTimeout: 30000,
    maxPoolSize: 10
  },
  
  cache: {
    defaultTTL: 3600,
    maxSize: '1GB',
    maxKeys: 10000
  }
};

// 2. Limiti Business Logic
const businessLimits = {
  maxStudentsPerClass: 30,
  maxClassesPerSchool: 100,
  maxTeachersPerClass: 10,
  maxActiveTests: 5
};

// 3. Rate Limiting
const rateLimits = {
  api: {
    window: '15m',
    max: 100,
    message: 'Too many requests'
  },
  auth: {
    window: '1h',
    max: 5,
    message: 'Too many login attempts'
  }
};
```

### 11.3 Metriche da Monitorare
```javascript
// 1. System Metrics
const systemMetrics = {
  memory: {
    check: 'process.memoryUsage()',
    alert: 'usage > 80%',
    action: 'Implement cleanup or scale'
  },
  cpu: {
    check: 'process.cpuUsage()',
    alert: 'usage > 70%',
    action: 'Optimize heavy operations'
  },
  diskSpace: {
    check: 'df -h',
    alert: 'usage > 85%',
    action: 'Cleanup old logs/implement rotation'
  }
};

// 2. Application Metrics
const appMetrics = {
  activeUsers: {
    method: 'COUNT active sessions',
    interval: '5m',
    threshold: 1000
  },
  responseTime: {
    method: 'AVG response_time',
    interval: '1m',
    threshold: 500
  },
  errorRate: {
    method: 'COUNT errors / COUNT requests',
    interval: '5m',
    threshold: 0.05
  }
};

// 3. Database Metrics
const dbMetrics = {
  connections: {
    current: 'db.serverStatus().connections',
    available: 'db.serverStatus().connections.available',
    threshold: '80%'
  },
  queryTime: {
    slow: 'mongotop',
    threshold: '200ms'
  },
  indexes: {
    size: 'db.stats()',
    usage: 'db.collection.aggregate([{$indexStats: {}}])'
  }
};
```

### 11.4 Strategie di Caching
```javascript
// 1. Cache Layers
const cacheLayers = {
  memory: {
    implementation: 'node-cache',
    use: 'Frequently accessed, small data sets',
    config: {
      stdTTL: 600,
      checkperiod: 120
    }
  },
  redis: {
    implementation: 'redis',
    use: 'Shared data, session storage',
    config: {
      host: 'localhost',
      port: 6379,
      maxReconnectAttempts: 10
    }
  }
};

// 2. Cache Policies
const cachePolicies = {
  student: {
    ttl: 3600,
    invalidation: ['UPDATE', 'DELETE'],
    strategy: 'write-through'
  },
  class: {
    ttl: 1800,
    invalidation: ['UPDATE_STUDENTS', 'UPDATE_TEACHERS'],
    strategy: 'write-behind'
  },
  school: {
    ttl: 7200,
    invalidation: ['UPDATE_CLASSES', 'UPDATE_TEACHERS'],
    strategy: 'write-through'
  }
};

// 3. Cache Keys
const cacheKeys = {
  student: (id) => `student:${id}`,
  class: (id) => `class:${id}`,
  school: (id) => `school:${id}`,
  classStudents: (classId) => `class:${classId}:students`,
  schoolTeachers: (schoolId) => `school:${schoolId}:teachers`
};

// 4. Implementation Examples
const cacheImplementation = {
  get: async (key) => {
    const cached = await cache.get(key);
    if (cached) {
      metrics.increment('cache.hit');
      return cached;
    }
    metrics.increment('cache.miss');
    return null;
  },
  
  set: async (key, value, ttl) => {
    await cache.set(key, value, ttl);
    metrics.increment('cache.set');
  },
  
  invalidate: async (pattern) => {
    const keys = await cache.keys(pattern);
    await Promise.all(keys.map(k => cache.del(k)));
    metrics.increment('cache.invalidate', keys.length);
  }
};
```

### 11.5 Scaling Strategies
```javascript
// 1. Vertical Scaling Thresholds
const verticalScaling = {
  cpu: {
    threshold: '70%',
    action: 'Increase CPU cores/power'
  },
  memory: {
    threshold: '80%',
    action: 'Increase RAM'
  },
  disk: {
    threshold: '85%',
    action: 'Increase storage'
  }
};

// 2. Horizontal Scaling
const horizontalScaling = {
  triggers: {
    concurrentUsers: 1000,
    responseTime: '500ms',
    errorRate: '5%'
  },
  implementation: {
    loadBalancer: 'nginx',
    strategy: 'least_conn',
    healthCheck: '/health'
  }
};

// 3. Database Scaling
const dbScaling = {
  sharding: {
    key: 'schoolId',
    collections: ['students', 'classes'],
    threshold: '100GB'
  },
  replication: {
    readPreference: 'secondaryPreferred',
    writeContern: 'majority'
  }
};
```

## 12. Environment Variables

```bash
# Server
PORT=5000
HOST=localhost
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/brainScannerDB
DB_NAME=brainScannerDB

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug
LOG_FILE=app.log

# Frontend
FRONTEND_URL=http://localhost:3000
```