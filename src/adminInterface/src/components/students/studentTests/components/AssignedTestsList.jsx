import React, { useMemo } from 'react';
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
  IconButton,
  Badge,
  Avatar,
  Skeleton,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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

  // Funzione per ottenere il colore e il testo dello stato del test - migliorata
const getStatusInfo = (status) => {
  switch (status) {
      case 'pending':
          return { 
              color: 'warning', 
              label: 'In attesa', 
              icon: <PauseCircleOutlineIcon fontSize="small" />,
              bgColor: alpha(theme.palette.warning.main, 0.15),
              textColor: theme.palette.warning.main
          };
      case 'in_progress':
          return { 
              color: 'info', 
              label: 'In corso', 
              icon: <PlayArrowIcon fontSize="small" />,
              bgColor: alpha(theme.palette.info.main, 0.15),
              textColor: theme.palette.info.main
          };
      case 'completed':
          return { 
              color: 'success', 
              label: 'Completato', 
              icon: <AssignmentIcon fontSize="small" />,
              bgColor: alpha(theme.palette.success.main, 0.15),
              textColor: theme.palette.success.main
          };
      default:
          return { 
              color: 'default', 
              label: 'Sconosciuto', 
              icon: <ErrorOutlineIcon fontSize="small" />,
              bgColor: alpha(theme.palette.grey[500], 0.15),
              textColor: theme.palette.text.secondary
          };
  }
};

  // Memorizza i test filtrati e ordinati per data più recente in primo piano
  const sortedTests = useMemo(() => {
    if (!tests || tests.length === 0) return [];

    // Assicurati che tutti i test abbiano una proprietà status
    const testsWithStatus = tests.map(test => ({
      ...test,
      status: test.status || 'pending'
    }));

    // Ordina per data di assegnazione più recente
    return [...testsWithStatus].sort((a, b) => {
      const dateA = a.assignedAt ? new Date(a.assignedAt) : new Date(0);
      const dateB = b.assignedAt ? new Date(b.assignedAt) : new Date(0);
      return dateB - dateA;
    });
  }, [tests]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: theme.shadows[1]
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.03)
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 600
              }}
            >
              Test Studente
            </Typography>
            {sortedTests.length > 0 && (
              <Badge 
                badgeContent={sortedTests.length} 
                color="primary"
                sx={{ ml: 1.5 }}
              />
            )}
          </Box>
          <Tooltip title="I test vengono assegnati allo studente e rimangono disponibili fino al completamento">
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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Assegna Nuovo Test
        </Button>
      </Box>

      {/* Lista dei test */}
      <Box 
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1.5
        }}
      >
        {loading ? (
          // Stato di caricamento con skeleton
          [...Array(3)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', p: 1, mb: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1.5 }} />
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="text" width="50%" height={24} />
                  <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} />
                </Box>
                <Skeleton variant="text" width="80%" height={18} />
                <Skeleton variant="text" width="60%" height={18} />
              </Box>
            </Box>
          ))
        ) : sortedTests.length > 0 ? (
          <List
            sx={{
              p: 0,
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
            {sortedTests.map((test, index) => {
              const statusInfo = getStatusInfo(test.status);
              const isSelected = selectedTest?._id === test._id;
              
              // Verifica se il test ha un nome valido
              const testName = test.nome || `Test ${test.tipo || 'Senza tipo'}`;
              
              // Debug per i test problematici
              if (!test._id) {
                console.error('Test senza ID:', test);
              }

              return (
                <ListItemButton
                  key={test._id || `test-${index}`}
                  selected={isSelected}
                  onClick={() => onTestSelect(test)}
                  disabled={loading}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    mb: 1,
                    '&::before': isSelected ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      backgroundColor: 'primary.main',
                      borderRadius: '4px 0 0 4px'
                    } : {}
                  }}
                >
                  <Box sx={{ 
                    mr: 1.5, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: statusInfo.bgColor,
                        color: statusInfo.textColor
                      }}
                    >
                      {test.tipo ? test.tipo.charAt(0) : "T"}
                    </Avatar>
                  </Box>
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
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? 'primary.main' : 'text.primary'
                          }}
                        >
                          {testName}
                        </Typography>
                        <Chip 
                          label={statusInfo.label}
                          size="small"
                          color={statusInfo.color}
                          icon={statusInfo.icon}
                          sx={{ 
                            height: 24,
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
                          Assegnato: {formatDate(test.assignedAt || test.createdAt)}
                        </Typography>
                        {test.status === 'completed' && test.dataCompletamento && (
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
            })}
          </List>
        ) : (
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              color: 'text.secondary',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: alpha(theme.palette.background.default, 0.4),
              borderRadius: 1,
            }}
          >
            <AssignmentIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.5), mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Nessun test assegnato
            </Typography>
            <Typography variant="body2">
              Clicca su "Assegna Nuovo Test" per iniziare
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AssignedTestsList;