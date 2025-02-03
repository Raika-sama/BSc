// scripts/initCSIQuestions.js $ node scr/scripts/initCSIQuestions

require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const CSIQuestion = require('../engines/CSI/models/CSIQuestion');
const logger = require('../utils/errors/logger/logger');

async function initializeQuestions() {
    try {
        // Modifica l'URI per includere il database
        const uri = process.env.MONGODB_URI;
        const dbName = process.env.DB_NAME || 'brainScannerDB';
        
        // Inserisci il nome del database PRIMA dei parametri query
        const uriWithDB = uri.replace('mongodb+srv://', 'mongodb+srv://').replace('/?', `/${dbName}?`);

        const uriForLog = uriWithDB.replace(
            /\/\/([^:]+):([^@]+)@/, 
            '//[USERNAME]:[PASSWORD]@'
        );
        
        logger.info(`Attempting to connect to: ${uriForLog}`);

        await mongoose.connect(uriWithDB);
        logger.info(`Connected to database: ${mongoose.connection.db.databaseName}`);

        const questions = [
            {
                id: 1,
                testo: "Prima di iniziare una ricerca, leggo diverse fonti per farmi un'idea generale dell'argomento",
                tipo: "likert",
                categoria: "Elaborazione",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 2,
                testo: "Preferisco avere regole chiare e precise prima di iniziare un lavoro",
                tipo: "likert",
                categoria: "Creatività",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 3,
                testo: "Capisco velocemente i concetti senza bisogno di molte spiegazioni",
                tipo: "likert",
                categoria: "Creatività",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 4,
                testo: "Mi piace pianificare tutto nei minimi dettagli prima di agire",
                tipo: "likert",
                categoria: "Creatività",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 5,
                testo: "Mi capita spesso di avere intuizioni improvvise che mi aiutano a risolvere problemi",
                tipo: "likert",
                categoria: "Creatività",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 6,
                testo: "Preferisco seguire un approccio strutturato per affrontare un compito complesso",
                tipo: "likert",
                categoria: "Creatività",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 7,
                testo: "Mi concentro sui dettagli prima di considerare il quadro generale",
                tipo: "likert",
                categoria: "Elaborazione",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 8,
                testo: "Riesco a sintetizzare rapidamente le informazioni in una visione complessiva",
                tipo: "likert",
                categoria: "Elaborazione",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 9,
                testo: "Mi piace scomporre un problema in parti più piccole per risolverlo",
                tipo: "likert",
                categoria: "Elaborazione",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 10,
                testo: "Preferisco affrontare i problemi considerando tutti gli aspetti contemporaneamente",
                tipo: "likert",
                categoria: "Elaborazione",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 11,
                testo: "Mi sento più a mio agio seguendo un metodo sequenziale per risolvere problemi",
                tipo: "likert",
                categoria: "Elaborazione",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 12,
                testo: "Capisco meglio un argomento se prima mi viene presentata una visione generale",
                tipo: "likert",
                categoria: "Elaborazione",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 13,
                testo: "Rispondo immediatamente alle domande senza pensarci troppo",
                tipo: "likert",
                categoria: "Decisione",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 14,
                testo: "Preferisco riflettere attentamente prima di dare una risposta",
                tipo: "likert",
                categoria: "Decisione",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 15,
                testo: "Mi capita di agire rapidamente senza considerare tutte le conseguenze",
                tipo: "likert",
                categoria: "Decisione",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 16,
                testo: "Valuto attentamente tutte le opzioni prima di prendere una decisione",
                tipo: "likert",
                categoria: "Decisione",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 17,
                testo: "Mi piace risolvere problemi velocemente anche se non ho tutte le informazioni",
                tipo: "likert",
                categoria: "Decisione",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 18,
                testo: "Prima di completare un compito, mi assicuro di aver analizzato tutti i dettagli",
                tipo: "likert",
                categoria: "Decisione",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 19,
                testo: "Ricordo meglio le informazioni se sono presentate in forma di immagini o grafici",
                tipo: "likert",
                categoria: "Preferenza Visiva",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 20,
                testo: "Preferisco leggere spiegazioni dettagliate piuttosto che osservare schemi",
                tipo: "likert",
                categoria: "Preferenza Visiva",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 21,
                testo: "Capisco meglio un argomento guardando un video piuttosto che leggendo un testo",
                tipo: "likert",
                categoria: "Preferenza Visiva",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 22,
                testo: "Mi aiuta prendere appunti dettagliati durante le lezioni",
                tipo: "likert",
                categoria: "Preferenza Visiva",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 23,
                testo: "Preferisco usare mappe mentali per organizzare le mie idee",
                tipo: "likert",
                categoria: "Preferenza Visiva",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 24,
                testo: "Mi trovo a mio agio leggendo testi lunghi con molte spiegazioni",
                tipo: "likert",
                categoria: "Preferenza Visiva",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 25,
                testo: "Preferisco che qualcuno mi guidi passo passo in un nuovo compito",
                tipo: "likert",
                categoria: "Autonomia",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 26,
                testo: "Mi piace gestire autonomamente i miei tempi e le mie attività",
                tipo: "likert",
                categoria: "Autonomia",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 27,
                testo: "Trovo difficile organizzarmi senza indicazioni esterne",
                tipo: "likert",
                categoria: "Autonomia",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 28,
                testo: "Mi sento motivato quando ho il controllo totale su quello che faccio",
                tipo: "likert",
                categoria: "Autonomia",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            },
            {
                id: 29,
                testo: "Ho bisogno di supervisione frequente per portare a termine un lavoro",
                tipo: "likert",
                categoria: "Autonomia",
                metadata: { polarity: "-" },
                version: "1.0.0",
                active: true
            },
            {
                id: 30,
                testo: "Riesco a completare un progetto da solo senza bisogno di supporto",
                tipo: "likert",
                categoria: "Autonomia",
                metadata: { polarity: "+" },
                version: "1.0.0",
                active: true
            }
        ];
        


        const beforeCount = await CSIQuestion.countDocuments();
        logger.info(`Questions before cleanup: ${beforeCount}`);

        await CSIQuestion.deleteMany({});
        logger.info('Cleared existing questions');

        const result = await CSIQuestion.insertMany(questions);
        logger.info(`Successfully initialized ${result.length} CSI questions`);

        // Verifica per categoria
const categoryCounts = await Promise.all([
    CSIQuestion.countDocuments({ categoria: "Elaborazione" }),
    CSIQuestion.countDocuments({ categoria: "Creatività" }),
    CSIQuestion.countDocuments({ categoria: "Decisione" }),
    CSIQuestion.countDocuments({ categoria: "Preferenza Visiva" }),
    CSIQuestion.countDocuments({ categoria: "Autonomia" })
]);

logger.info('Questions by category:', {
    Elaborazione: categoryCounts[0],
    Creatività: categoryCounts[1],
    Decisione: categoryCounts[2],
    PreferenzaVisiva: categoryCounts[3],
    Autonomia: categoryCounts[4]
});


        // Verifica che tutte le domande siano state inserite correttamente
        const count = await CSIQuestion.countDocuments();
        logger.info(`Total questions in database: ${count}`);

        // Verifica gli indici
        const indexes = await CSIQuestion.collection.getIndexes();
        logger.info('Indexes created:', Object.keys(indexes));

        await mongoose.connection.close();
        logger.info('Database connection closed');
    } catch (error) {
        logger.error('Error initializing questions:', {
            message: error.message,
            stack: error.stack
        });
        
        if (mongoose.connection) {
            await mongoose.connection.close();
            logger.info('Database connection closed after error');
        }
        
        process.exit(1);
    }
}

initializeQuestions().catch(error => {
    logger.error('Top level error:', error);
    process.exit(1);
});
