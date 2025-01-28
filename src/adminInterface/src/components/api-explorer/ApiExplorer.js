import React, { useState } from 'react';
import { axiosInstance } from '../../services/axiosConfig';
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
  Collapse,
  TextField,
  Button,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>API Explorer</Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Left Panel - Endpoints */}
        <Paper sx={{ width: 400, height: 'calc(100vh - 200px)' }}>
          <Tabs
            value={currentTab}
            onChange={(e, v) => setCurrentTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {Object.keys(endpoints).map(category => (
              <Tab 
                key={category} 
                label={category.toUpperCase()} 
                value={category}
              />
            ))}
          </Tabs>
          
          <List sx={{ overflow: 'auto', height: 'calc(100% - 48px)' }}>
            {endpoints[currentTab].map((endpoint, index) => (
              <ListItem
                key={index}
                button
                selected={selectedEndpoint?.path === endpoint.path}
                onClick={() => handleEndpointSelect(endpoint)}
                sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}
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
                          minWidth: 60
                        }}
                      />
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                      }}>
                        {endpoint.path}
                      </Typography>
                    </Box>
                  }
                  secondary={endpoint.description}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Right Panel - Request/Response */}
        <Box sx={{ flex: 1 }}>
          {selectedEndpoint && (
            <Paper sx={{ p: 2, mb: 2 }}>
              {/* Parameters Section */}
              {selectedEndpoint.params && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>URL Parameters</Typography>
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
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}

              {/* Query Parameters */}
              {selectedEndpoint.query && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Query Parameters</Typography>
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
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}

              {/* Request Body */}
              {selectedEndpoint.body && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Request Body</Typography>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleRequest}
                disabled={loading}
              >
                {loading ? 'Executing...' : 'Execute'}
              </Button>
            </Paper>
          )}

          {/* Response Section */}
          {response && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Response</Typography>
                {requestTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      {requestTime.toFixed(2)}ms
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 400,
                  '& code': {
                    fontFamily: 'monospace',
                  },
                }}
              >
                <code>{JSON.stringify(response, null, 2)}</code>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ApiExplorer;