// src/routes/routes.js
import Dashboard from '../components/Dashboard';
import UserManagement from '../components/users/UserManagement';
import SchoolManagement from '../components/school/SchoolManagement';
import SchoolDetails from '../components/school/SchoolDetails';
import ClassManagement from '../components/classes/ClassManagement';
import ClassDetails from '../components/classes/details/ClassDetails';
import ClassTests from '../components/classes/details/detailscomponents/ClassTests';
import SchoolWizard from '../components/school/wizard/SchoolWizard';
import SchoolUsersManagement from '../components/school/schoolComponents/SchoolUsersManagement';
import StudentList from '../components/students/StudentList';
import ClassPopulate from '../components/classes/details/ClassPopulate';
import Profile from '../components/profile/Profile';
import PersonalTest from '../components/profile/PersonalTest';
import SectionManagement from '../components/school/schoolComponents/SectionManagement';
import AssignSchoolDialog from '../components/students/AssignSchoolDialog';
import ApiExplorer from '../components/api-explorer/ApiExplorer';
import StudentIndex from '../components/students/list/details/studentIndex';
import UserDetails from '../components/users/details/UserDetails';
import EnginesManagement from '../components/engines/EnginesManagement';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import CSITestView from '../components/engines/CSI/CSITestView';
import CSIQuestionsPanel from '../components/engines/CSI/CSIQuestionsPanel';
import PublicCSITest from '../components/engines/CSI/publicCSI';
import StudentForm from '../components/students/StudentForm';
import StudentEditForm from '../components/students/list/tabs/InfoTab';

// Importa le icone da Material-UI
import {
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Assignment as TestIcon,
    HealthAndSafety as HealthIcon,
    Science as ResearcherIcon,
    Analytics as AnalyticsIcon,
    Security as SecurityIcon,
} from '@mui/icons-material';

// Aggiornamento delle definizioni dei permessi
const PERMISSIONS = {
    USERS: {
        READ: 'users:read',
        WRITE: 'users:write',
        MANAGE: 'users:manage'
    },
    SCHOOLS: {
        READ: 'schools:read',
        WRITE: 'schools:write',
        MANAGE: 'schools:manage'
    },
    CLASSES: {
        READ: 'classes:read',
        WRITE: 'classes:write',
        MANAGE: 'classes:manage'
    },
    STUDENTS: {
        READ: 'students:read',
        WRITE: 'students:write',
        MANAGE: 'students:manage'
    },
    TESTS: {
        READ: 'tests:read',
        WRITE: 'tests:write',
        MANAGE: 'tests:manage'
    },
    RESULTS: {
        READ: 'results:read',
        WRITE: 'results:write',
        MANAGE: 'results:manage'
    },
    ENGINES: {
        READ: 'engines:read',
        WRITE: 'engines:write',
        MANAGE: 'engines:manage'
    },
    API: {
        READ: 'api:read',
        WRITE: 'api:write',
        MANAGE: 'api:manage'
    },
    ANALYTICS: {
        READ: 'analytics:read',
        WRITE: 'analytics:write',
        MANAGE: 'analytics:manage'
    },
    MATERIALS: {
        READ: 'materials:read',
        WRITE: 'materials:write',
        MANAGE: 'materials:manage'
    },
    FINANCE: {
        READ: 'finance:read',
        WRITE: 'finance:write',
        MANAGE: 'finance:manage'
    },
    SERVICES: {
        READ: 'services:read',
        WRITE: 'services:write',
        MANAGE: 'services:manage'
    }
};

