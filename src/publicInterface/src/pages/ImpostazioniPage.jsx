import {
  Box, Container, Heading, FormControl, FormLabel, Switch,
  VStack, Divider, Text, RadioGroup, Radio, Stack,
  useColorMode, Button, useToast
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

const ImpostazioniPage = ({ setMenuPosition }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [menuPos, setMenuPos] = useState(localStorage.getItem('menuPosition') || 'top');
  const toast = useToast();

  // Aggiorna l'app quando cambia la posizione del menu
  useEffect(() => {
    if (setMenuPosition && typeof setMenuPosition === 'function') {
      setMenuPosition(menuPos);
    }
  }, [menuPos, setMenuPosition]);

  const handleMenuPositionChange = (newPosition) => {
    setMenuPos(newPosition);
    // Salviamo anche in localStorage qui per sicurezza
    localStorage.setItem('menuPosition', newPosition);
  };

  const handleSaveSettings = () => {
    // Applica tutte le impostazioni
    if (setMenuPosition && typeof setMenuPosition === 'function') {
      setMenuPosition(menuPos);
    }
    
    toast({
      title: "Impostazioni salvate",
      description: "Le tue preferenze sono state aggiornate con successo.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.md" py={8}>
      <Heading as="h1" size="xl" mb={8}>Impostazioni</Heading>
      
      <VStack spacing={6} align="stretch" divider={<Divider />}>
        <Box>
          <Heading size="md" mb={4}>Tema e Interfaccia</Heading>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="theme-toggle" mb="0">
              Tema scuro
            </FormLabel>
            <Switch 
              id="theme-toggle" 
              isChecked={colorMode === 'dark'}
              onChange={toggleColorMode}
            />
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel htmlFor="menu-position">Posizione del menu</FormLabel>
            <Text fontSize="sm" color="gray.500" mb={2}>
              Cambia la posizione del menu principale
            </Text>
            <RadioGroup id="menu-position" value={menuPos} onChange={handleMenuPositionChange}>
              <Stack direction="row" spacing={5}>
                <Radio value="top">In alto</Radio>
                <Radio value="bottom">In basso</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </Box>
        
        <Box>
          <Heading size="md" mb={4}>Notifiche</Heading>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="notify-email" mb="0">
              Email
            </FormLabel>
            <Switch id="notify-email" defaultChecked />
          </FormControl>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="notify-push" mb="0">
              Notifiche push
            </FormLabel>
            <Switch id="notify-push" />
          </FormControl>
        </Box>
        
        <Box>
          <Button colorScheme="blue" onClick={handleSaveSettings}>
            Salva impostazioni
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};

export default ImpostazioniPage;