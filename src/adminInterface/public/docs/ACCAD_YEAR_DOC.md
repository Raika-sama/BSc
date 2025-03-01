# Gestione Anno Accademico

## Modello Dati

### Schema Anno Accademico

```javascript
const academicYearSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{4}\/\d{4}$/.test(v);
            },
            message: 'Anno accademico deve essere nel formato YYYY/YYYY'
        }
    },
    status: {
        type: String,
        enum: ['active', 'planned', 'archived'],
        default: 'planned'
    },
    startDate: Date,
    endDate: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});
```

Ogni anno accademico contiene:
- **year**: Stringa nel formato "YYYY/YYYY" (es. "2023/2024")
- **status**: Stato dell'anno accademico
  - `active`: Anno corrente
  - `planned`: Anno futuro
  - `archived`: Anno concluso
- **startDate**: Data di inizio dell'anno
- **endDate**: Data di fine dell'anno
- **createdAt**: Data di creazione del record
- **createdBy**: Riferimento all'utente che ha creato l'anno accademico

### Schema Sezione-Anno Accademico

```javascript
const sectionAcademicYearSchema = new mongoose.Schema({
    year: String,
    status: {
        type: String,
        enum: ['active', 'planned', 'archived'],
        default: 'planned'
    },
    maxStudents: {
        type: Number,
        min: 15,
        max: 35
    },
    activatedAt: Date,
    deactivatedAt: Date,
    notes: String
});
```

Questo schema associa una sezione a un anno accademico specifico, permettendo di:
- Definire stati diversi per sezione per ogni anno
- Specificare il numero massimo di studenti per l'anno
- Registrare quando la sezione è stata attivata o disattivata
- Aggiungere note specifiche

## API per la Gestione dell'Anno Accademico

### Recupero Anni Accademici

**Endpoint**: `GET /api/schools/:id/academic-years`

**Controller**:
```javascript
async getAcademicYears(req, res) {
    try {
        const schoolId = req.params.id;
        const school = await this.repository.findById(schoolId);
        this.sendResponse(res, { academicYears: school.academicYears });
    } catch (error) {
        this.sendError(res, error);
    }
}
```

**Funzionamento**:
1. Recupera l'ID della scuola dalla richiesta
2. Trova la scuola completa tramite repository
3. Estrae e restituisce l'array degli anni accademici

**Utilizzo**: Utilizzato per visualizzare l'elenco degli anni accademici di una scuola, come nella tab "AcademicYearsTab" del frontend.

### Aggiunta di un Nuovo Anno Accademico

**Endpoint**: `POST /api/schools/:id/academic-years`

**Controller**:
```javascript
async setupAcademicYear(req, res) {
    try {
        const schoolId = req.params.id;
        const yearData = {
            year: req.body.year,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            status: req.body.status || 'planned',
            createdBy: req.user.id
        };
        
        const school = await this.repository.setupAcademicYear(schoolId, yearData);
        this.sendResponse(res, { school });
    } catch (error) {
        this.sendError(res, error);
    }
}
```

**Repository**:
```javascript
async setupAcademicYear(schoolId, yearData) {
    // Valida il formato dell'anno accademico
    const yearFormat = /^\d{4}\/\d{4}$/;
    if (!yearFormat.test(yearData.year)) {
        throw new Error(ErrorTypes.VALIDATION.INVALID_INPUT.message);
    }
    try {
        return await this.model.findByIdAndUpdate(
            schoolId,
            {
                $push: {
                    academicYears: {
                        year: yearData.year,
                        status: yearData.status || 'planned',
                        startDate: yearData.startDate,
                        endDate: yearData.endDate,
                        createdBy: yearData.createdBy
                    }
                }
            },
            { new: true }
        );
    } catch (error) {
        logger.error('Error in setupAcademicYear:', error);
        throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nella configurazione anno accademico'
        );
    }
}
```

**Funzionamento**:
1. Riceve i dati del nuovo anno accademico dal client
2. Costruisce un oggetto con anno, date, stato e creatore
3. Valida il formato dell'anno (deve essere YYYY/YYYY)
4. Aggiunge il nuovo anno accademico all'array `academicYears` della scuola
5. Restituisce la scuola aggiornata

**Utilizzo**: Utilizzato dagli amministratori per aggiungere un nuovo anno accademico alla scuola.

### Configurazione Iniziale della Scuola

**Endpoint**: `POST /api/schools/:id/setup`

