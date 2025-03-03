import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Box,
  Button,
  Divider,
  alpha,
  Tooltip,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Componente per mostrare i test assegnati allo studente
const AssignedTestsList = ({
  tests = [],
  selectedTest,
  onTestSelect,
  onAssignNewTest,
  loading = false
}) => {
  const theme = useTheme();

  // Funzione per formattare la data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funzione per ottenere il colore e il testo dello stato del test
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'warning', label: 'In attesa', icon: <AccessTimeIcon fontSize="small" /> };
      case 'in_progress':
        return { color: 'info', label: 'In corso', icon: <AccessTimeIcon fontSize="small" /> };
      case 'completed':
        return { color: 'success', label: 'Completato', icon: null };
      default:
        return { color: 'default', label: 'Sconosciuto', icon: null };
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 600
            }}
          >
            Test Studente
          </Typography>
          <Tooltip title="I test vengono assegnati allo studente e rimangono disponibili fino alla completamento">
            <IconButton size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AssignmentIcon />}
          onClick={onAssignNewTest}
          disabled={loading}
          sx={{
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          Assegna Nuovo Test
        </Button>
      </Box>

      {/* Lista dei test */}
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1,
          py: 1.5,
          '& .MuiListItemButton-root': {
            borderRadius: 1,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
              }
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            }
          }
        }}
      >
        {tests.length > 0 ? (
          tests.map((test, index) => {
            const statusInfo = getStatusInfo(test.status);
            
            return (
              <ListItemButton
                key={`${test._id}-${index}`} // Added index to ensure unique key
                selected={selectedTest?._id === test._id}
                onClick={() => onTestSelect(test)}
                disabled={loading}
              >
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 0.5 
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: selectedTest?._id === test._id ? 600 : 500,
                          color: selectedTest?._id === test._id ? 'primary.main' : 'text.primary'
                        }}
                      >
                        Test {test.tipo}
                      </Typography>
                      <Chip 
                        label={statusInfo.label}
                        size="small"
                        color={statusInfo.color}
                        icon={statusInfo.icon}
                        sx={{ 
                          height: 20,
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        Assegnato: {formatDate(test.assignedAt)}
                      </Typography>
                      {test.status === 'completed' && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Completato: {formatDate(test.dataCompletamento)}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
              </ListItemButton>
            );
          })
        ) : (
          <Box 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2">
              Nessun test assegnato
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default AssignedTestsList;