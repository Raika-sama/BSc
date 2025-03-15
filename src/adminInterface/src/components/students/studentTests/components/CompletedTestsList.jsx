import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Divider,
  Box,
  alpha,
  Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const CompletedTestsList = ({
  tests = [],
  selectedTest,
  onTestSelect,
}) => {
  const theme = useTheme();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn('Error formatting date:', e);
      return 'Data non valida';
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 600
            }}
          >
            Test Completati
          </Typography>
          {tests.length > 0 && (
            <Badge 
              badgeContent={tests.length} 
              color="success"
              sx={{ ml: 1.5 }}
            />
          )}
        </Box>
      </Box>

      {/* Lista test */}
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
          tests.map((test) => (
            <ListItemButton
              key={test._id}
              selected={selectedTest?._id === test._id}
              onClick={() => onTestSelect(test)}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                mb: 1,
                '&::before': selectedTest?._id === test._id ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: 'success.main',
                  borderRadius: '4px 0 0 4px'
                } : {}
              }}
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
                      {test.nome || `Test ${test.tipo}`}
                    </Typography>
                    <Chip 
                      label="Completato"
                      size="small"
                      color="success"
                      icon={<AssignmentTurnedInIcon fontSize="small" />}
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
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {formatDate(test.dataCompletamento || test.updatedAt)}
                  </Typography>
                }
              />
            </ListItemButton>
          ))
        ) : (
          <Box 
            sx={{ 
              p: 3, 
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
            <AssignmentTurnedInIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.5), mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Nessun test completato
            </Typography>
            <Typography variant="body2">
              I test completati appariranno qui
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default CompletedTestsList;