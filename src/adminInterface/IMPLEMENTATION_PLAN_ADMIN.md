# Piano di Implementazione: Gestione Classi e Sezioni Brain Scanner

## 1. Fase Preparazione

### 1.1 Database Schema Updates

#### School Model
```javascript
{
  // Campi esistenti
  name: String,
  schoolType: 'middle_school' | 'high_school',
  institutionType: String,
  region: String,
  province: String,
  address: String,
  
  // Nuovi campi
  academicYears: [{
    year: String,          // es: '2024/2025'
    status: 'active' | 'planned' | 'archived',
    startDate: Date,
    endDate: Date,
    createdAt: Date,
    createdBy: ObjectId    // Admin reference
  }],
  
  sections: [{
    name: String,          // es: 'A'
    isActive: Boolean,
    createdAt: Date,
    academicYears: [{
      year: String,        // '2024/2025'
      status: 'active' | 'planned' | 'archived',
      maxStudents: Number,
      activatedAt: Date,
      deactivatedAt: Date,
      notes: String
    }]
  }],
  
  defaultMaxStudentsPerClass: Number
}
```

#### Class Model
```javascript
{
  // Campi esistenti
  schoolId: ObjectId,
  year: Number,           // 1-5
  section: String,        // 'A'
  
  // Nuovi campi
  academicYear: String,   // '2024/2025'
  status: 'active' | 'planned' | 'archived',
  students: [{
    studentId: ObjectId,
    joinedAt: Date,
    leftAt: Date,
    status: 'active' | 'transferred' | 'graduated'
  }],
  capacity: Number,
  mainTeacher: ObjectId,
  teachers: [ObjectId],
  notes: String
}
```

### 1.2 Backend Services

#### SchoolService
```javascript
class SchoolService {
  async createSchool(basicData)
  async setupAcademicYear(schoolId, yearData)
  async addSection(schoolId, sectionData)
  async updateSection(schoolId, sectionId, updates)
  async planNextAcademicYear(schoolId, yearData)
}
```

#### ClassService
```javascript
class ClassService {
  async createInitialClasses(schoolId, academicYear)
  async promoteClasses(schoolId, fromYear, toYear)
  async assignTeacher(classId, teacherId)
  async addStudent(classId, studentId)
  async transferStudent(studentId, fromClassId, toClassId)
}
```

#### AcademicYearService
```javascript
class AcademicYearService {
  async planAcademicYear(schoolId, yearData)
  async activateAcademicYear(schoolId, year)
  async closeAcademicYear(schoolId, year)
  async handleYearTransition(schoolId, fromYear, toYear)
}
```

## 2. Frontend Implementation

### 2.1 School Creation Wizard

#### Step 1: Basic Info
```jsx
const Step1BasicInfo = () => (
  <Form>
    <TextField name="name" label="Nome Scuola" required />
    <Select name="schoolType" label="Tipo Scuola">
      <MenuItem value="middle_school">Scuola Media</MenuItem>
      <MenuItem value="high_school">Superiori</MenuItem>
    </Select>
    <TextField name="region" label="Regione" />
    <TextField name="province" label="Provincia" />
    <TextField name="address" label="Indirizzo" />
  </Form>
);
```

#### Step 2: Academic Year Setup
```jsx
const Step2AcademicYear = () => (
  <Form>
    <AcademicYearSelector 
      startYear={new Date().getFullYear()}
    />
    <DateRangePicker 
      startDate={yearStart}
      endDate={yearEnd}
    />
    <TextField
      name="defaultMaxStudents"
      type="number"
      label="Studenti massimi per classe"
    />
  </Form>
);
```

#### Step 3: Sections Configuration
```jsx
const Step3Sections = () => (
  <Form>
    <SectionsList 
      sections={sections}
      onAdd={handleAddSection}
      onRemove={handleRemoveSection}
    />
    <SectionConfig
      showMaxStudents
      showNotes
    />
  </Form>
);
```

#### Step 4: Review & Create
```jsx
const Step4Review = () => (
  <ReviewPanel>
    <SchoolSummary data={schoolData} />
    <ClassesList 
      sections={sections}
      academicYear={academicYear}
    />
    <ConfirmationButtons
      onBack={handleBack}
      onConfirm={handleCreate}
    />
  </ReviewPanel>
);
```

