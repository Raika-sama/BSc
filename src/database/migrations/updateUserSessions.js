// migrations/updateUserSessions.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const config = require('../../config/config');
const logger = require('../../utils/errors/logger/logger');

async function migrateUserSessions() {
    try {
        logger.info('Starting user sessions migration...');
        
        // Trova tutti gli utenti con sessionTokens
        const users = await User.find({
            sessionTokens: { $exists: true, $ne: [] }
        });

        logger.info(`Found ${users.length} users with existing sessions`);

        for (const user of users) {
            try {
                let modified = false;
                
                // Filtriamo e aggiorniamo le sessioni esistenti
                const updatedSessions = user.sessionTokens.map(session => {
                    if (!session.expiresAt) {
                        modified = true;
                        // Calcoliamo una data di scadenza basata su createdAt + tempo di scadenza del token
                        const expiresAt = new Date(
                            session.createdAt.getTime() + 
                            (config.jwt.expiresIn.replace(/[^0-9]/g, '') * 1000)
                        );

                        return {
                            ...session.toObject(),
                            expiresAt,
                            userAgent: session.userAgent || 'Unknown',
                            ipAddress: session.ipAddress || '0.0.0.0'
                        };
                    }
                    return session;
                });

                // Rimuovi sessioni nulle o invalide
                const validSessions = updatedSessions.filter(session => 
                    session && 
                    session.token && 
                    session.expiresAt > new Date()
                );

                if (modified || validSessions.length !== user.sessionTokens.length) {
                    user.sessionTokens = validSessions;
                    await user.save({ validateBeforeSave: false });
                    logger.info(`Updated sessions for user ${user._id}`);
                }
            } catch (userError) {
                logger.error(`Error updating user ${user._id}:`, userError);
                // Continua con il prossimo utente
                continue;
            }
        }

        logger.info('Migration completed successfully');
    } catch (error) {
        logger.error('Migration failed:', error);
        throw error;
    }
}

// Funzione per eseguire la migrazione in maniera sicura
async function runMigration() {
    try {
        // Connessione al database
        await mongoose.connect(config.db.uri, config.db.options);
        logger.info('Connected to database');

        // Esegui la migrazione
        await migrateUserSessions();

        // Chiudi la connessione
        await mongoose.connection.close();
        logger.info('Database connection closed');
    } catch (error) {
        logger.error('Migration script failed:', error);
        process.exit(1);
    }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
    runMigration();
}

module.exports = migrateUserSessions;