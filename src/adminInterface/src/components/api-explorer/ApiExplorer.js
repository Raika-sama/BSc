import React, { useState } from 'react';
import { axiosInstance } from '../../services/axiosConfig';
import ContentLayout from '../common/ContentLayout';

import {
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Typography,
  IconButton,
  TextField,
  Button,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const endpoints = {
  auth: [
    { method: 'POST', path: '/auth/login', description: 'Login utente', body: { email: '', password: '' } },
  ],
  users: [
    { method: 'GET', path: '/users', description: 'Get users with pagination', query: { page: 1, limit: 10, search: '' } },
    { method: 'GET', path: '/users/me', description: 'Get current user profile' },
  ],
  schools: [
    { method: 'GET', path: '/schools', description: 'Get all schools' },
    { 
      method: 'GET', 
      path: '/schools/:id/sections', 
      description: 'Get school sections (Complex)',
      params: true,
      placeholders: { ':id': '' }
    },
    {
      method: 'POST',
      path: '/schools/:id/setup',
      description: 'Setup initial configuration',
      params: true,
      placeholders: { ':id': '' },
      body: {
        academicYear: '2024/2025',
        sections: [{ name: 'A', maxStudents: 25 }]
      }
    }
  ],
  classes: [
    { 
        method: 'GET', 
        path: '/classes', 
        description: 'Get all classes (Heavy)', 
        query: {
          page: 1,
          limit: 10
        }
      },
    { method: 'GET', path: '/classes/my-classes', description: 'Get my classes' },
    {
      method: 'POST',
      path: '/classes/transition',
      description: 'Handle year transition (Heavy)',
      body: {
        schoolId: '',
        fromYear: '2023/2024',
        toYear: '2024/2025',
        sections: []
      }
    },
    {
      method: 'POST',
      path: '/classes/initial-setup',
      description: 'Create initial setup',
      body: {
        schoolId: '',
        academicYear: '2024/2025',
        sections: [{ name: 'A', maxStudents: 25 }]
      }
    }
  ],
  students: [
    { 
        method: 'GET', 
        path: '/students', 
        description: 'Get all students (Heavy)',
        query: {
          page: 1,
          limit: 10,
          schoolId: '',
          classId: '',
          status: ''
        }
      },
    { method: 'GET', path: '/students/my-students', description: 'Get my students' },
    {
      method: 'POST',
      path: '/students/batch-assign',
      description: 'Batch assign to class (Heavy)',
      body: {
        studentIds: [],
        classId: '',
        academicYear: '2024/2025'
      }
    },
    {
      method: 'GET',
      path: '/students/search',
      description: 'Search with filters',
      query: { query: '', schoolId: '' }
    }
  ]
};

const ApiExplorer = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState('auth');
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestTime, setRequestTime] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [params, setParams] = useState({});
  const [queryParams, setQueryParams] = useState({});
  const [bodyContent, setBodyContent] = useState('');

  const breadcrumbs = [
    { text: 'Dashboard', path: '/admin' },
    { text: 'Strumenti', path: '/admin/tools' }
  ];

  const handleRequest = async () => {
    if (!selectedEndpoint) return;
    
    setLoading(true);
    setResponse(null);
    
    const startTime = performance.now();
    
    try {
      // Replace URL parameters
      let url = selectedEndpoint.path;
      if (selectedEndpoint.params) {
        Object.entries(params).forEach(([key, value]) => {
          url = url.replace(key, value);
        });
      }

      // Add query parameters
      if (selectedEndpoint.query) {
        const queryString = new URLSearchParams(queryParams).toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await axiosInstance({
        method: selectedEndpoint.method,
        url,
        data: selectedEndpoint.body ? JSON.parse(bodyContent || '{}') : undefined
      });
      
      const endTime = performance.now();
      setRequestTime(endTime - startTime);
      
      setResponse(response.data);
      setHistory(prev => [{
        endpoint: selectedEndpoint,
        timestamp: new Date().toISOString(),
        duration: endTime - startTime,
        status: response.status,
      }, ...prev.slice(0, 9)]);
      
    } catch (error) {
      setResponse({ 
        error: error.response?.data || error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndpointSelect = (endpoint) => {
    setSelectedEndpoint(endpoint);
    if (endpoint.body) {
      setBodyContent(JSON.stringify(endpoint.body, null, 2));
    } else {
      setBodyContent('');
    }
    if (endpoint.params) {
      setParams(endpoint.placeholders);
    } else {
      setParams({});
    }
    if (endpoint.query) {
      setQueryParams(endpoint.query);
    } else {
      setQueryParams({});
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return '#2196f3';
      case 'POST': return '#4caf50';
      case 'PUT': return '#ff9800';
      case 'DELETE': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <ContentLayout
      title="API Explorer"
      subtitle="Esplora e testa le API disponibili"
      breadcrumbs={breadcrumbs}
      helpText="Usa questo strumento per testare le chiamate API disponibili nel sistema"
    >
      <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
        {/* Left Panel - Endpoints */}
        <Paper 
          elevation={0}
          sx={{ 
            width: 400, 
            height: '100%',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={currentTab}
            onChange={(e, v) => setCurrentTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: theme => alpha(theme.palette.primary.main, 0.03),
              '& .MuiTab-root': {
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 600,
                minWidth: 100
              }
            }}
          >
            {Object.keys(endpoints).map(category => (
              <Tab 
                key={category} 
                label={category} 
                value={category}
              />
            ))}
          </Tabs>
          
          <List sx={{ 
            overflow: 'auto', 
            height: 'calc(100% - 48px)',
            '& .MuiListItem-root': {
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.04)
              },
              '&.Mui-selected': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.12)
                }
              }
            }
          }}>
            {endpoints[currentTab].map((endpoint, index) => (
              <ListItem
                key={index}
                button
                selected={selectedEndpoint?.path === endpoint.path}
                onClick={() => handleEndpointSelect(endpoint)}
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={endpoint.method}
                        size="small"
                        sx={{
                          bgcolor: getMethodColor(endpoint.method),
                          color: 'white',
                          minWidth: 60,
                          fontWeight: 600
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: theme => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800'
                        }}
                      >
                        {endpoint.path}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        display: 'block',
                        mt: 0.5
                      }}
                    >
                      {endpoint.description}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Right Panel - Request/Response */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedEndpoint && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              {/* Parameters Section */}
              {selectedEndpoint.params && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 2,
                      color: 'primary.main',
                      fontWeight: 600 
                    }}
                  >
                    URL Parameters
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.keys(params).map(param => (
                      <TextField
                        key={param}
                        label={param}
                        size="small"
                        value={params[param]}
                        onChange={(e) => setParams(prev => ({
                          ...prev,
                          [param]: e.target.value
                        }))}
                        sx={{ 
                          minWidth: 200,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Query Parameters */}
              {selectedEndpoint.query && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 2,
                      color: 'primary.main',
                      fontWeight: 600 
                    }}
                  >
                    Query Parameters
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.keys(queryParams).map(param => (
                      <TextField
                        key={param}
                        label={param}
                        size="small"
                        value={queryParams[param]}
                        onChange={(e) => setQueryParams(prev => ({
                          ...prev,
                          [param]: e.target.value
                        }))}
                        sx={{ 
                          minWidth: 200,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Request Body */}
              {selectedEndpoint.body && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 2,
                      color: 'primary.main',
                      fontWeight: 600 
                    }}
                  >
                    Request Body
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        borderRadius: 1.5
                      }
                    }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleRequest}
                disabled={loading}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  px: 3
                }}
              >
                {loading ? 'Executing...' : 'Execute'}
              </Button>
            </Paper>
          )}

          {/* Response Section */}
          {response && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                flex: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 2,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography 
                  variant="subtitle2"
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 600 
                  }}
                >
                  Response
                </Typography>
                {requestTime && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: 'text.secondary'
                  }}>
                    <AccessTimeIcon sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="caption">
                      {requestTime.toFixed(2)}ms
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: theme => theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.primary.main, 0.02),
                  borderRadius: 1.5,
                  overflow: 'auto',
                  maxHeight: '100%',
                  '& code': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: theme => theme.palette.mode === 'dark' 
                      ? 'grey.300' 
                      : 'grey.800'
                  },
                }}
              >
                <code>{JSON.stringify(response, null, 2)}</code>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </ContentLayout>
  );
};

export default ApiExplorer;