### 2.2 School Management Dashboard

```jsx
const SchoolDashboard = () => (
  <DashboardLayout>
    <Header>
      <SchoolInfo />
      <YearSelector />
    </Header>
    
    <TabPanel>
      <TabList>
        <Tab>Panoramica</Tab>
        <Tab>Classi</Tab>
        <Tab>Sezioni</Tab>
        <Tab>Configurazione</Tab>
      </TabList>
      
      <TabPanels>
        <Overview />
        <ClassesManagement />
        <SectionsManagement />
        <Configuration />
      </TabPanels>
    </TabPanel>
  </DashboardLayout>
);
```

## 3. API Endpoints

### 3.1 School Setup
```javascript
// School creation flow
POST /api/v1/schools                    // Basic school creation
POST /api/v1/schools/:id/academic-years // Add academic year
POST /api/v1/schools/:id/sections      // Add sections
POST /api/v1/schools/:id/classes       // Create classes

// School management
GET  /api/v1/schools/:id/academic-years
PUT  /api/v1/schools/:id/academic-years/:year
GET  /api/v1/schools/:id/sections
PUT  /api/v1/schools/:id/sections/:sectionId
```

### 3.2 Class Management
```javascript
// Class operations
GET    /api/v1/classes                  // List with filters
POST   /api/v1/classes                  // Create single class
PUT    /api/v1/classes/:id             // Update class
DELETE /api/v1/classes/:id             // Archive class

// Student management
POST   /api/v1/classes/:id/students    // Add students
DELETE /api/v1/classes/:id/students/:studentId
POST   /api/v1/classes/transfer        // Transfer students
```

## 4. Implementation Timeline

### 4.1 Fase 1: Database & Backend (2 settimane)
- Aggiornamento schemi MongoDB
- Implementazione servizi base
- API endpoints essenziali
- Test unitari backend

### 4.2 Fase 2: Frontend Creation Flow (2 settimane)
- Wizard creazione scuola
- Form di configurazione
- Validazioni frontend
- Test integrazione wizard

### 4.3 Fase 3: Management Interface (2 settimane)
- Dashboard gestione scuola
- Gestione classi e sezioni
- Configurazione anni accademici
- UI per transizioni anno

### 4.4 Fase 4: Testing & Refinement (1 settimana)
- Test end-to-end
- Performance testing
- UI/UX refinements
- Documentazione

## 5. Testing Strategy

### 5.1 Unit Tests
```javascript
// School service tests
describe('SchoolService', () => {
  it('should create school with basic info')
  it('should setup academic year correctly')
  it('should handle section creation')
  it('should validate class capacities')
});

// Class service tests
describe('ClassService', () => {
  it('should create initial classes')
  it('should handle class promotion')
  it('should manage student transfers')
});
```

### 5.2 Integration Tests
```javascript
describe('School Creation Flow', () => {
  it('should complete full creation workflow')
  it('should handle validation errors')
  it('should rollback on failures')
});
```

### 5.3 E2E Tests
```javascript
describe('School Management', () => {
  it('should create school through wizard')
  it('should manage academic year transition')
  it('should handle class assignments')
});
```

## 6. Migration Strategy

### 6.1 Data Migration
```javascript
async function migrateExistingSchools() {
  // 1. Add academic years
  // 2. Setup sections
  // 3. Update class references
  // 4. Validate data integrity
}
```

### 6.2 Rollback Plan
```javascript
// Backup current data
// Version control on schema
// Feature flags for gradual rollout
```

## 7. Monitoring & Maintenance

### 7.1 Performance Metrics
- Query response times
- Memory usage
- Operation logs
- Error tracking

### 7.2 Maintenance Tasks
- Daily backups
- Index optimization
- Cache invalidation
- Log rotation

## 8. Future Improvements

### 8.1 Phase 2 Features
- Multi-year planning
- Automatic teacher assignment
- Advanced reporting
- Bulk operations UI

### 8.2 Optimizations
- Cache layer
- Batch operations
- Real-time updates
- Performance monitoring