**Controller**:
```javascript
async setupInitialConfiguration(req, res) {
    try {
        if (!req.user) {
            return this.sendError(res, {
                statusCode: 401,
                message: 'Authentication required'
            });
        }

        const { academicYear, sections } = req.body;
        const schoolId = req.params.id;

        // Verifica i dati richiesti
        if (!academicYear || !sections || !sections.length) {
            return this.sendError(res, {
                statusCode: 400,
                message: 'Missing required data'
            });
        }

        const academicYearSetup = await this.repository.setupAcademicYear(schoolId, {
            year: academicYear,
            status: 'active',
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            createdBy: req.user.id
        });

        const { sections: configuredSections } = await this.repository.configureSections(
            schoolId, 
            sections
        );

        await this.classRepository.createInitialClasses(
            schoolId,
            academicYear,
            sections
        );

        return this.sendResponse(res, {
            academicYear: academicYearSetup,
            sections: configuredSections
        });
    } catch (error) {
        logger.error('Setup configuration error:', error);
        return this.sendError(res, {
            statusCode: error.statusCode || 500,
            message: error.message
        });
    }
}
```

**Repository (configureSections)**:
```javascript
async configureSections(schoolId, sectionsData) {
    // Valida il formato delle sezioni
    const sectionFormat = /^[A-Z]$/;
    const invalidSections = sectionsData.some(section => !sectionFormat.test(section.name));
    if (invalidSections) {
        throw new Error(ErrorTypes.VALIDATION.INVALID_INPUT.message);
    }

    try {
        const school = await this.findById(schoolId);
        if (!school) {
            throw createError(ErrorTypes.NOT_FOUND, 'School not found');
        }

        // Crea le sezioni con la struttura corretta
        const sections = sectionsData.map(section => ({
            name: section.name,
            isActive: true,
            academicYears: [{
                status: 'active',
                maxStudents: section.maxStudents
            }],
            createdAt: new Date()
        }));

        // Aggiorna la scuola con le nuove sezioni
        school.sections = sections;
        const updatedSchool = await school.save();

        // Restituisci le sezioni in un formato che corrisponde ai test
        return {
            sections: updatedSchool.sections.map(section => ({
                name: section.name,
                academicYears: section.academicYears
            }))
        };
    } catch (error) {
        logger.error('Error in configureSections:', error);
        throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nella configurazione sezioni'
        );
    }
}
```

**Funzionamento**:
1. Riceve i dati di setup iniziale (anno accademico e sezioni)
2. Crea l'anno accademico iniziale con stato `active`
3. Configura le sezioni della scuola
4. Crea le classi iniziali per ogni sezione
5. Restituisce i dati di configurazione

**Utilizzo**: Durante l'onboarding di una nuova scuola, per impostare l'anno accademico iniziale e le sezioni.

## Gestione delle Sezioni per Anno Accademico

### Aggiornamento Stato Sezione per Anno

```javascript
async updateSectionStatus(schoolId, sectionName, yearData) {
    try {
        return await this.model.findOneAndUpdate(
            { 
                _id: schoolId,
                'sections.name': sectionName 
            },
            {
                $push: {
                    'sections.$.academicYears': {
                        year: yearData.year,
                        status: yearData.status,
                        maxStudents: yearData.maxStudents
                    }
                }
            },
            { new: true }
        );
    } catch (error) {
        logger.error('Error in updateSectionStatus:', error);
        throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nell\'aggiornamento stato sezione'
        );
    }
}
```

**Funzionamento**:
1. Trova una sezione specifica all'interno di una scuola
2. Aggiunge un nuovo anno accademico all'array `academicYears` della sezione
3. Specifica lo stato e il numero massimo di studenti per quell'anno

**Utilizzo**: Per aggiornare lo stato di una sezione quando cambia l'anno accademico.

### Disattivazione di una Sezione

**Controller**:
```javascript
async deactivateSection(req, res) {
    try {
        const { schoolId, sectionName } = req.params;

        logger.debug('Controller: Inizio deactivateSection', {
            schoolId,
            sectionName,
            hasRepository: !!this.repository,
            hasClassRepository: !!this.repository.classRepository // Verifica se classRepository è definito
        });

        // 1. Prima recupera gli studenti che saranno impattati
        const students = await this.repository.getStudentsBySection(schoolId, sectionName);
        
        // 2. Disattiva la sezione
        const updatedSchool = await this.repository.deactivateSection(schoolId, sectionName);
        
        // 3. Aggiorna gli studenti
        const studentUpdateResult = await this.studentRepository.updateStudentsForDeactivatedSection(
            schoolId, 
            sectionName
        );

        logger.info('Sezione disattivata con successo:', {
            schoolId,
            sectionName,
            studentsUpdated: studentUpdateResult.modifiedCount
        });

        this.sendResponse(res, {
            message: 'Sezione disattivata con successo',
            studentsUpdated: studentUpdateResult.modifiedCount,
            school: updatedSchool
        });

    } catch (error) {
        logger.error('Errore nella disattivazione della sezione:', {
            error: error.message,
            stack: error.stack
        });
        this.sendError(res, error);
    }
}
```

