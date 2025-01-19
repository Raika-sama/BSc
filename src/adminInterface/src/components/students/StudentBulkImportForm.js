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
   Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSchool } from '../../context/SchoolContext';
import { axiosInstance } from '../../services/axiosConfig';
import { useNotification } from '../../context/NotificationContext';

const StudentBulkImportForm = ({ open, onClose }) => {
   const { schools, loading: schoolsLoading, fetchSchools, selectedSchool } = useSchool();
   const { showNotification } = useNotification();

   const [file, setFile] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [result, setResult] = useState(null);
   const [schoolId, setSchoolId] = useState(selectedSchool?._id || '');

   useEffect(() => {
       if (open && schools.length === 0) {
           fetchSchools();
       }
       if (selectedSchool) {
           setSchoolId(selectedSchool._id);
       }
   }, [open, schools.length, fetchSchools, selectedSchool]);

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
       }
   };

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

   const handleUpload = async () => {
       if (!schoolId) {
           setError('Seleziona una scuola');
           return;
       }
       if (!file) {
           setError('Seleziona un file da importare');
           return;
       }

       setLoading(true);
       setError(null);
       setResult(null);

       const formData = new FormData();
       formData.append('file', file);
       formData.append('schoolId', schoolId);

       try {
           const response = await axiosInstance.post('/students/bulk-import', formData, {
               headers: {
                   'Content-Type': 'multipart/form-data'
               }
           });

           setResult(response.data.data);
           if (response.data.data.imported > 0) {
               showNotification(`Importati ${response.data.data.imported} studenti con successo`, 'success');
           }
           if (response.data.data.failed > 0) {
               showNotification(`${response.data.data.failed} studenti non importati`, 'warning');
           }

       } catch (error) {
           console.error('Error uploading file:', error);
           setError(error.response?.data?.error?.message || 'Errore durante l\'import');
           showNotification('Errore durante l\'import degli studenti', 'error');
       } finally {
           setLoading(false);
       }
   };

   const handleClose = () => {
       setFile(null);
       setError(null);
       setResult(null);
       onClose();
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
               <Box sx={{ mt: 2 }}>
                   <FormControl fullWidth sx={{ mb: 3 }}>
                       <InputLabel>Scuola</InputLabel>
                       <Select
                           value={schoolId}
                           onChange={(e) => setSchoolId(e.target.value)}
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

                   {result && (
                       <Box sx={{ mt: 2 }}>
                           <Typography variant="h6" gutterBottom>
                               Risultato Import:
                           </Typography>
                           <Typography>
                               Studenti importati con successo: {result.imported}
                           </Typography>
                           {result.failed > 0 && (
                               <Typography color="error">
                                   Studenti non importati: {result.failed}
                               </Typography>
                           )}
                           {result.errors && result.errors.length > 0 && (
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
                   )}
               </Box>
           </DialogContent>
           <DialogActions>
               <Button onClick={handleClose}>
                   Chiudi
               </Button>
               <Button
                   variant="contained"
                   onClick={handleUpload}
                   disabled={!file || loading || !schoolId}
               >
                   Importa
               </Button>
           </DialogActions>
       </Dialog>
   );
};

export default StudentBulkImportForm;