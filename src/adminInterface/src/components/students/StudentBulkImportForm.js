// src/components/students/StudentBulkImportForm.js
import React, { useState, useEffect } from 'react';
import {
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   Button,
   Box,
   FormControl,
   InputLabel,
   Select,
   MenuItem,
   Typography,
   Alert,
   AlertTitle,
   LinearProgress,
   IconButton,
   Paper,
   Stepper,
   Step,
   StepLabel,
   Divider,
   List,
   ListItem,
   ListItemText,
   ListItemIcon,
   Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as XLSX from 'xlsx';
import { useSchool } from '../../context/SchoolContext';
import { axiosInstance } from '../../services/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import ExcelPreview from './ExcelPreview';
import Loading from '../common/Loading';

const StudentBulkImportForm = ({ open, onClose }) => {
   const { schools, loading: schoolsLoading, fetchSchools, selectedSchool, fetchClasses } = useSchool();
   const { showNotification } = useNotification();

   const [file, setFile] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [result, setResult] = useState(null);
   const [schoolId, setSchoolId] = useState(selectedSchool?._id || '');
   const [parsedData, setParsedData] = useState([]);
   const [availableClasses, setAvailableClasses] = useState([]);
   const [activeStep, setActiveStep] = useState(0);
   const [duplicateEmails, setDuplicateEmails] = useState([]);
   const [existingEmails, setExistingEmails] = useState([]);
   const [updatedEmails, setUpdatedEmails] = useState({});  // Track updated emails

   // Steps per il processo di import
   const steps = ['Selezione File', 'Revisione Dati', 'Risultato Import'];

   useEffect(() => {
       if (open && schools.length === 0) {
           fetchSchools();
       }
       if (selectedSchool) {
           setSchoolId(selectedSchool._id);
           loadAvailableClasses(selectedSchool._id);
       }
   }, [open, schools.length, fetchSchools, selectedSchool]);

   // Carica le classi disponibili per la scuola selezionata
   const loadAvailableClasses = async (schoolId) => {
       try {
           setLoading(true);
           const response = await axiosInstance.get(`/classes?schoolId=${schoolId}`);
           
           if (response.data.status === 'success') {
               // Assicuriamoci che ogni classe abbia year e section come stringhe per la comparazione
               const classes = response.data.data.classes.map(c => ({
                   ...c,
                   year: c.year.toString(),
                   section: c.section
               }));
               
               console.log('Available classes loaded:', classes);
               setAvailableClasses(classes || []);
           }
       } catch (error) {
           console.error('Error loading classes:', error);
           showNotification('Errore nel caricamento delle classi', 'error');
       } finally {
           setLoading(false);
       }
   };

   // Controlla se ci sono email duplicate
   const checkDuplicateEmails = async (emails) => {
        if (!emails || emails.length === 0) return [];
        
        try {
            const response = await axiosInstance.post('/students/check-emails', { 
                emails: emails.map(e => e.toLowerCase().trim())
            });
            
            // Aggiungere questo log per vedere la risposta completa
            console.log('Full server response:', response.data);
            
            if (response.data.status === 'success') {
                const duplicates = response.data.data.duplicates || [];
                console.log('Duplicate emails check:', duplicates);
                return duplicates;
            }
            return [];
        } catch (error) {
            console.error('Error checking duplicate emails:', error);
            return [];
        }
    };

    // Gestisce il cambio di email di uno studente
    const handleEmailChange = (oldEmail, newEmail) => {
        // Rimuovi la vecchia email dall'elenco delle email duplicate
        setExistingEmails(prev => prev.filter(email => email.toLowerCase() !== oldEmail.toLowerCase()));
        
        // Aggiorna anche l'array duplicateEmails se necessario
        setDuplicateEmails(prev => prev.filter(item => item.email.toLowerCase() !== oldEmail.toLowerCase()));
        
        // Tieni traccia delle email cambiate
        setUpdatedEmails(prev => ({
            ...prev,
            [oldEmail.toLowerCase()]: newEmail.toLowerCase()
        }));
        
        console.log(`Email changed from ${oldEmail} to ${newEmail}`);
        console.log(`Remaining existing emails: ${existingEmails.filter(email => email.toLowerCase() !== oldEmail.toLowerCase()).join(', ')}`);
        console.log(`Updated emails map:`, JSON.stringify({
            ...updatedEmails,
            [oldEmail.toLowerCase()]: newEmail.toLowerCase()
        }));
    };

   // Gestisce il cambio di scuola
   const handleSchoolChange = (e) => {
       const newSchoolId = e.target.value;
       setSchoolId(newSchoolId);
       loadAvailableClasses(newSchoolId);
   };

   // Gestisce il cambio di file
   const handleFileChange = (event) => {
       const selectedFile = event.target.files[0];
       
       if (selectedFile) {
           if (!selectedFile.name.match(/\.(xls|xlsx)$/)) {
               setError('Solo file Excel (.xls, .xlsx) sono supportati');
               return;
           }
           if (selectedFile.size > 5 * 1024 * 1024) {
               setError('Il file non può superare i 5MB');
               return;
           }
           setFile(selectedFile);
           setError(null);
           
           // Reset stato
           setUpdatedEmails({});
           
           // Parse del file Excel
           parseExcelFile(selectedFile);
       }
   };

   // Effettua il parsing del file Excel
   const parseExcelFile = async (file) => {
       setLoading(true);
       
       const reader = new FileReader();
       reader.onload = async (e) => {
           try {
               const data = new Uint8Array(e.target.result);
               const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'DD/MM/YYYY' });
               
               // Prende il primo foglio
               const firstSheetName = workbook.SheetNames[0];
               const worksheet = workbook.Sheets[firstSheetName];
               
               // Converte in JSON
               const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'DD/MM/YYYY' });
               
               // Normalizza i dati
               const normalizedData = jsonData.map(row => {
                   // Standardizza i nomi delle colonne e formatta i dati
                   const student = {
                       firstName: row.firstName || row['Nome'] || row['nome'] || '',
                       lastName: row.lastName || row['Cognome'] || row['cognome'] || '',
                       gender: row.gender || row['Genere'] || row['genere'] || '',
                       email: row.email || row['Email'] || row['email'] || '',
                       dateOfBirth: row.dateOfBirth || row['Data di Nascita'] || row['data di nascita'] || row['Data Nascita'] || '',
                       fiscalCode: row.fiscalCode || row['Codice Fiscale'] || row['codice fiscale'] || '',
                       parentEmail: row.parentEmail || row['Email Genitore'] || row['email genitore'] || '',
                       specialNeeds: row.specialNeeds === 'SI' || row.specialNeeds === 'YES' || row.specialNeeds === true
                   };
                   
                   // Gestisci correttamente i campi per anno e sezione
                   const year = row.year || row.anno || row.Anno || '';
                   const section = row.section || row.sezione || row.Sezione || '';
                   
                   // Aggiungi informazioni sulla classe
                   if (year && section) {
                       student.year = year.toString(); // Converti in stringa per coerenza
                       student.section = section.toString().toUpperCase();
                       
                       // Cerca se esiste una classe corrispondente
                       if (availableClasses && availableClasses.length) {
                           const matchingClass = availableClasses.find(
                               c => c.year.toString() === student.year && 
                                    c.section === student.section
                           );
                           
                           if (matchingClass) {
                               student.classId = matchingClass._id;
                               console.log(`Assigned class ID ${matchingClass._id} to student ${student.firstName} ${student.lastName}`);
                           } else {
                               console.log(`No matching class found for ${student.year}${student.section}`);
                           }
                       }
                   }
                   
                   return student;
               });
               
               console.log('Parsed Excel data:', normalizedData);
               
               // Verifica email duplicate nel database
               const emails = normalizedData.map(student => student.email).filter(Boolean);
               if (emails.length > 0) {
                   const duplicates = await checkDuplicateEmails(emails);
                   setExistingEmails(duplicates || []);
                   console.log('Existing emails in database:', duplicates);
               }
               
               setParsedData(normalizedData);
               
               // Vai al passo successivo
               if (normalizedData.length > 0) {
                   setActiveStep(1);
               } else {
                   setError('Il file Excel non contiene dati validi');
               }
           } catch (error) {
               console.error('Error parsing Excel file:', error);
               setError('Errore nella lettura del file Excel');
           }
           setLoading(false);
       };
       
       reader.onerror = () => {
           setError('Errore nella lettura del file');
           setLoading(false);
       };
       
       reader.readAsArrayBuffer(file);
   };

   // Download del template Excel
   const handleDownloadTemplate = async () => {
       try {
           const response = await axiosInstance.get('/students/template', {
               responseType: 'blob'
           });
           
           const url = window.URL.createObjectURL(new Blob([response.data]));
           const link = document.createElement('a');
           link.href = url;
           link.setAttribute('download', 'template_studenti.xlsx');
           document.body.appendChild(link);
           link.click();
           link.remove();
           window.URL.revokeObjectURL(url);

       } catch (error) {
           console.error('Error downloading template:', error);
           showNotification('Errore nel download del template', 'error');
       }
   };

   // Gestisce l'upload finale dopo la conferma dalla preview
   const handleConfirmImport = async (confirmedData) => {
       if (!schoolId) {
           setError('Seleziona una scuola');
           return;
       }

       setLoading(true);
       setError(null);
       setResult(null);
       setDuplicateEmails([]); // Resetta le email duplicate

       try {
           // Prepara i dati da inviare
           const importData = {
               students: confirmedData,
               schoolId: schoolId
           };

           // Log dettagliato prima dell'invio
           console.log('Sending import data to server:', {
               studentsCount: importData.students.length,
               schoolId: importData.schoolId,
               firstStudent: importData.students[0],
               studentsWithClassId: importData.students.filter(s => s.classId).length,
               studentsWithYearSection: importData.students.filter(s => s.year && s.section).length
           });
           
           // Esegui l'import
           const response = await axiosInstance.post('/students/bulk-import-with-class', importData);
    
            // Estrai correttamente il risultato considerando la struttura anniddata
            // La struttura è response.data.data o response.data.data.data a seconda dell'implementazione
            const resultData = response.data.data?.data || response.data.data || {};
            
            console.log('CORRECTLY EXTRACTED RESULT:', resultData);
            
            // Ora resultData dovrebbe avere direttamente i campi imported, failed, errors
            const imported = Number(resultData.imported) || 0;
            const failed = Number(resultData.failed) || 0;
            
            // Imposta il risultato
            setResult({
                imported,
                failed,
                errors: resultData.errors || []
            });
       
           
           // Gestisci le email duplicate
           let duplicateEmails = [];
           
           // Prima controlla le email duplicate dai dati di risposta
           if (resultData && resultData.errors && resultData.errors.length > 0) {
               const duplicatesFromErrors = resultData.errors
                   .filter(err => err.error === 'DUPLICATE_EMAIL')
                   .map(err => ({
                       email: err.data.email,
                       name: `${err.data.firstName} ${err.data.lastName}`,
                       row: err.row
                   }));
               
               duplicateEmails = [...duplicateEmails, ...duplicatesFromErrors];
           }
           
           // Poi aggiungi le email già esistenti che abbiamo verificato prima
           if (existingEmails.length > 0) {
               // Mappa le email esistenti al formato richiesto
               const existingEmailsData = existingEmails.map(email => {
                   // Trova lo studente con questa email
                   const student = confirmedData.find(s => s.email?.toLowerCase() === email.toLowerCase());
                   return {
                       email: email,
                       name: student ? `${student.firstName} ${student.lastName}` : '',
                       row: '?'
                   };
               });
               
               // Aggiungi solo le email che non sono già state incluse
               existingEmailsData.forEach(item => {
                   if (!duplicateEmails.some(d => d.email.toLowerCase() === item.email.toLowerCase())) {
                       duplicateEmails.push(item);
                   }
               });
           }
           
           // Se ci sono duplicati, imposta l'array
           if (duplicateEmails.length > 0) {
               console.log('Setting duplicate emails:', duplicateEmails);
               setDuplicateEmails(duplicateEmails);
           }
           
           setActiveStep(2); // Vai al passo finale

           // Mostra notifiche
           if (resultData.imported > 0) {
               showNotification(`Importati ${resultData.imported} studenti con successo`, 'success');
           }
           if (resultData.failed > 0) {
               showNotification(`${resultData.failed} studenti non importati`, 'warning');
           }
           console.log('RENDERING RESULT:', result);

       } catch (error) {
           console.error('Error uploading data:', error);
           
           // Gestisci errori dal server
           if (error.response?.data?.error) {
               const serverError = error.response.data.error;
               setError(serverError.message || 'Errore durante l\'import');
               
               // Se l'errore contiene dettagli sulle email duplicate
               if (serverError.details && Array.isArray(serverError.details)) {
                   if (serverError.message.includes('Email già presente')) {
                       // Estrai informazioni sulle email duplicate, se disponibili
                       const duplicateKey = serverError.details.find(d => d.duplicateKey);
                       if (duplicateKey) {
                           setDuplicateEmails([{ email: duplicateKey.email }]);
                           
                           // Vai comunque allo step dei risultati per mostrare le email duplicate
                           setActiveStep(2);
                       }
                   }
               }
           } else {
               setError('Errore durante l\'import degli studenti');
           }
           
           showNotification('Errore durante l\'import degli studenti', 'error');
       } finally {
           setLoading(false);
       }
   };

   // Annulla l'importazione e torna al primo step
   const handleCancelPreview = () => {
       setActiveStep(0);
       setParsedData([]);
       setExistingEmails([]);
       setUpdatedEmails({});
   };

   // Gestisce la navigazione tra gli step
   const handleNext = () => {
       setActiveStep((prevStep) => prevStep + 1);
   };

   const handleBack = () => {
       setActiveStep((prevStep) => prevStep - 1);
   };

   // Gestisce la chiusura del dialog
   const handleClose = () => {
       setFile(null);
       setError(null);
       setResult(null);
       setParsedData([]);
       setActiveStep(0);
       setExistingEmails([]);
       setDuplicateEmails([]);
       setUpdatedEmails({});
       onClose();
   };

   // Aggiornamento dei dati dopo la preview
   const handleUpdatePreviewData = (updatedData) => {
       // Aggiorna i dati da inviare con le email corrette
       setParsedData(updatedData);
   };

   // Renderizza il contenuto in base allo step corrente
   const renderStepContent = () => {
       switch (activeStep) {
           case 0: // Step 1: Selezione File
               return (
                   <Box sx={{ mt: 2 }}>
                       <FormControl fullWidth sx={{ mb: 3 }}>
                           <InputLabel>Scuola</InputLabel>
                           <Select
                               value={schoolId}
                               onChange={handleSchoolChange}
                               label="Scuola"
                               disabled={schoolsLoading || !!selectedSchool}
                           >
                               {schools.map((school) => (
                                   <MenuItem key={school._id} value={school._id}>
                                       {school.name}
                                   </MenuItem>
                               ))}
                           </Select>
                       </FormControl>

                       <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                           <Button
                               variant="outlined"
                               startIcon={<DownloadIcon />}
                               onClick={handleDownloadTemplate}
                           >
                               Scarica Template
                           </Button>

                           <Button
                               variant="contained"
                               component="label"
                               startIcon={<CloudUploadIcon />}
                           >
                               Seleziona File
                               <input
                                   type="file"
                                   hidden
                                   accept=".xls,.xlsx"
                                   onChange={handleFileChange}
                               />
                           </Button>
                       </Box>

                       {file && (
                           <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                               <Typography>
                                   File selezionato: {file.name}
                               </Typography>
                               <IconButton onClick={() => setFile(null)} size="small">
                                   <DeleteIcon />
                               </IconButton>
                           </Paper>
                       )}
                   </Box>
               );
           case 1: // Step 2: Revisione Dati
               return (
                   <Box sx={{ mt: 2 }}>
                       {existingEmails.length > 0 && (
                           <Alert severity="warning" sx={{ mb: 2 }}>
                               <Typography variant="subtitle2" gutterBottom>
                                   Attenzione: sono state trovate {existingEmails.length} email già presenti nel sistema:
                               </Typography>
                               <List dense>
                                   {existingEmails.slice(0, 5).map((email, i) => (
                                       <ListItem key={i} sx={{ py: 0 }}>
                                           <ListItemIcon sx={{ minWidth: 36 }}>
                                               <EmailIcon fontSize="small" color="warning" />
                                           </ListItemIcon>
                                           <ListItemText primary={email} />
                                       </ListItem>
                                   ))}
                                   {existingEmails.length > 5 && (
                                       <ListItem>
                                           <Typography variant="caption">
                                               ...e altre {existingEmails.length - 5} email
                                           </Typography>
                                       </ListItem>
                                   )}
                               </List>
                               <Typography variant="body2" mt={1}>
                                   Gli studenti con email duplicate non verranno importati a meno che non modifichi l'email.
                               </Typography>
                           </Alert>
                       )}
                       
                       <ExcelPreview 
                            data={parsedData}
                            onConfirm={handleConfirmImport}
                            onCancel={handleCancelPreview}
                            availableClasses={availableClasses}
                            existingEmails={existingEmails}
                            onEmailChange={handleEmailChange}
                            onDataUpdate={handleUpdatePreviewData}
                        />
                   </Box>
               );
               case 2: // Step 3: Risultato Import
               return (
                   <Box sx={{ mt: 2 }}>
                       <Typography variant="h6" gutterBottom>
                           Riepilogo Importazione Studenti
                       </Typography>
                       
                       {result && (
                           <Paper sx={{ p: 3, mb: 3, backgroundColor: 'success.light' }}>
                               <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                   <CheckCircleIcon fontSize="large" color="success" />
                                   <Typography variant="h6" color="success.dark">
                                       Importazione Completata
                                   </Typography>
                               </Stack>
                               
                               <Typography variant="body1" paragraph>
                                    <strong>{result?.imported || 0}</strong> studenti importati con successo.
                                    {(result?.failed > 0) && (
                                        <span> {result.failed} studenti non sono stati importati a causa di errori.</span>
                                    )}
                                </Typography>
                               
                               <Typography variant="body2" color="text.secondary">
                                   Gli studenti importati sono ora disponibili nel sistema e possono essere assegnati alle classi.
                               </Typography>
                           </Paper>
                       )}
                       
                       {/* Mostra le email duplicate in una sezione dedicata */}
                       {duplicateEmails.length > 0 && (
                           <Box sx={{ mt: 2, mb: 2 }}>
                               <Alert severity="warning" sx={{ mb: 1 }}>
                                   <AlertTitle>Email duplicate ({duplicateEmails.length})</AlertTitle>
                                   I seguenti studenti non sono stati importati perché le loro email sono già presenti nel sistema:
                               </Alert>
                               <List dense sx={{ bgcolor: 'background.paper' }}>
                                   {duplicateEmails.map((item, index) => (
                                       <ListItem key={index}>
                                           <ListItemIcon>
                                               <EmailIcon color="warning" />
                                           </ListItemIcon>
                                           <ListItemText 
                                               primary={item.email} 
                                               secondary={
                                                   item.name 
                                                       ? `${item.name} (Riga ${item.row || 'non disponibile'})` 
                                                       : `Email esistente nel database`
                                               } 
                                           />
                                       </ListItem>
                                   ))}
                               </List>
                           </Box>
                       )}
                       
                       {/* Altri errori non legati alle email duplicate */}
                       {result?.errors && result.errors.length > 0 && result.errors.some(err => err.error !== 'DUPLICATE_EMAIL') && (
                           <Box sx={{ mt: 2 }}>
                               <Alert severity="error" sx={{ mb: 1 }}>
                                   <AlertTitle>Altri errori ({result.errors.filter(err => err.error !== 'DUPLICATE_EMAIL').length})</AlertTitle>
                                   I seguenti studenti non sono stati importati a causa di errori:
                               </Alert>
                               <List dense>
                                   {result.errors
                                       .filter(err => err.error !== 'DUPLICATE_EMAIL')
                                       .map((error, index) => (
                                           <ListItem key={index}>
                                               <ListItemIcon>
                                                   <ErrorOutlineIcon color="error" />
                                               </ListItemIcon>
                                               <ListItemText 
                                                   primary={`Riga ${error.row}: ${error.message}`}
                                                   secondary={error.data?.firstName ? `${error.data.firstName} ${error.data.lastName || ''}` : ''}
                                               />
                                           </ListItem>
                                       ))}
                               </List>
                           </Box>
                       )}
                       
                       {/* Messaggi speciali quando nessuno studente è stato importato */}
                       {result?.imported === 0 && !duplicateEmails.length && (
                           <Alert severity="info" sx={{ mt: 2 }}>
                               <AlertTitle>Nessuno studente importato</AlertTitle>
                               Non è stato possibile importare alcuno studente. Verifica i dati e riprova.
                           </Alert>
                       )}
                   </Box>
               );
           default:
               return null;
       }
   };

   return (
       <Dialog 
           open={open} 
           onClose={handleClose}
           maxWidth="md"
           fullWidth
       >
           <DialogTitle>Import Massivo Studenti</DialogTitle>
           <DialogContent>
               {/* Stepper */}
               <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 3 }}>
                   {steps.map((label) => (
                       <Step key={label}>
                           <StepLabel>{label}</StepLabel>
                       </Step>
                   ))}
               </Stepper>
               
               <Divider sx={{ mb: 2 }} />
               
               {/* Errori e Loading */}
               {loading && (
                   <Box sx={{ width: '100%', mb: 2 }}>
                       <LinearProgress />
                   </Box>
               )}
               
               {error && (
                   <Alert severity="error" sx={{ mb: 2 }}>
                       {error}
                   </Alert>
               )}
               
               {loading && activeStep === 0 && (
                   <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
                       <Loading message="Elaborazione file in corso..." />
                   </Box>
               )}
               
               {/* Contenuto dello step corrente */}
               {!loading && renderStepContent()}
           </DialogContent>
           <DialogActions>
               <Button onClick={handleClose}>
                   {activeStep === 2 ? 'Chiudi' : 'Annulla'}
               </Button>
               
               {activeStep === 0 && file && (
                   <Button
                       variant="contained"
                       onClick={handleNext}
                       disabled={loading || !file}
                       endIcon={<ArrowForwardIcon />}
                   >
                       Verifica Dati
                   </Button>
               )}
               
               {activeStep === 1 && (
                   <Button
                       onClick={handleBack}
                       disabled={loading}
                       startIcon={<ArrowBackIcon />}
                   >
                       Torna al File
                   </Button>
               )}
           </DialogActions>
       </Dialog>
   );
};

export default StudentBulkImportForm;