**Repository**:
```javascript
async deactivateSection(schoolId, sectionName) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.debug('Repository: Inizio deactivateSection', {
            schoolId,
            sectionName,
            hasClassRepository: !!this.classRepository, 
            hasStudentRepository: !!this.studentRepository
        });    
        // 1. Aggiorna la sezione nella scuola
        const school = await this.model.findOneAndUpdate(
            { 
                _id: schoolId,
                'sections.name': sectionName 
            },
            {
                $set: {
                    'sections.$.isActive': false,
                    'sections.$.deactivatedAt': new Date(),
                    'sections.$.students': [] // Svuota l'array degli studenti nella sezione
                }
            },
            { 
                new: true,
                session 
            }
        );

        if (!school) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Scuola o sezione non trovata'
            );
        }

        // 2. Disattiva le classi usando il metodo dedicato nel classRepository
        await this.classRepository.deactivateClassesBySection(schoolId, sectionName, session);

        // 3. Aggiorna gli studenti usando il metodo dedicato nel studentRepository
        const studentUpdateResult = await this.studentRepository.updateStudentsForDeactivatedSection(
            schoolId, 
            sectionName
        );

        await session.commitTransaction();
        
        logger.debug('Section deactivation completed successfully:', {
            schoolId,
            sectionName,
            studentsUpdated: studentUpdateResult.modifiedCount
        });

        return {
            school,
            studentsUpdated: studentUpdateResult.modifiedCount
        };
    } catch (error) {
        await session.abortTransaction();
        logger.error('Error in deactivateSection:', {
            error: error.message,
            schoolId,
            sectionName
        });
        throw error;
    } finally {
        session.endSession();
    }
}
```

**Funzionamento**:
1. Avvia una transazione MongoDB per garantire l'integrità dei dati
2. Aggiorna la sezione nella scuola, impostandola come inattiva
3. Disattiva tutte le classi associate a quella sezione
4. Aggiorna gli studenti che appartenevano a quella sezione
5. Conferma la transazione se tutto va bene, la annulla in caso di errori

**Utilizzo**: Per disattivare una sezione che non sarà più utilizzata, aggiornando di conseguenza classi e studenti.

### Riattivazione di una Sezione

**Controller**:
```javascript
async reactivateSection(req, res) {
    try {
        const { schoolId, sectionName } = req.params;
        
        logger.debug('Controller: Richiesta riattivazione sezione', {
            schoolId,
            sectionName,
            userId: req.user?.id
        });

        const result = await this.repository.reactivateSection(schoolId, sectionName);

        this.sendResponse(res, {
            status: 'success',
            data: {
                school: result.school,
                classesReactivated: result.classesReactivated
            }
        });

    } catch (error) {
        logger.error('Controller: Errore nella riattivazione sezione', {
            error: error.message,
            schoolId: req.params.schoolId,
            sectionName: req.params.sectionName
        });
        this.sendError(res, error);
    }
}
```

