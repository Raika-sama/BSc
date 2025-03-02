# Architettura e Funzionamento del Sistema di Gestione Sezioni Scolastiche

## Introduzione

Questo documento fornisce una panoramica dettagliata dell'architettura e del funzionamento del sistema di gestione delle sezioni scolastiche all'interno della piattaforma di test psicoattitudinali. Il documento descrive come le sezioni si collegano alle classi, agli studenti e agli utenti (insegnanti/amministratori), con particolare attenzione ai flussi di attivazione/disattivazione e alle relazioni tra le entità.

## Modello dei Dati

### Entità Principali

Il sistema è organizzato secondo una gerarchia precisa:

1. **Scuola** (School)
2. **Sezione** (Section, parte del documento School)
3. **Classe** (Class)
4. **Studente** (Student)
5. **Utente** (User: insegnanti, amministratori, manager)

### Schema delle Relazioni

```
School
  |
  ├── Sections[] (embedded document)
  |     |
  |     └── academicYears[] (configurazione per anno)
  |
  ├── academicYears[] (anni accademici attivi/pianificati/archiviati)
  |
  └── users[] (utenti associati alla scuola)
        |
        └── manager (responsabile principale della scuola)

Class
  |
  ├── schoolId → School
  ├── section (riferimento alla sezione, es. "A")
  ├── year (anno scolastico: 1-5 per superiori, 1-3 per medie)
  ├── academicYear (es. "2024/2025")
  ├── mainTeacher → User (insegnante principale)
  ├── teachers[] → User (altri insegnanti)
  └── students[] (registro studenti della classe con stato)

Student
  |
  ├── schoolId → School
  ├── classId → Class (classe corrente)
  ├── section (sezione corrente, es. "A")
  ├── mainTeacher → User (insegnante principale)
  ├── teachers[] → User (altri insegnanti)
  └── classChangeHistory[] (storico cambi classe/sezione)

User
  |
  ├── assignedSchoolIds[] → School (scuole assegnate)
  ├── assignedClassIds[] → Class (classi assegnate)
  └── assignedStudentIds[] → Student (studenti assegnati)
```

## Struttura Dettagliata degli Schemi

### Schema School

```javascript
const schoolSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    schoolType: { type: String, enum: ['middle_school', 'high_school'] },
    institutionType: { type: String, enum: ['scientific', 'classical', 'artistic', 'none'] },
    
    // Sezioni
    sections: [{
        name: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        maxStudents: { type: Number, min: 15, max: 35 },
        academicYears: [{
            year: String,
            status: { type: String, enum: ['active', 'planned', 'archived'] },
            maxStudents: { type: Number, min: 15, max: 35 }
        }],
        createdAt: { type: Date, default: Date.now },
        deactivatedAt: Date
    }],
    
    // Anni accademici
    academicYears: [{
        year: { type: String, required: true },
        status: { type: String, enum: ['active', 'planned', 'archived'] },
        startDate: Date,
        endDate: Date,
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    
    // Gestione utenti
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    users: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['teacher', 'admin'] }
    }],
    
    // Configurazione
    defaultMaxStudentsPerClass: { type: Number, default: 25, min: 15, max: 35 },
    isActive: { type: Boolean, default: true }
});
```

### Schema Class

```javascript
const classSchema = new mongoose.Schema({
    // Identificazione
    year: { type: Number, required: true, min: 1, max: 5 },
    section: { type: String, required: true, validate: /^[A-Z]$/ },
    academicYear: { type: String, required: true },
    
    // Stato
    status: { type: String, enum: ['active', 'planned', 'archived'], default: 'planned' },
    isActive: { type: Boolean, default: true },
    
    // Relazioni
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    mainTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mainTeacherIsTemporary: { type: Boolean, default: false },
    previousMainTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Studenti
    students: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        joinedAt: { type: Date, default: Date.now },
        leftAt: Date,
        status: { type: String, enum: ['active', 'transferred', 'graduated'], default: 'active' }
    }],
    
    // Configurazione
    capacity: { type: Number, required: true, min: 1 },
    notes: String
});
```

### Schema Student

