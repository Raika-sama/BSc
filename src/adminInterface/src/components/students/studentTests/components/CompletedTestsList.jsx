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
  Box,
  alpha
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import { useTheme } from '@mui/material/styles';

const CompletedTestsList = ({
  tests = [],
  selectedTest,
  onTestSelect,
  onCreateTest
}) => {
  const theme = useTheme();

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
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          Test Disponibili
        </Typography>
        <Button
          fullWidth
          variant="contained"
          startIcon={<QuizIcon />}
          onClick={onCreateTest}
          sx={{
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          Somministra CSI
        </Button>
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
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {formatDate(test.dataCompletamento)}
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
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2">
              Nessun test completato
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default CompletedTestsList;