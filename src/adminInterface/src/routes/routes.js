// src/routes/routes.js
import Dashboard from '../components/Dashboard';
import UserManagement from '../components/users/UserManagement';
import SchoolManagement from '../components/school/SchoolManagement';
import SchoolDetails from '../components/school/SchoolDetails';
import ClassManagement from '../components/classes/ClassManagement';    // Importa la pagina delle classi
import ClassDetails from '../components/classes/details/ClassDetails';    // Nuovo componente
import ClassTests from '../components/classes/details/detailscomponents/ClassTests';        // Nuovo componente
import SchoolWizard from '../components/school/wizard/SchoolWizard';
import SchoolUsersManagement from '../components/school/schoolComponents/SchoolUsersManagement'; // Aggiungi questo import
import StudentList from '../components/students/StudentList'; // Aggiungi questo import
import ClassPopulate from '../components/classes/details/ClassPopulate';    // Aggiungi questo import
import Profile from '../components/profile/Profile'; // Aggiungi questo import
import PersonalTest from '../components/profile/PersonalTest';  // Aggiungi questo import
import SectionManagement from '../components/school/schoolComponents/SectionManagement';
import AssignSchoolPage from '../components/students/AssignSchoolPage';
import ApiExplorer from '../components/api-explorer/ApiExplorer';
import StudentIndex from '../components/students/list/details/studentIndex';
import UserDetails from '../components/users/details/UserDetails';  // Aggiungi questo import
import EnginesManagement from '../components/engines/EnginesManagement';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import CSITestView from '../components/engines/CSI/CSITestView';
import CSIQuestionsPanel from '../components/engines/CSI/CSIQuestionsPanel';

