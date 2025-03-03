const mongoose = require('mongoose');
const logger = require('../utils/errors/logger/logger');

/**
 * Ensures all models are registered in a consistent order to prevent registration errors
 * This function can be called multiple times safely - it will only register models if they don't already exist
 */
const initializeModels = () => {
    try {
        logger.info('Initializing models...', {
            existingModels: mongoose.modelNames(),
            connectionState: mongoose.connection.readyState
        });
        
        // Keep track of successfully registered models
        const registeredModels = {
            base: [],
            engine: [],
            discriminators: []
        };

        // Step 1: Register base models first
        try {
            // Base models - these should have no dependencies on other models
            const models = [
                { name: 'School', path: './School' },
                { name: 'Class', path: './Class' },
                { name: 'Student', path: './Student' },
                { name: 'User', path: './User' },
                { name: 'UserAudit', path: './UserAudit' },
                { name: 'StudentAuth', path: './StudentAuth' }
            ];

            // Register each model safely
            for (const model of models) {
                if (!mongoose.models[model.name]) {
                    const schema = require(model.path).schema || require(model.path);
                    mongoose.model(model.name, schema);
                    registeredModels.base.push(model.name);
                    logger.debug(`Registered base model: ${model.name}`);
                }
            }
            
            logger.debug('Base models registered successfully:', registeredModels.base);
        } catch (error) {
            logger.error('Error registering base models:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
        
        // Step 2: Register engine models
        try {
            logger.debug('Starting engine models registration:', {
                existingModels: mongoose.modelNames(),
                pendingModels: ['CSIConfig', 'CSIQuestion']
            });

            // CSI models registration
            if (!mongoose.models.CSIConfig) {
                const CSIConfigSchema = require('../engines/CSI/models/CSIConfig').schema || 
                    require('../engines/CSI/models/CSIConfig');
                mongoose.model('CSIConfig', CSIConfigSchema);
                registeredModels.engine.push('CSIConfig');
            }
            
            if (!mongoose.models.CSIQuestion) {
                const CSIQuestionModule = require('../engines/CSI/models/CSIQuestion');
                const CSIQuestionSchema = CSIQuestionModule.schema || 
                    (CSIQuestionModule.CSIQuestion ? CSIQuestionModule.CSIQuestion.schema : CSIQuestionModule);
                mongoose.model('CSIQuestion', CSIQuestionSchema);
                registeredModels.engine.push('CSIQuestion');
            }
            
            logger.debug('Engine models registration details:', {
                beforeRegistration: mongoose.modelNames(),
                engineModelsToRegister: registeredModels.engine,
                discriminatorStatus: mongoose.models.Result?.discriminators 
                    ? Object.keys(mongoose.models.Result.discriminators)
                    : 'No discriminators'
            });

        } catch (error) {
            logger.error('Error registering engine models:', {
                error: error.message,
                stack: error.stack,
                existingModels: mongoose.modelNames(),
                attemptedModels: registeredModels.engine
            });
            throw error;
        }
        
        // Step 3: Register Test model (depends on CSIConfig)
        try {
            logger.debug('Starting Test model registration:', {
                existingModels: mongoose.modelNames(),
                hasTestModel: !!mongoose.models.Test
            });

            if (!mongoose.models.Test) {
                const TestSchema = require('./Test').schema || require('./Test');
                mongoose.model('Test', TestSchema);
                registeredModels.base.push('Test');
            }
            logger.debug('Test model registration details:', {
                modelName: mongoose.models.Test?.modelName,
                schemaOptions: mongoose.models.Test?.schema?.options,
                registeredPaths: Object.keys(mongoose.models.Test?.schema?.paths || {})
            });

        } catch (error) {
            logger.error('Error registering Test model:', {
                error: error.message,
                stack: error.stack,
                existingModels: mongoose.modelNames()
            });
            throw error;
        }
        
        // Step 4: Register Result model and its discriminators
        try {
            logger.debug('Starting Result model registration:', {
                existingModels: mongoose.modelNames(),
                hasResultModel: !!mongoose.models.Result,
                resultDiscriminators: mongoose.models.Result?.discriminators 
                    ? Object.keys(mongoose.models.Result.discriminators)
                    : 'No discriminators yet'
            });

            // Ensure base Result model is registered first
            const ResultModule = require('./Result');
            const { Result: ResultModel, CSIResult } = ResultModule.getModels();
            
            if (ResultModel) {
                registeredModels.base.push('Result');
            }
            
            if (CSIResult) {
                registeredModels.discriminators.push('CSIResult');
                // Verifica che il discriminatore sia stato registrato correttamente
                if (!ResultModel.discriminators?.CSI) {
                    logger.error('CSI discriminator not properly registered');
                    throw new Error('CSI discriminator not properly registered');
                }
            }
            
            logger.debug('Result model registration complete:', {
                hasBaseModel: !!ResultModel,
                discriminators: ResultModel?.discriminators 
                    ? Object.keys(ResultModel.discriminators)
                    : 'No discriminators',
                registeredModels: mongoose.modelNames()
            });
            
            // Return all registered models with improved error checking
            const models = {
                // Base models
                School: mongoose.models.School,
                Class: mongoose.models.Class,
                Student: mongoose.models.Student,
                StudentAuth: mongoose.models.StudentAuth,
                User: mongoose.models.User,
                UserAudit: mongoose.models.User,
                Test: mongoose.models.Test,
                
                // Result and discriminators
                Result: ResultModel,
                CSIResult: ResultModel.discriminators?.CSI,
                
                // Engine models
                CSIConfig: mongoose.models.CSIConfig,
                CSIQuestion: mongoose.models.CSIQuestion
            };

            // Verifica che tutti i modelli siano stati registrati correttamente
            Object.entries(models).forEach(([key, model]) => {
                if (!model) {
                    throw new Error(`Model ${key} was not properly registered`);
                }
            });

            return models;
        } catch (error) {
            logger.error('Error registering Result models:', {
                error: error.message,
                stack: error.stack,
                existingModels: mongoose.modelNames(),
                resultModel: !!mongoose.models.Result,
                discriminators: mongoose.models.Result?.discriminators 
                    ? Object.keys(mongoose.models.Result.discriminators)
                    : []
            });
            throw error;
        }
    } catch (error) {
        logger.error('Critical error during model initialization:', {
            error: error.message,
            stack: error.stack,
            finalModelState: mongoose.modelNames(),
            connectionState: mongoose.connection.readyState
        });
        throw error;
    }
};

// Add a validation function to verify models are properly registered
const validateModels = (models) => {
    const requiredModels = [
        'School', 'Class', 'Student', 'User', 'UserAudit',
        'Test', 'Result', 'CSIConfig', 'CSIQuestion'
    ];
    
    const missingModels = requiredModels.filter(
        model => !models[model] || !mongoose.models[model]
    );
    
    if (missingModels.length > 0) {
        logger.error('Model validation failed - missing required models:', missingModels);
        throw new Error(`Missing required models: ${missingModels.join(', ')}`);
    }
    
    // Verify the discriminator structure specifically
    if (!models.Result?.discriminators?.CSI) {
        logger.error('CSI discriminator is not properly registered');
        throw new Error('CSI discriminator is not properly registered');
    }
    
    logger.info('Model validation successful - all required models registered');
    return true;
};

// Initialize models and validate registration
let models;
try {
    // Assicurati che mongoose sia connesso prima di inizializzare i modelli
    if (mongoose.connection.readyState === 0) {
        logger.warn('Mongoose not connected when initializing models');
    }
    
    models = initializeModels();
    validateModels(models);
    
    logger.debug('Model initialization complete. Registered models:', {
        models: mongoose.modelNames(),
        resultDiscriminators: mongoose.models.Result?.discriminators 
            ? Object.keys(mongoose.models.Result.discriminators)
            : []
    });
} catch (error) {
    logger.error('Fatal error during model initialization. Application may not function correctly:', {
        error: error.message,
        stack: error.stack,
        mongooseState: mongoose.connection.readyState
    });
    // Re-throw to ensure application fails if models aren't properly registered
    throw error;
}

module.exports = models;