// src/components/home/Login.js
import React, { useState } from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = ({ onSuccessfulLogin, isModal = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      console.log('Login response:', userData); // Per debug
      
      if (isModal && onSuccessfulLogin) {
        onSuccessfulLogin();
      }
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error details:', error); // Per debug
      setError(
        error.response?.data?.error?.message || 
        error.response?.data?.message || 
        'Email o password non validi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: isModal ? 4 : 0 }}>
      <Box 
        sx={{
          width: '100%',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: isModal ? 0 : 3,
          p: 4,
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ mb: 4 }}
        >
          Admin Login
        </Typography>

        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
            sx={{ mb: 2 }}
          />

          {error && (
            <Typography 
              color="error" 
              variant="body2" 
              align="center"
              sx={{ mb: 2 }}
            >
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isLoading}
            sx={{ 
              mt: 2,
              height: 48,
              position: 'relative'
            }}
          >
            {isLoading ? (
              <CircularProgress 
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default Login;