// src/middleware/upload/uploadMiddleware.js

const multer = require('multer');
const { ErrorTypes, createError } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');

// Configurazione storage in memoria
const storage = multer.memoryStorage();

// Filtro per accettare solo file Excel
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(createError(
            ErrorTypes.VALIDATION.BAD_REQUEST,
            'Solo file Excel (.xls, .xlsx) sono supportati'
        ), false);
    }
};

// Configurazione multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite di 5MB
        files: 1 // Un solo file alla volta
    }
});

// Middleware per gestire gli errori di multer
const handleMulterError = (error, req, res, next) => {
    logger.error('Upload error:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                error: {
                    message: 'File troppo grande (massimo 5MB)',
                    code: 'FILE_TOO_LARGE'
                }
            });
        }
    }

    next(error);
};

// Esporta il middleware configurato
module.exports = {
    uploadExcel: upload.single('file'),
    handleMulterError
};