export const publicRoutes = [
    {
        path: 'test/csi/:token',
        element: PublicCSITest,
        title: 'Test CSI',
        showInMenu: false
    }
];

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
        managePermission: PERMISSIONS.USERS.MANAGE,
        showInMenu: true
    },
    {
        path: 'users/:id',
        element: UserDetails,
        title: 'Dettagli Utente',
        icon: PersonIcon,
        permissions: [PERMISSIONS.USERS.READ],
        writePermission: PERMISSIONS.USERS.WRITE,
        managePermission: PERMISSIONS.USERS.MANAGE,
        showInMenu: false
    },
    {
        path: 'schools',
        element: SchoolManagement,
        title: 'Gestione Scuole',
        icon: SchoolIcon,
        permissions: [PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.SCHOOLS.WRITE,
        managePermission: PERMISSIONS.SCHOOLS.MANAGE,
        showInMenu: true
    },
    {
        path: 'schools/:id',
        element: SchoolDetails,
        title: 'Dettagli Scuola',
        icon: SchoolIcon,
        permissions: [PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.SCHOOLS.WRITE,
        managePermission: PERMISSIONS.SCHOOLS.MANAGE,
        showInMenu: false
    },
    {
        path: 'classes',
        element: ClassManagement,
        title: 'Gestione Classi',
        icon: ClassIcon,
        permissions: [PERMISSIONS.CLASSES.READ],
        writePermission: PERMISSIONS.CLASSES.WRITE,
        managePermission: PERMISSIONS.CLASSES.MANAGE,
        showInMenu: true
    },
    {
        path: 'schools/create',
        element: SchoolWizard,
        title: 'Crea Scuola',
        permissions: [PERMISSIONS.SCHOOLS.WRITE],
        managePermission: PERMISSIONS.SCHOOLS.MANAGE,
        showInMenu: false
    },
    {
        path: 'schools/:id/users-management',
        element: SchoolUsersManagement,
        title: 'Gestione Utenze',
        icon: PersonIcon,
        permissions: [PERMISSIONS.USERS.READ, PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.USERS.WRITE,
        managePermission: PERMISSIONS.USERS.MANAGE,
        showInMenu: false
    },
    {
        path: 'schools/:id/sections-management',
        element: SectionManagement,
        title: 'Gestione Sezioni',
        icon: SchoolIcon,
        permissions: [PERMISSIONS.SCHOOLS.READ],
        writePermission: PERMISSIONS.SCHOOLS.WRITE,
        managePermission: PERMISSIONS.SCHOOLS.MANAGE,
        showInMenu: false
    },
    {
        path: 'classes/:classId',
        element: ClassDetails,
        title: 'Dettagli Classe',
        icon: ClassIcon,
        permissions: [PERMISSIONS.CLASSES.READ],
        writePermission: PERMISSIONS.CLASSES.WRITE,
        managePermission: PERMISSIONS.CLASSES.MANAGE,
        showInMenu: false
    },
    {
        path: 'classes/:classId/populate',
        element: ClassPopulate,
        title: 'Popola Classe',
        icon: ClassIcon,
        permissions: [PERMISSIONS.CLASSES.READ, PERMISSIONS.STUDENTS.READ],
        writePermission: PERMISSIONS.CLASSES.WRITE,
        managePermission: PERMISSIONS.CLASSES.MANAGE,
        showInMenu: false
    },
    {
        path: 'classes/:classId/tests',
        element: ClassTests,
        title: 'Gestione Test Classe',
        icon: TestIcon,
        permissions: [PERMISSIONS.CLASSES.READ, PERMISSIONS.TESTS.READ],
        writePermission: PERMISSIONS.TESTS.WRITE,
        managePermission: PERMISSIONS.TESTS.MANAGE,
        showInMenu: false
    },
    {
        path: 'students',
        element: StudentList,
        title: 'Gestione Studenti',
        icon: PersonIcon,
        permissions: [PERMISSIONS.STUDENTS.READ],
        writePermission: PERMISSIONS.STUDENTS.WRITE,
        managePermission: PERMISSIONS.STUDENTS.MANAGE,
        showInMenu: true
    },
    {
        path: 'students/assign-school',
        element: AssignSchoolDialog,
        title: 'Assegnazione Studenti',
        icon: PersonIcon,
        permissions: [PERMISSIONS.STUDENTS.WRITE, PERMISSIONS.SCHOOLS.READ],
        managePermission: PERMISSIONS.STUDENTS.MANAGE,
        showInMenu: false
    },
    {
        path: 'students/new',
        element: StudentForm,
        title: 'Nuovo Studente',
        icon: PersonIcon,
        permissions: [PERMISSIONS.STUDENTS.WRITE],
        managePermission: PERMISSIONS.STUDENTS.MANAGE,
        showInMenu: false
    },
    {
        path: 'students/:id',
        element: StudentIndex,
        title: 'Dettagli Studente',
        icon: PersonIcon,
        permissions: [PERMISSIONS.STUDENTS.READ],
        writePermission: PERMISSIONS.STUDENTS.WRITE,
        managePermission: PERMISSIONS.STUDENTS.MANAGE,
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
        icon: SecurityIcon,
        permissions: [PERMISSIONS.API.READ],
        writePermission: PERMISSIONS.API.WRITE,
        managePermission: PERMISSIONS.API.MANAGE,
        showInMenu: true,
        rolesAllowed: ['admin', 'developer'] // Solo admin e developer possono accedere
    },
    {
        path: 'engines',
        element: EnginesManagement,
        title: 'Gestione Test',
        icon: AssessmentIcon,
        permissions: [PERMISSIONS.ENGINES.READ],
        writePermission: PERMISSIONS.ENGINES.WRITE,
        managePermission: PERMISSIONS.ENGINES.MANAGE,
        showInMenu: true
    },
    {
        path: 'analytics',
        element: Dashboard, // Cambiare con il componente Analytics quando sarà disponibile
        title: 'Analytics',
        icon: AnalyticsIcon,
        permissions: [PERMISSIONS.ANALYTICS.READ],
        writePermission: PERMISSIONS.ANALYTICS.WRITE,
        managePermission: PERMISSIONS.ANALYTICS.MANAGE,
        showInMenu: true,
        rolesAllowed: ['admin', 'developer', 'researcher'] // Permesso anche ai ricercatori
    },
    // Rotte CSI
    {
        path: 'engines/csi',
        element: CSITestView,
        title: 'Gestione CSI',
        icon: AssessmentIcon,
        permissions: [PERMISSIONS.ENGINES.READ],
        writePermission: PERMISSIONS.ENGINES.WRITE,
        managePermission: PERMISSIONS.ENGINES.MANAGE,
        showInMenu: false
    },
    {
        path: 'engines/csi/questions',
        element: CSIQuestionsPanel,
        title: 'Gestione Domande CSI',
        icon: AssessmentIcon,
        permissions: [PERMISSIONS.ENGINES.READ],
        writePermission: PERMISSIONS.ENGINES.WRITE,
        managePermission: PERMISSIONS.ENGINES.MANAGE,
        showInMenu: false
    },
    // Rotte per professionisti sanitari
    {
        path: 'health',
        element: EnginesManagement, // Sostituire con componente dedicato quando disponibile
        title: 'Test Sanitari',
        icon: HealthIcon,
        permissions: [PERMISSIONS.ENGINES.READ],
        writePermission: PERMISSIONS.ENGINES.WRITE,
        showInMenu: true,
        rolesAllowed: ['admin', 'developer', 'health'] // Solo admin, developer e professionisti sanitari
    }
];

// Aggiungi questa verifica in development
if (process.env.NODE_ENV === 'development') {
    const paths = adminRoutes.map(route => route.path);
    const duplicates = paths.filter((item, index) => paths.indexOf(item) !== index);
    if (duplicates.length > 0) {
        console.warn('Trovati path duplicati nelle route:', duplicates);
    }
}

// Utility aggiornata per verificare i permessi delle rotte
export const hasRoutePermission = (route, user, checkPermission) => {
    // Verifica ruoli specifici se definiti
    if (route.rolesAllowed && !route.rolesAllowed.includes(user.role)) {
        return false;
    }
    
    // Se non ci sono permessi richiesti, concedi accesso
    if (!route.permissions) return true;
    
    // Admin hanno sempre accesso completo
    if (user.role === 'admin') return true;
    
    // Developer hanno accesso a tutto tranne finanza
    if (user.role === 'developer' && !route.path.includes('finance')) return true;
    
    // Per gli altri ruoli, verifica i permessi specifici
    return route.permissions.every(permission => checkPermission(permission));
};

export const canWriteInRoute = (route, user, checkPermission) => {
    // Admin hanno sempre permessi di scrittura
    if (user.role === 'admin') return true;
    
    // Developer hanno permessi di scrittura ovunque tranne finanza
    if (user.role === 'developer' && !route.path.includes('finance')) return true;
    
    // Per gli altri ruoli, verifica i permessi specifici
    if (!route.writePermission) return false;
    return checkPermission(route.writePermission);
};

export const canManageInRoute = (route, user, checkPermission) => {
    // Admin hanno sempre permessi di gestione
    if (user.role === 'admin') return true;
    
    // Developer hanno permessi di gestione ovunque tranne finanza
    if (user.role === 'developer' && !route.path.includes('finance')) return true;
    
    // Per gli altri ruoli, verifica i permessi specifici
    if (!route.managePermission) return false;
    return checkPermission(route.managePermission);
};