// Importa le icone da Material-UI
import {
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Assignment as TestIcon,
} from '@mui/icons-material';
const PERMISSIONS = {
    USERS: {
        READ: 'users:read',
        WRITE: 'users:write'
    },
    SCHOOLS: {
        READ: 'schools:read',
        WRITE: 'schools:write'
    },
    CLASSES: {
        READ: 'classes:read',
        WRITE: 'classes:write'
    },
    STUDENTS: {
        READ: 'students:read',
        WRITE: 'students:write'
    },
    TESTS: {
        READ: 'tests:read',
        WRITE: 'tests:write'
    },
    RESULTS: {
        READ: 'results:read',
        WRITE: 'results:write'
    },
    ENGINES: {
        READ: 'engines:read',
        WRITE: 'engines:write'
    }
};
export const adminRoutes = [
    {
        path: 'dashboard',
        element: Dashboard,
        title: 'Dashboard',
        icon: DashboardIcon,
        permissions: null, // accessibile a tutti gli admin
        showInMenu: true
    },
    {
        path: 'users/*',
        element: UserManagement,
        title: 'Gestione Utenti',
        icon: PersonIcon,
        permissions: [PERMISSIONS.USERS.READ],
        writePermission: PERMISSIONS.USERS.WRITE,
        showInMenu: true
    },
    {
        path: 'users/:id',
        element: UserDetails,  // Il componente che abbiamo creato
        title: 'Dettagli Utente',
        icon: PersonIcon,
        permissions: [PERMISSIONS.USERS.READ],
        writePermission: PERMISSIONS.USERS.WRITE,
        showInMenu: false
    },
    {
        path: 'schools',
        element: SchoolManagement,
        title: 'Gestione Scuole',
        icon: SchoolIcon,
        permissions: [PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.SCHOOLS.WRITE,
        showInMenu: true
    },
    {
        path: 'schools/:id',
        element: SchoolDetails,
        title: 'Dettagli Scuola',
        icon: SchoolIcon,
        permissions: [PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.SCHOOLS.WRITE,
        showInMenu: false
    },
    {
        path: 'classes',
        element: ClassManagement,
        title: 'Gestione Classi',
        icon: ClassIcon,
        permissions: [PERMISSIONS.CLASSES.READ],
        writePermission: PERMISSIONS.CLASSES.WRITE,
        showInMenu: true
    },
    {
        path: 'schools/create',
        element: SchoolWizard,
        title: 'Crea Scuola',
        permissions: [PERMISSIONS.SCHOOLS.WRITE],
        showInMenu: false
    },
    {
        path: 'schools/:id/users-management',
        element: SchoolUsersManagement,
        title: 'Gestione Utenze',
        icon: PersonIcon,
        permissions: [PERMISSIONS.USERS.READ, PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.USERS.WRITE,
        showInMenu: false
    },
    {
        path: 'schools/:id/sections-management',
        element: SectionManagement,
        title: 'Gestione Sezioni',
        icon: SchoolIcon,
        permissions: [PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.SCHOOLS.WRITE,
        showInMenu: false
    },
    {
        path: 'classes/:classId',
        element: ClassDetails,
        title: 'Dettagli Classe',
        icon: ClassIcon,
        permissions: [PERMISSIONS.CLASSES.READ],
        writePermission: PERMISSIONS.CLASSES.WRITE,
        showInMenu: false
    },
    {
        path: 'classes/:classId/populate',  // Aggiungi questa nuova rotta
        element: ClassPopulate,
        title: 'Popola Classe',
        icon: ClassIcon,
        permissions: [PERMISSIONS.CLASSES.READ, PERMISSIONS.STUDENTS.READ],
        writePermission: PERMISSIONS.CLASSES.WRITE,
        showInMenu: false
    },
    {
        path: 'classes/:classId/tests',
        element: ClassTests,
        title: 'Gestione Test Classe',
        icon: TestIcon,
        permissions: [PERMISSIONS.CLASSES.READ, PERMISSIONS.TESTS.READ],
        writePermission: PERMISSIONS.TESTS.WRITE,
        showInMenu: false
    },
    {
        path: 'students',
        element: StudentList,
        title: 'Gestione Studenti',
        icon: PersonIcon,
        permissions: [PERMISSIONS.STUDENTS.READ],
        writePermission: PERMISSIONS.STUDENTS.WRITE,
        showInMenu: true
    },
    {
        path: 'students/assign-school',
        element: AssignSchoolPage,
        title: 'Assegnazione Studenti',
        icon: PersonIcon,
        permissions: [PERMISSIONS.STUDENTS.WRITE, PERMISSIONS.SCHOOLS.READ],
        showInMenu: false
    },
    {
        path: 'students/:id',
        element: StudentIndex,
        title: 'Dettagli Studente',
        icon: PersonIcon,
        permissions: [PERMISSIONS.STUDENTS.READ],
        writePermission: PERMISSIONS.STUDENTS.WRITE,
        showInMenu: false
    },
    {
        path: 'students/:studentId/tests',
        element: () => <StudentIndex initialTab="tests" />,
        title: 'Test dello Studente',
        icon: TestIcon,
        permissions: [PERMISSIONS.STUDENTS.READ, PERMISSIONS.TESTS.READ],
        showInMenu: false
    },
    {
        path: 'profile',
        element: Profile,
        title: 'Profilo Utente',
        permissions: null, // accessibile a tutti gli utenti autenticati
        showInMenu: false
    },
    {
        path: 'personal-test',
        element: PersonalTest,
        title: 'Test Personale',
        permissions: null, // accessibile a tutti gli utenti autenticati
        showInMenu: false
    },
    {
        path: 'api-explorer',
        element: ApiExplorer,
        title: 'Api Explorer',
        permissions: null, // solo admin
        adminOnly: true,
        showInMenu: true
    },
    {
        path: 'engines',
        element: EnginesManagement,
        title: 'Gestione Test',
        icon: AssessmentIcon,
        permissions: [PERMISSIONS.ENGINES.READ],
        writePermission: PERMISSIONS.ENGINES.WRITE,
        showInMenu: true
    },
    {
        path: 'engines/csi/*',
        element: CSITestView,
        title: 'Gestione CSI',
        permissions: [PERMISSIONS.ENGINES.READ],
        writePermission: PERMISSIONS.ENGINES.WRITE,
        showInMenu: false,
        children: [
            {
                path: '',  // rotta index
                element: CSITestView
            },
            {
                path: 'questions',
                element: CSIQuestionsPanel,
                title: 'Gestione Domande CSI'
            }
        ]
    }
];
// Utility per verificare i permessi delle rotte
export const hasRoutePermission = (route, checkPermission) => {
    // Se non ci sono permessi richiesti o l'utente è admin, concedi accesso
    if (!route.permissions) return true;
    
    // Verifica tutti i permessi richiesti
    return route.permissions.every(permission => checkPermission(permission));
};

export const canWriteInRoute = (route, checkPermission) => {
    if (!route.writePermission) return true;
    return checkPermission(route.writePermission);
};