**Repository**:
```javascript
async reactivateSection(schoolId, sectionName) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.debug('Repository: Inizio reactivateSection', { 
            schoolId, 
            sectionName 
        });

        // 1. Recupera la scuola con il manager
        const school = await this.model.findById(schoolId)
            .populate('manager')
            .session(session);

        if (!school) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Scuola non trovata'
            );
        }

        // 2. Trova e valida la sezione
        const section = school.sections.find(s => s.name === sectionName);
        if (!section) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Sezione non trovata'
            );
        }

        // 3. Aggiorna lo stato della sezione
        section.isActive = true;
        section.deactivatedAt = undefined;

        // 4. Trova le classi da riattivare
        const classesToReactivate = await Class.find({
            schoolId,
            section: sectionName,
            isActive: false
        }).session(session);

        logger.debug('Classi da riattivare trovate:', {
            count: classesToReactivate.length,
            classi: classesToReactivate.map(c => ({
                id: c._id,
                year: c.year,
                section: c.section,
                hasPreviousMainTeacher: !!c.previousMainTeacher
            }))
        });

        // 5. Aggiorna ogni classe
        for (const classDoc of classesToReactivate) {
            // Gestione mainTeacher
            if (classDoc.previousMainTeacher) {
                classDoc.mainTeacher = classDoc.previousMainTeacher;
                classDoc.previousMainTeacher = undefined;
            } else {
                // Se non c'è un mainTeacher precedente, usa il manager della scuola
                classDoc.mainTeacher = school.manager._id;
            }

            // Aggiorna gli altri campi della classe
            classDoc.isActive = true;
            classDoc.status = 'planned';
            classDoc.deactivatedAt = undefined;
            classDoc.updatedAt = new Date();

            await classDoc.save({ session });
        }

        // 6. Salva le modifiche alla scuola
        const updatedSchool = await school.save({ session });

        await session.commitTransaction();

        logger.info('Sezione e classi riattivate con successo:', {
            schoolId,
            sectionName,
            classesReactivated: classesToReactivate.length,
            classesWithPreviousTeacher: classesToReactivate.filter(c => c.previousMainTeacher).length,
            classesWithManagerAsTeacher: classesToReactivate.filter(c => 
                c.mainTeacher.toString() === school.manager._id.toString()
            ).length
        });

        return {
            school: updatedSchool,
            classesReactivated: classesToReactivate.length
        };

    } catch (error) {
        await session.abortTransaction();
        logger.error('Errore nella riattivazione della sezione:', {
            error: error.message,
            stack: error.stack,
            schoolId,
            sectionName
        });
        throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nella riattivazione della sezione',
            { originalError: error.message }
        );
    } finally {
        session.endSession();
    }
}
```

**Funzionamento**:
1. Avvia una transazione MongoDB
2. Recupera la scuola con il suo manager
3. Trova e riattiva la sezione
4. Trova tutte le classi disattivate associate alla sezione
5. Per ogni classe:
   - Se aveva un insegnante principale precedente, lo ripristina
   - Altrimenti assegna il manager della scuola come insegnante principale
   - Riattiva la classe impostando lo stato su "planned"
6. Salva tutte le modifiche
7. Conferma la transazione

**Utilizzo**: Per riattivare una sezione precedentemente disattivata, riportando in uso anche le relative classi.

## Frontend - Visualizzazione degli Anni Accademici

Il componente `AcademicYearsTab.js` visualizza l'anno corrente e lo storico degli anni accademici:

```javascript
const AcademicYearsTab = ({ school }) => {
    const currentYear = school.academicYears?.find(year => year.status === 'active');
    const pastYears = school.academicYears?.filter(year => year.status !== 'active') || [];

    // Funzioni helper
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long'
        });
    };

    // Componenti per visualizzare l'anno corrente e gli anni passati
    const CurrentYearCard = () => (/* ... */);
    const PastYearsCard = () => (/* ... */);

    return (
        <Box>
            <CurrentYearCard />
            <PastYearsCard />
        </Box>
    );
};
```

**Funzionamento**:
1. Separa l'anno attivo da quelli non attivi (planned o archived)
2. Visualizza l'anno attivo in una card in evidenza con:
   - Anno formattato
   - Numero di studenti totali
   - Numero di classi attive
3. Visualizza gli anni passati o pianificati in una lista separata

## Funzionalità Mancanti o da Implementare

Nel codice analizzato non sono presenti alcune funzionalità che potrebbero essere utili:

1. **Promozione automatica degli studenti**: Non c'è un meccanismo esplicito per promuovere automaticamente gli studenti all'anno successivo quando cambia l'anno accademico

2. **Gestione del cambio di anno**: Non è presente una funzione specifica per cambiare l'anno attivo da uno all'altro (es. da 2022/2023 a 2023/2024)

3. **Aggiornamento delle classi per il nuovo anno**: Manca la logica per creare nuove classi per il nuovo anno accademico

Queste funzionalità potrebbero essere implementate estendendo il sistema esistente.

## Flusso Completo per il Cambio di Anno Accademico

Un flusso completo per il cambio di anno accademico potrebbe essere:

1. Creare un nuovo anno accademico con stato "planned"
2. Per ogni sezione attiva, creare le nuove classi per il nuovo anno
3. Promuovere gli studenti alle nuove classi (considerando anche bocciature)
4. Impostare il nuovo anno come "active" e quello precedente come "archived"
5. Aggiornare tutti i riferimenti necessari