```javascript
const studentSchema = new mongoose.Schema({
    // Dati anagrafici
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    
    // Relazioni istituzionali
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    section: { type: String, validate: /^[A-Z]$/ },
    
    // Insegnanti associati
    mainTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Stato
    status: { type: String, enum: ['pending', 'active', 'inactive', 'transferred', 'graduated', 'unregistered'], default: 'pending' },
    needsClassAssignment: { type: Boolean, default: true },
    
    // Storico
    lastClassChangeDate: { type: Date },
    classChangeHistory: [{
        fromClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
        toClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
        fromSection: String,
        toSection: String,
        fromYear: Number,
        toYear: Number,
        date: { type: Date, default: Date.now },
        reason: String,
        academicYear: String
    }]
});
```

### Schema User

```javascript
const userSchema = new mongoose.Schema({
    // Dati personali
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'teacher', 'manager'] },
    
    // Relazioni con entità
    assignedSchoolIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'School' }],
    assignedClassIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    assignedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});
```

## Flussi Operativi Principali

### 1. Creazione e Configurazione delle Sezioni

1. **Creazione Scuola**: La scuola viene creata con informazioni di base.
2. **Configurazione Anno Accademico**: Viene configurato un anno accademico (es. "2024/2025").
3. **Creazione Sezioni**: Vengono create le sezioni (es. A, B, C) con parametri come numero massimo di studenti.
4. **Creazione Classi**: Per ogni sezione vengono create le classi per i diversi anni (es. 1A, 2A, 3A).

### 2. Attivazione/Disattivazione di una Sezione

#### Disattivazione di una Sezione

Quando una sezione viene disattivata, vengono eseguite queste operazioni in sequenza:

1. **Aggiornamento della Sezione nella Scuola**:
   - `isActive` viene impostato a `false`
   - `deactivatedAt` viene impostato alla data corrente
   - L'array `students` viene svuotato

2. **Raccolta delle Informazioni Preliminari**:
   - Vengono identificate tutte le classi attive della sezione
   - Vengono raccolti gli ID degli insegnanti (mainTeacher e teachers)
   - Vengono identificati tutti gli studenti associati alle classi

3. **Disattivazione delle Classi**:
   - Per ogni classe:
     - Il campo `isActive` viene impostato a `false`
     - Il campo `status` viene impostato a `archived`
     - Il campo `mainTeacher` viene copiato in `previousMainTeacher` e poi impostato a `null`
     - L'array `teachers` viene svuotato
     - L'array `students` viene svuotato

4. **Aggiornamento degli Studenti**:
   - Per tutti gli studenti delle classi disattivate:
     - `classId` viene impostato a `null`
     - `section` viene impostato a `null`
     - `currentYear` viene impostato a `null`
     - `mainTeacher` viene impostato a `null`
     - L'array `teachers` viene svuotato
     - `status` viene impostato a `pending`
     - `needsClassAssignment` viene impostato a `true`
     - Viene aggiunto un record nella `classChangeHistory`

5. **Aggiornamento degli Utenti (Insegnanti)**:
   - Per tutti gli insegnanti coinvolti:
     - Le classi disattivate vengono rimosse dall'array `assignedClassIds`
     - Gli studenti disassociati vengono rimossi dall'array `assignedStudentIds`

#### Riattivazione di una Sezione

Quando una sezione viene riattivata:

1. **Aggiornamento della Sezione nella Scuola**:
   - `isActive` viene impostato a `true`
   - `deactivatedAt` viene impostato a `undefined`

2. **Riattivazione delle Classi**:
   - Vengono cercate le classi disattivate della sezione
   - Per ogni classe:
     - `isActive` viene impostato a `true`
     - `status` viene impostato a `planned`
     - Se `previousMainTeacher` esiste, viene ripristinato come `mainTeacher`
     - Altrimenti, il manager della scuola viene assegnato come `mainTeacher`

3. **Ripristino delle Associazioni con gli Utenti**:
   - Le classi riattivate vengono aggiunte nuovamente agli array `assignedClassIds` degli insegnanti appropriati

### 3. Gestione degli Insegnanti

#### Aggiunta di un Insegnante Principale (mainTeacher) a una Classe

