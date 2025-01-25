// src/services/SectionService.js
const mongoose = require('mongoose');
const School = require('../models/School');
const Class = require('../models/Class');
const Student = require('../models/Student');

class SectionService {
    async deactivateSection(schoolId, sectionName, options = {}) {
        const session = await mongoose.startSession();
        
        try {
            const result = await session.withTransaction(async () => {
                // 1. Verifica e aggiorna la sezione nella scuola
                const school = await School.findOneAndUpdate(
                    {
                        _id: schoolId,
                        'sections.name': sectionName,
                        'sections.isActive': true
                    },
                    {
                        $set: {
                            'sections.$.isActive': false,
                            'sections.$.deactivatedAt': new Date("2025-01-24T22:50:16Z")
                        }
                    },
                    { session, new: true }
                );

                if (!school) {
                    throw new Error(`Sezione ${sectionName} non trovata o già disattivata`);
                }

                // 2. Trova e aggiorna tutte le classi della sezione
                const updatedClasses = await Class.updateMany(
                    {
                        schoolId: schoolId,
                        section: sectionName,
                        isActive: true
                    },
                    {
                        $set: {
                            isActive: false,
                            status: 'archived',
                            mainTeacher: null,
                            teachers: [],
                            'students.$[].status': 'transferred',
                            'students.$[].leftAt': new Date("2025-01-24T22:50:16Z")
                        }
                    },
                    { session }
                );

                // 3. Trova tutti gli studenti delle classi impattate
                const affectedClasses = await Class.find(
                    {
                        schoolId: schoolId,
                        section: sectionName
                    },
                    { _id: 1 },
                    { session }
                );

                const classIds = affectedClasses.map(c => c._id);

                // 4. Aggiorna gli studenti
                const updatedStudents = await Student.updateMany(
                    {
                        schoolId: schoolId,
                        classId: { $in: classIds },
                        isActive: true
                    },
                    {
                        $set: {
                            status: 'pending',
                            classId: null,
                            section: null,
                            needsClassAssignment: true,
                            mainTeacher: null,
                            teachers: [],
                            lastClassChangeDate: new Date("2025-01-24T22:50:16Z")
                        },
                        $push: {
                            classChangeHistory: {
                                fromSection: sectionName,
                                date: new Date("2025-01-24T22:50:16Z"),
                                reason: options.reason || 'Sezione disattivata',
                                academicYear: options.academicYear || '2024/2025'
                            }
                        }
                    },
                    { session }
                );

                return {
                    success: true,
                    deactivatedSection: sectionName,
                    updatedClasses: updatedClasses.modifiedCount,
                    updatedStudents: updatedStudents.modifiedCount,
                    timestamp: new Date("2025-01-24T22:50:16Z")
                };
            });

            return result;
        } catch (error) {
            console.error('Errore durante la disattivazione della sezione:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Altri metodi relativi alle sezioni possono essere aggiunti qui
    // Per esempio:
    // - createSection
    // - updateSectionCapacity
    // - mergeSections
    // ecc.
}

module.exports = new SectionService();