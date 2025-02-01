// src/services/SessionService.js
const ms = require('ms');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class SessionService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.MAX_SESSIONS_PER_USER = 5;
        this.CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 ore in millisecondi
        
        // Avvia pulizia automatica delle sessioni scadute
        this.startCleanupInterval();
    }

    /**
     * Crea una nuova sessione
     * @param {Object} user - Utente per cui creare la sessione
     * @param {string} token - Token di sessione
     * @param {Object} metadata - Metadati della sessione
     */
    async createSession(user, token, metadata) {
        try {
            logger.debug('Creating session with data:', {
                userId: user?._id,
                hasMetadata: !!metadata,
                metadataFields: metadata ? Object.keys(metadata) : []
            });
    
            // Validazione input
            if (!user || !user._id) {
                throw new Error('Invalid user object');
            }
            if (!token) {
                throw new Error('Token is required');
            }
            if (!metadata || !metadata.userAgent || !metadata.ipAddress) {
                throw new Error('Invalid metadata');
            }
    
            const sessionData = {
                token,
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress,
                expiresAt: new Date(Date.now() + ms(metadata.expiresIn || '7d')),
                createdAt: new Date(),
                lastUsedAt: new Date()
            };
    
            // Aggiungi la sessione all'utente
            await user.addSessionToken(sessionData);
            await user.save();
    
            logger.info('Session created successfully', {
                userId: user._id,
                expiresAt: sessionData.expiresAt
            });
    
            return sessionData;
        } catch (error) {
            logger.error('Session creation error:', {
                error: error.message,
                stack: error.stack,
                userData: {
                    id: user?._id,
                    hasSessionTokens: !!user?.sessionTokens
                }
            });
            throw createError(
                ErrorTypes.SESSION.CREATION_FAILED,
                'Errore nella creazione della sessione',
                { originalError: error.message }
            );
        }
    }

    /**
     * Verifica validità sessione
     * @param {string} token - Token di sessione
     */
    async validateSession(token) {
        try {
            const user = await this.userRepository.findOne({
                'sessionTokens.token': token
            });

            if (!user) {
                throw createError(
                    ErrorTypes.SESSION.NOT_FOUND,
                    'Sessione non trovata'
                );
            }

            const session = user.sessionTokens.find(s => s.token === token);

            if (!session) {
                throw createError(
                    ErrorTypes.SESSION.NOT_FOUND,
                    'Sessione non trovata'
                );
            }

            if (session.expiresAt < new Date()) {
                // Rimuovi sessione scaduta
                await this.removeSession(user._id, token);
                throw createError(
                    ErrorTypes.SESSION.EXPIRED,
                    'Sessione scaduta'
                );
            }

            // Aggiorna lastUsedAt
            session.lastUsedAt = new Date();
            await user.save();

            return { user, session };
        } catch (error) {
            logger.error('Session validation error', { error });
            throw error;
        }
    }

    /**
     * Rimuove una sessione specifica
     * @param {string} userId - ID utente
     * @param {string} token - Token sessione da rimuovere
     */
    async removeSession(userId, token) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            await user.removeSessionToken(token);
            await user.save();

            logger.info('Session removed', { userId, token });
        } catch (error) {
            logger.error('Error removing session', { error });
            throw error;
        }
    }

    /**
     * Rimuove tutte le sessioni di un utente
     * @param {string} userId - ID utente
     */
    async removeAllSessions(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            user.sessionTokens = [];
            await user.save();

            logger.info('All sessions removed for user', { userId });
        } catch (error) {
            logger.error('Error removing all sessions', { error });
            throw error;
        }
    }

    /**
     * Ottiene tutte le sessioni attive di un utente
     * @param {string} userId - ID utente
     */
    async getUserSessions(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            // Filtra solo le sessioni non scadute
            const activeSessions = user.sessionTokens.filter(
                session => session.expiresAt > new Date()
            );

            return activeSessions;
        } catch (error) {
            logger.error('Error getting user sessions', { error });
            throw error;
        }
    }

    /**
     * Avvia intervallo di pulizia sessioni scadute
     */
    startCleanupInterval() {
        setInterval(async () => {
            try {
                logger.debug('Starting session cleanup');
                
                const users = await this.userRepository.model.find({
                    'sessionTokens.expiresAt': { $lt: new Date() }
                });

                for (const user of users) {
                    user.sessionTokens = user.sessionTokens.filter(
                        session => session.expiresAt > new Date()
                    );
                    await user.save();
                }

                logger.info('Session cleanup completed', {
                    usersProcessed: users.length
                });
            } catch (error) {
                logger.error('Error in session cleanup', { error });
            }
        }, this.CLEANUP_INTERVAL);
    }
}

module.exports = SessionService;