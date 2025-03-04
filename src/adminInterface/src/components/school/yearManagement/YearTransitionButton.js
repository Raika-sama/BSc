// src/components/school/yearManagement/YearTransitionButton.js
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';
import {
  SwapVert as SwapVertIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import YearTransitionWizard from './YearTransitionWizard';
import { useNotification } from '../../../context/NotificationContext';

/**
 * Pulsante che apre il wizard di transizione anno
 * Da inserire nella scheda AcademicYearsTab
 */
const YearTransitionButton = ({ school, onTransitionComplete }) => {
  const { showNotification } = useNotification();
  const [open, setOpen] = useState(false);
  
  const handleOpen = () => {
    if (!school) {
      showNotification('Nessuna scuola selezionata', 'error');
      return;
    }
    
    const activeYear = school.academicYears.find(y => y.status === 'active');
    const plannedYears = school.academicYears.filter(y => y.status === 'planned');
    
    if (!activeYear) {
      showNotification('Non c\'è alcun anno accademico attivo', 'warning');
      return;
    }
    
    if (plannedYears.length === 0) {
      showNotification('Non ci sono anni accademici pianificati disponibili', 'warning');
      return;
    }
    
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleComplete = () => {
    handleClose();
    if (onTransitionComplete) {
      onTransitionComplete();
    }
  };
  
  return (
    <>
      <Tooltip title="Transizione anno accademico">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
          startIcon={<SwapVertIcon />}
        >
          Transizione Anno
        </Button>
      </Tooltip>
      
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e0e0e0',
          p: 2
        }}>
          <Typography variant="h6">
            Transizione Anno Accademico
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
          {school && (
            <YearTransitionWizard
              school={school}
              onComplete={handleComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default YearTransitionButton;