1. La classe viene aggiornata con il nuovo `mainTeacher`
2. Tutti gli studenti della classe vengono aggiornati per avere lo stesso `mainTeacher`
3. L'insegnante ha la classe aggiunta al suo array `assignedClassIds`
4. L'insegnante ha gli studenti aggiunti al suo array `assignedStudentIds`

#### Rimozione di un Insegnante Principale da una Classe

1. L'ID dell'insegnante viene salvato in `previousMainTeacher`
2. `mainTeacher` viene impostato a `null`
3. `mainTeacherIsTemporary` viene impostato a `true`
4. Gli studenti vengono aggiornati rimuovendo il riferimento all'insegnante
5. L'insegnante ha la classe rimossa dal suo array `assignedClassIds`
6. L'insegnante ha gli studenti rimossi dal suo array `assignedStudentIds`

### 4. Gestione degli Studenti

#### Assegnazione di uno Studente a una Classe

1. Lo studente viene aggiornato con:
   - `classId` della nuova classe
   - `section` della classe
   - `mainTeacher` della classe
   - `teachers` della classe
   - `status` impostato a `active`
   - `needsClassAssignment` impostato a `false`
   - Un nuovo record in `classChangeHistory`

2. La classe viene aggiornata aggiungendo lo studente all'array `students`

3. Gli insegnanti della classe vengono aggiornati aggiungendo lo studente ai loro array `assignedStudentIds`

#### Rimozione di uno Studente da una Classe

1. Lo studente viene aggiornato:
   - `classId` impostato a `null`
   - `section` impostato a `null`
   - `mainTeacher` impostato a `null`
   - `teachers` svuotato
   - `status` impostato a `inactive` o `pending`
   - `needsClassAssignment` impostato a `true`
   - Un nuovo record in `classChangeHistory`

2. La classe viene aggiornata rimuovendo lo studente dall'array `students`

3. Gli insegnanti vengono aggiornati rimuovendo lo studente dai loro array `assignedStudentIds`

## Implementazione Tecnica

### Repository Pattern

Il sistema utilizza il pattern Repository per incapsulare la logica di accesso ai dati:

- **SchoolRepository**: Gestisce le operazioni relative alle scuole e alle sezioni
- **ClassRepository**: Gestisce le operazioni relative alle classi
- **StudentRepository**: Gestisce le operazioni relative agli studenti

### Transazioni MongoDB

Le operazioni complesse che coinvolgono più entità utilizzano le transazioni MongoDB per garantire l'atomicità:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
    // Operazioni multiple...
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

### Metodi Chiave per la Gestione delle Sezioni

#### SchoolRepository.deactivateSection

```javascript
async deactivateSection(schoolId, sectionName) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Aggiorna la sezione nella scuola
        const school = await this.model.findOneAndUpdate(
            { _id: schoolId, 'sections.name': sectionName },
            {
                $set: {
                    'sections.$.isActive': false,
                    'sections.$.deactivatedAt': new Date()
                }
            },
            { new: true, session }
        );

        // 2. Raccolta informazioni sulle classi e studenti
        const activeClasses = await Class.find({
            schoolId,
            section: sectionName,
            isActive: true
        }).session(session);

        const teacherIds = new Set();
        const classIds = [];
        const studentIds = [];
        
        // Raccolta IDs...

        // 3. Disattiva le classi
        await this.classRepository.deactivateClassesBySection(schoolId, sectionName, session);

        // 4. Aggiorna gli studenti
        await this.studentRepository.updateStudentsForDeactivatedSection(schoolId, sectionName);

        // 5. Aggiorna i riferimenti negli utenti
        await User.updateMany(
            { _id: { $in: Array.from(teacherIds) } },
            { 
                $pull: { 
                    assignedClassIds: { $in: classIds },
                    assignedStudentIds: { $in: studentIds }
                }
            },
            { session }
        );

        await session.commitTransaction();
        return { school };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
```

#### ClassRepository.deactivateClassesBySection

