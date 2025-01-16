// src/routes/routes.js
import Dashboard from '../components/Dashboard';
import UserManagement from '../components/users/UserManagement';
import SchoolManagement from '../components/school/SchoolManagement';
import SchoolDetails from '../components/school/SchoolDetails';
import ClassManagement from '../components/classes/ClassManagement';    // Importa la pagina delle classi
import ClassDetails from '../components/classes/ClassDetails';    // Nuovo componente
import ClassTests from '../components/classes/ClassTests';        // Nuovo componente
import SchoolWizard from '../components/school/wizard/SchoolWizard';
import UsersManagement from '../components/school/UsersManagement'; // Aggiungi questo import
import StudentList from '../components/students/StudentList'; // Aggiungi questo import


// Importa le icone da Material-UI
import {
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Assignment as TestIcon,
} from '@mui/icons-material';

export const adminRoutes = [
    {
        path: 'dashboard',
        element: Dashboard,
        title: 'Dashboard',
        icon: DashboardIcon
    },
    {
        path: 'users',
        element: UserManagement,
        title: 'Gestione Utenti',
        icon: PersonIcon
    },
    {
        path: 'schools',
        element: SchoolManagement,
        title: 'Gestione Scuole',
        icon: SchoolIcon
    },
    {
        path: 'schools/:id',  // Aggiungiamo la rotta per i dettagli
        element: SchoolDetails,
        title: 'Dettagli Scuola',
        icon: SchoolIcon,
        showInMenu: false  // Non mostrare nel menu laterale
    },
    {
        path: 'classes',
        element: ClassManagement, // ClassManagement component quando lo creerai
        title: 'Gestione Classi',
        icon: ClassIcon
    },
    {
        path: 'tests',
        element: null, // TestManagement component quando lo creerai
        title: 'Gestione Test',
        icon: TestIcon
    },
    {
        path: 'schools/create',
        element: SchoolWizard,
        title: 'Crea Scuola'
    },
    {
        path: 'schools/:id',
        element: SchoolDetails,
        title: 'Dettagli Scuola',
        icon: SchoolIcon,
        showInMenu: false
    },
    {
        path: 'schools/:id/users-management',  // Aggiungi questa rotta
        element: UsersManagement,
        title: 'Gestione Utenze',
        icon: PersonIcon,
        showInMenu: false  // Non mostrare nel menu laterale
    },
    {
        path: 'classes/:classId',
        element: ClassDetails,
        title: 'Dettagli Classe',
        icon: ClassIcon,
        showInMenu: false
    },
    {
        path: 'classes/:classId/tests',
        element: ClassTests,
        title: 'Gestione Test Classe',
        icon: TestIcon,
        showInMenu: false
    },
    {
        path: 'students',         // Aggiungi questa route
        element: StudentList,
        title: 'Gestione Studenti',
        icon: PersonIcon
    }
];