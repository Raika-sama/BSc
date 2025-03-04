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
   LinearProgress,
   IconButton,
   Paper,
   Stepper,
   Step,
   StepLabel,
   Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
               setAvailableClasses(response.data.data.classes || []);
           }
       } catch (error) {
           console.error('Error loading classes:', error);
           showNotification('Errore nel caricamento delle classi', 'error');
       } finally {
           setLoading(false);
       }
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
           
           // Parse del file Excel
           parseExcelFile(selectedFile);
       }
   };

   // Effettua il parsing del file Excel
   const parseExcelFile = (file) => {
       setLoading(true);
       
       const reader = new FileReader();
       reader.onload = (e) => {
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
                   return {
                       firstName: row.firstName || row['Nome'] || row['nome'] || '',
                       lastName: row.lastName || row['Cognome'] || row['cognome'] || '',
                       gender: row.gender || row['Genere'] || row['genere'] || '',
                       email: row.email || row['Email'] || row['email'] || '',
                       dateOfBirth: row.dateOfBirth || row['Data di Nascita'] || row['data di nascita'] || row['Data Nascita'] || '',
                       fiscalCode: row.fiscalCode || row['Codice Fiscale'] || row['codice fiscale'] || '',
                       parentEmail: row.parentEmail || row['Email Genitore'] || row['email genitore'] || '',
                       specialNeeds: row.specialNeeds === 'SI' || row.specialNeeds === 'YES' || row.specialNeeds === true
                   };
               });
               
               console.log('Parsed Excel data:', normalizedData);
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

       try {
           // Prepara i dati da inviare
           const importData = {
               students: confirmedData,
               schoolId: schoolId
           };

           // Esegui l'import
           const response = await axiosInstance.post('/students/bulk-import-with-class', importData);

           // Processa il risultato
           setResult(response.data.data);
           setActiveStep(2); // Vai al passo finale

           // Mostra notifiche
           if (response.data.data.imported > 0) {
               showNotification(`Importati ${response.data.data.imported} studenti con successo`, 'success');
           }
           if (response.data.data.failed > 0) {
               showNotification(`${response.data.data.failed} studenti non importati`, 'warning');
           }

       } catch (error) {
           console.error('Error uploading data:', error);
           setError(error.response?.data?.error?.message || 'Errore durante l\'import');
           showNotification('Errore durante l\'import degli studenti', 'error');
       } finally {
           setLoading(false);
       }
   };

   // Annulla l'importazione e torna al primo step
   const handleCancelPreview = () => {
       setActiveStep(0);
       setParsedData([]);
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
       onClose();
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
                       <ExcelPreview 
                           data={parsedData}
                           onConfirm={handleConfirmImport}
                           onCancel={handleCancelPreview}
                           availableClasses={availableClasses}
                       />
                   </Box>
               );
           case 2: // Step 3: Risultato Import
               return (
                   <Box sx={{ mt: 2 }}>
                       <Typography variant="h6" gutterBottom>
                           Risultato Import:
                       </Typography>
                       <Typography>
                           Studenti importati con successo: {result?.imported || 0}
                       </Typography>
                       {result?.failed > 0 && (
                           <Typography color="error">
                               Studenti non importati: {result.failed}
                           </Typography>
                       )}
                       {result?.errors && result.errors.length > 0 && (
                           <Box sx={{ mt: 2 }}>
                               <Typography color="error" gutterBottom>
                                   Errori riscontrati:
                               </Typography>
                               {result.errors.map((error, index) => (
                                   <Alert key={index} severity="error" sx={{ mb: 1 }}>
                                       Riga {error.row}: {error.message}
                                   </Alert>
                               ))}
                           </Box>
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