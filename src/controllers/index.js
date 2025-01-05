// src/controllers/index.js

/**
 * @file index.js
 * @description Export centralizzato dei controllers
 * @author Raika-sama
 * @date 2025-01-05
 */
const authController = require('./authController');
const schoolController = require('./schoolController');
const userController = require('./userController');
const classController = require('./classController');
const studentController = require('./studentController');
const testController = require('./testController');

module.exports = {
    auth: authController,
    school: schoolController,
    user: userController,
    class: classController,
    student: studentController,
    test: testController
};