```javascript
async deactivateClassesBySection(schoolId, sectionName, session) {
    // Trova tutte le classi della sezione
    const classes = await this.model.find({
        schoolId,
        section: sectionName,
        isActive: true
    }).session(session);

    // Aggiorna lo stato delle classi
    for (const classDoc of classes) {
        classDoc.previousMainTeacher = classDoc.mainTeacher;
        classDoc.isActive = false;
        classDoc.status = 'archived';
        classDoc.deactivatedAt = new Date();
        classDoc.mainTeacher = null;
        classDoc.teachers = [];
        classDoc.students = [];
        
        await classDoc.save({ session });
    }

    return classes;
}
```

#### StudentRepository.updateStudentsForDeactivatedSection

```javascript
async updateStudentsForDeactivatedSection(schoolId, sectionName) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Trova le classi della sezione
        const classes = await Class.find({
            schoolId,
            section: sectionName,
            isActive: true
        }).session(session);

        const classIds = classes.map(c => c._id);

        // Aggiorna gli studenti
        const result = await this.model.updateMany(
            {
                schoolId,
                classId: { $in: classIds },
                isActive: true
            },
            {
                $set: {
                    classId: null,
                    section: null,
                    currentYear: null,
                    mainTeacher: null,
                    teachers: [],
                    status: 'pending',
                    needsClassAssignment: true,
                    lastClassChangeDate: new Date()
                },
                $push: {
                    classChangeHistory: {
                        fromSection: sectionName,
                        date: new Date(),
                        reason: 'Sezione disattivata',
                        academicYear: classes[0]?.academicYear
                    }
                }
            },
            { session }
        );

        await session.commitTransaction();
        return { modifiedCount: result.modifiedCount };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
```

## Frontend (React)

Il frontend utilizza un Context API (`SchoolContext.js`) per gestire lo stato e le operazioni sulle scuole:

```javascript
const deactivateSection = async (schoolId, sectionName) => {
    try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.post(
            `/schools/${schoolId}/sections/${sectionName}/deactivate`
        );

        if (response.data.status === 'success') {
            const { school, studentsUpdated } = response.data.data;
            setSelectedSchool(school);

            showNotification(
                `Sezione disattivata con successo. ${studentsUpdated} studenti aggiornati.`,
                'success'
            );
            return response.data.data;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || 
                        'Errore nella disattivazione della sezione';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        throw error;
    } finally {
        setLoading(false);
    }
};
```

## Punti di Attenzione e Best Practices

### 1. Mantenimento della Coerenza dei Dati

È fondamentale garantire che tutte le relazioni bidirezionali rimangano sincronizzate:

- Quando una classe viene disattivata, deve essere rimossa da `assignedClassIds` degli utenti
- Quando uno studente viene disassociato da una classe, deve essere rimosso da `assignedStudentIds` degli utenti
- Quando un insegnante viene rimosso, tutti i riferimenti a quell'insegnante devono essere aggiornati

### 2. Uso delle Transazioni

Per operazioni che coinvolgono più entità, è essenziale utilizzare le transazioni MongoDB per garantire che le modifiche siano atomiche:

- Se un'operazione fallisce, tutte le modifiche devono essere annullate (rollback)
- Tutte le operazioni all'interno della stessa unità logica di lavoro devono utilizzare la stessa sessione di transazione

### 3. Gestione delle Sessioni di Transazione

È importante gestire correttamente le sessioni di transazione:

- Evitare transazioni annidate (una sessione per operazione logica)
- Assicurarsi che le transazioni vengano chiuse correttamente, anche in caso di errori
- Passare la sessione di transazione a tutti i metodi che operano nella stessa transazione

### 4. Logging Completo

Implementare un logging dettagliato per facilitare il debug:

- Registrare l'inizio e la fine di ogni operazione complessa
- Registrare il numero di documenti aggiornati
- In caso di errore, registrare tutti i dettagli pertinenti

## Conclusione

Il sistema di gestione delle sezioni è un componente centrale della piattaforma di test psicoattitudinali per le scuole. La corretta gestione delle relazioni tra scuole, sezioni, classi, studenti e utenti è fondamentale per il funzionamento dell'intero sistema.

La disattivazione e riattivazione delle sezioni sono operazioni complesse che richiedono un'attenta gestione per mantenere la coerenza dei dati. L'implementazione corretta di queste operazioni garantisce che tutti i riferimenti tra le diverse entità rimangano sincronizzati, evitando riferimenti orfani o incongruenze nei dati.
