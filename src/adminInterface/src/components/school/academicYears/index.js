/**
 * File indice per i componenti degli anni accademici
 * Centralizza tutte le esportazioni per facilitare l'importazione
 */

// Componente principale
export { default } from './AcademicYearsTab';

// Cards
export { default as CurrentYearCard } from './cards/CurrentYearCard';
export { default as PlannedYearsCard } from './cards/PlannedYearsCard';
export { default as PastYearsCard } from './cards/PastYearsCard';

// Dialogs
export { default as NewYearDialog } from './dialogs/NewYearDialog';
export { default as EditYearDialog } from './dialogs/EditYearDialog';
export { default as ClassesDialog } from './dialogs/ClassesDialog';
export { default as NewSectionDialog } from './dialogs/NewSectionDialog';
export { default as ArchiveYearDialog } from './dialogs/ArchiveYearDialog';
export { default as ReactivateYearDialog } from './dialogs/ReactivateYearDialog';