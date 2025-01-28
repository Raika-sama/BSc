import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Divider,
  Button,
  Box
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';

const CompletedTestsList = ({
  tests = [],
  selectedTest,
  onTestSelect,
  onCreateTest
}) => {
  // Funzione per formattare le date in formato italiano
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Header con pulsante nuovo test */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Test Disponibili
        </Typography>
        <Button
          fullWidth
          variant="contained"
          startIcon={<QuizIcon />}
          onClick={onCreateTest}
          size="medium"
        >
          Somministra CSI
        </Button>
      </Box>

      {/* Lista test completati */}
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          '& .MuiListItemButton-root.Mui-selected': {
            backgroundColor: 'primary.light',
            '&:hover': {
              backgroundColor: 'primary.light',
            }
          }
        }}
        component="nav"
      >
        <ListItem sx={{ backgroundColor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>
          <ListItemText 
            primary={<Typography variant="subtitle2">Test Completati</Typography>}
          />
        </ListItem>
        
        <Divider />
        
        {tests.length > 0 ? (
          tests.map((test) => (
            <ListItemButton
              key={test._id}
              selected={selectedTest?._id === test._id}
              onClick={() => onTestSelect(test)}
              sx={{
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
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
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Test {test.tipo}
                    </Typography>
                    <Chip 
                      label="Completato"
                      size="small"
                      color="success"
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
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(test.dataCompletamento)}
                  </Typography>
                }
              />
            </ListItemButton>
          ))
        ) : (
          <ListItem>
            <ListItemText 
              secondary="Nessun test completato"
              sx={{ 
                textAlign: 'center',
                py: 2
              }}
            />
          </ListItem>
        )}
      </List>
    </>
  );
};

export default CompletedTestsList;