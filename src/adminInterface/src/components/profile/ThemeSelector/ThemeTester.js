import React from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Switch, 
    Checkbox, 
    Radio, 
    Slider, 
    Fab, 
    Card, 
    CardContent,
    FormControlLabel
} from '@mui/material';
import { 
    Favorite, 
    Add, 
    Edit 
} from '@mui/icons-material';

const ThemeTester = () => {
  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Test dei colori del tema
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Questo componente mostra come vengono utilizzati i colori primari e secondari nei vari componenti MUI.
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            1. Pulsanti
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="contained" color="primary">Primary Button</Button>
            <Button variant="contained" color="secondary">Secondary Button</Button>
            <Button variant="outlined" color="primary">Outlined Primary</Button>
            <Button variant="outlined" color="secondary">Outlined Secondary</Button>
            <Button variant="text" color="primary">Text Primary</Button>
            <Button variant="text" color="secondary">Text Secondary</Button>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            2. Form Elements
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControlLabel 
              control={<Switch color="primary" defaultChecked />}
              label="Primary Switch" 
            />
            <FormControlLabel 
              control={<Switch color="secondary" defaultChecked />}
              label="Secondary Switch" 
            />
            <FormControlLabel 
              control={<Checkbox color="primary" defaultChecked />}
              label="Primary Checkbox" 
            />
            <FormControlLabel 
              control={<Checkbox color="secondary" defaultChecked />}
              label="Secondary Checkbox" 
            />
            <FormControlLabel 
              control={<Radio color="primary" defaultChecked />}
              label="Primary Radio" 
            />
            <FormControlLabel 
              control={<Radio color="secondary" defaultChecked />}
              label="Secondary Radio" 
            />
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            3. Slider
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', width: '100%' }}>
            <Box sx={{ width: '45%' }}>
              <Typography variant="caption">Primary Slider</Typography>
              <Slider defaultValue={30} color="primary" />
            </Box>
            <Box sx={{ width: '45%' }}>
              <Typography variant="caption">Secondary Slider</Typography>
              <Slider defaultValue={70} color="secondary" />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            4. Floating Action Buttons
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Fab color="primary" aria-label="add">
              <Add />
            </Fab>
            <Fab color="secondary" aria-label="edit">
              <Edit />
            </Fab>
            <Fab variant="extended" color="primary">
              <Favorite sx={{ mr: 1 }} />
              Primary
            </Fab>
            <Fab variant="extended" color="secondary">
              <Favorite sx={{ mr: 1 }} />
              Secondary
            </Fab>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            5. Colori diretti
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}>
              Primary Main
            </Box>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.light', 
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}>
              Primary Light
            </Box>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.dark', 
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}>
              Primary Dark
            </Box>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'secondary.main', 
              color: 'secondary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}>
              Secondary Main
            </Box>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'secondary.light', 
              color: 'secondary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}>
              Secondary Light
            </Box>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'secondary.dark', 
              color: 'secondary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}>
              Secondary Dark
            </Box>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mt: 4, fontStyle: 'italic' }}>
          Se il colore secondario non viene visualizzato correttamente in questi componenti, 
          potrebbe esserci un problema con la configurazione del tema.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ThemeTester;