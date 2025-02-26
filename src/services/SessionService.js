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
    // SessionService.js

async createSession(user, token, metadata) {
    try {
        console.log('Creating session with data:', {
            userId: user._id,
            hasSessionTokens: Array.isArray(user.sessionTokens),
            sessionTokensCount: user.sessionTokens?.length
        });
        
        // Se l'utente non è un documento Mongoose, lo recuperiamo dal database
        if (!user.addSessionToken) {
            console.log('Converting plain user object to Mongoose document');
            user = await this.userRepository.findById(user._id)
                .select('+sessionTokens');
            
            if (!user) {
                throw new Error('User not found during session creation');
            }
        }

        await user.addSessionToken({
            token,
            userAgent: metadata.userAgent,
            ipAddress: metadata.ipAddress,
            expiresAt: new Date(Date.now() + ms(metadata.expiresIn || '7d'))
        });

        console.log('Session created successfully:', {
            userId: user._id,
            sessionTokensCount: user.sessionTokens.length
        });

        await user.save();
        
        return true;
    } catch (error) {
        console.error('Session creation error:', error);
        throw error;
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

    async updateSessionLastUsed(userId, sessionToken) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user || !user.sessionTokens) {
                throw new Error('User or sessions not found');
            }
    
            const sessionIndex = user.sessionTokens.findIndex(
                session => session.token === sessionToken
            );
    
            if (sessionIndex === -1) {
                throw new Error('Session not found');
            }
    
            user.sessionTokens[sessionIndex].lastUsedAt = new Date();
            await user.save();
    
            return true;
        } catch (error) {
            logger.error('Error updating session last used:', error);
            throw error;
        }
    }
}

module.exports = SessionService;