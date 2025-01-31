// src/components/home/HomePage.js
import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Dialog,
  Grid,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import {
  Psychology,
  School,
  Analytics,
  Security,
  Menu as MenuIcon
} from '@mui/icons-material';
import Login from './Login';

const features = [
  {
    title: 'Test Standardizzati',
    description: 'Valutazioni psicometriche validate scientificamente per risultati affidabili',
    icon: <Psychology fontSize="large" />,
  },
  {
    title: 'Analisi Dettagliate',
    description: 'Report approfonditi e visualizzazioni intuitive dei risultati',
    icon: <Analytics fontSize="large" />,
  },
  {
    title: 'Gestione Scuole',
    description: 'Interfaccia dedicata per la gestione di istituti e classi',
    icon: <School fontSize="large" />,
  },
  {
    title: 'Sicurezza Garantita',
    description: 'Protezione dei dati e conformità con le normative sulla privacy',
    icon: <Security fontSize="large" />,
  },
];

const HomePage = () => {
  const [openLogin, setOpenLogin] = useState(false);
  const theme = useTheme();

  const handleOpenLogin = () => setOpenLogin(true);
  const handleCloseLogin = () => setOpenLogin(false);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header/Navbar */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Brain Scanner
          </Typography>
          <Button 
            color="primary" 
            variant="contained"
            onClick={handleOpenLogin}
          >
            Accedi
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          pt: 8,
          pb: 6,
          background: `linear-gradient(to bottom right, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Valutazione Cognitiva Online
          </Typography>
          <Typography
            variant="h5"
            align="center"
            paragraph
            sx={{ mb: 6 }}
          >
            Verifica del potenziale Cognitivo di studenti della scuola secondaria di primo e secondo grado
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleOpenLogin}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                px: 4,
                py: 2
              }}
            >
              Inizia Ora
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography
          variant="h3"
          align="center"
          color="primary"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Caratteristiche Principali
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    color: 'primary.main'
                  }}
                >
                  {feature.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2" align="center">
                    {feature.title}
                  </Typography>
                  <Typography align="center" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body1" align="center">
            © {new Date().getFullYear()} Brain Scanner. Tutti i diritti riservati.
          </Typography>
        </Container>
      </Box>

      {/* Login Modal */}
      <Dialog
        open={openLogin}
        onClose={handleCloseLogin}
        maxWidth="sm"
        fullWidth
      >
        <Login onSuccessfulLogin={handleCloseLogin} isModal={true} />
      </Dialog>
    </Box>
  );
};

export default HomePage;