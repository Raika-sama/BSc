import React, { useState, useMemo } from 'react';
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
  ListItemButton,
  Collapse,
  Tooltip,
  Badge,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
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
  const [errorDetails, setErrorDetails] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // all, success, error

  const breadcrumbs = [
    { text: 'Dashboard', path: '/admin' },
    { text: 'Strumenti', path: '/admin/tools' }
  ];

  const filteredHistory = useMemo(() => {
    switch (historyFilter) {
      case 'success':
        return history.filter(item => item.success);
      case 'error':
        return history.filter(item => !item.success);
      default:
        return history;
    }
  }, [history, historyFilter]);

  const handleRequest = async () => {
    if (!selectedEndpoint) return;
    
    setLoading(true);
    setResponse(null);
    setErrorDetails(null);
    
    const startTime = performance.now();
    
    try {
      // Replace URL parameters
      let url = selectedEndpoint.path;
      if (selectedEndpoint.params) {
        Object.entries(params).forEach(([key, value]) => {
          if (!value) throw new Error(`Missing required URL parameter: ${key}`);
          url = url.replace(key, value);
        });
      }

      // Add query parameters
      if (selectedEndpoint.query) {
        const queryString = new URLSearchParams(
          Object.entries(queryParams).filter(([_, v]) => v !== '')
        ).toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      // Validate JSON body if present
      let parsedBody;
      if (selectedEndpoint.body && bodyContent) {
        try {
          parsedBody = JSON.parse(bodyContent);
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }

      const response = await axiosInstance({
        method: selectedEndpoint.method,
        url,
        data: parsedBody
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setRequestTime(duration);
      setResponse(response.data);
      
      // Add to history
      setHistory(prev => [{
        endpoint: selectedEndpoint,
        timestamp: new Date().toISOString(),
        duration,
        status: response.status,
        success: true
      }, ...prev.slice(0, 19)]); // Keep last 20 requests
      
    } catch (error) {
      const errorResponse = {
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      };
      
      setResponse(errorResponse);
      setErrorDetails({
        message: error.message,
        status: error.response?.status,
        details: error.response?.data
      });
      
      // Add failed request to history
      setHistory(prev => [{
        endpoint: selectedEndpoint,
        timestamp: new Date().toISOString(),
        duration: performance.now() - startTime,
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.message
      }, ...prev.slice(0, 19)]);
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

  const clearHistory = () => {
    setHistory([]);
    setShowHistory(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <ContentLayout
      title="API Explorer"
      subtitle="Esplora e testa le API disponibili"
      //breadcrumbs={breadcrumbs}
      helpText="Usa questo strumento per testare le chiamate API disponibili nel sistema"
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Request History">
            <IconButton 
              onClick={() => setShowHistory(!showHistory)}
              color={showHistory ? 'primary' : 'default'}
            >
              <Badge badgeContent={history.length} color="primary">
                <HistoryIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          {history.length > 0 && (
            <Tooltip title="Clear History">
              <IconButton onClick={clearHistory}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      }
    >
      <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
        {/* Left Panel - Endpoints & History */}
        <Box sx={{ width: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Endpoints Panel */}
          <Paper 
            elevation={0}
            sx={{ 
              flex: showHistory ? 0.6 : 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'flex 0.3s ease'
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

          {/* History Panel */}
          <Collapse in={showHistory} timeout="auto">
            <Paper
              elevation={0}
              sx={{
                flex: 0.4,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Request History
                </Typography>
                <Box>
                  <Tooltip title="Show All">
                    <IconButton 
                      size="small" 
                      onClick={() => setHistoryFilter('all')}
                      color={historyFilter === 'all' ? 'primary' : 'default'}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Show Successful">
                    <IconButton 
                      size="small" 
                      onClick={() => setHistoryFilter('success')}
                      color={historyFilter === 'success' ? 'primary' : 'default'}
                    >
                      <SuccessIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Show Errors">
                    <IconButton 
                      size="small" 
                      onClick={() => setHistoryFilter('error')}
                      color={historyFilter === 'error' ? 'primary' : 'default'}
                    >
                      <ErrorIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <List sx={{ 
                overflow: 'auto',
                maxHeight: 300,
                '& .MuiListItemButton-root': {
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }
              }}>
                {filteredHistory.map((item, index) => (
                  <ListItemButton 
                    key={index}
                    onClick={() => {
                      setCurrentTab(item.endpoint.category);
                      handleEndpointSelect(item.endpoint);
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={item.endpoint.method}
                            size="small"
                            sx={{
                              bgcolor: getMethodColor(item.endpoint.method),
                              color: 'white',
                              minWidth: 60,
                              fontWeight: 600
                            }}
                          />
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontFamily: 'monospace',
                              fontSize: '0.8rem'
                            }}
                          >
                            {item.endpoint.path}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          mt: 0.5 
                        }}>
                          {item.success ? (
                            <SuccessIcon 
                              fontSize="small" 
                              sx={{ color: 'success.main' }} 
                            />
                          ) : (
                            <ErrorIcon 
                              fontSize="small" 
                              sx={{ color: 'error.main' }} 
                            />
                          )}
                          <Typography variant="caption">
                            {formatTimestamp(item.timestamp)}
                          </Typography>
                          <Typography variant="caption">
                            {item.duration.toFixed(0)}ms
                          </Typography>
                          {!item.success && (
                            <Typography 
                              variant="caption" 
                              sx={{ color: 'error.main' }}
                            >
                              {item.status}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Collapse>
        </Box>

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

          {/* Error Alert */}
          {errorDetails && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {errorDetails.message}
              </Typography>
              {errorDetails.details && (
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                >
                  <code>
                    {JSON.stringify(errorDetails.details, null, 2)}
                  </code>
                </Box>
              )}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </ContentLayout>
  );
};

export default ApiExplorer;