import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Switch,
  VStack,
  Divider,
  Text,
  RadioGroup,
  Radio,
  Stack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import ThemeSelector from './ThemeSelector';

/**
 * Modal per le impostazioni dell'applicazione
 */
const ImpostazioniModal = ({ isOpen, onClose, setMenuPosition }) => {
  const [menuPos, setMenuPos] = useState(localStorage.getItem('menuPosition') || 'top');
  const toast = useToast();

  // Sincronizza lo stato interno con lo stato dell'app
  useEffect(() => {
    if (localStorage.getItem('menuPosition')) {
      setMenuPos(localStorage.getItem('menuPosition'));
    }
  }, [isOpen]); // Aggiorna quando il modal viene aperto

  const handleMenuPositionChange = (newPosition) => {
    setMenuPos(newPosition);
  };

  const handleSaveSettings = () => {
    // Salva la posizione del menu
    localStorage.setItem('menuPosition', menuPos);
    
    // Aggiorna l'app principale
    if (setMenuPosition && typeof setMenuPosition === 'function') {
      setMenuPosition(menuPos);
    }
    
    // Mostra un toast di conferma
    toast({
      title: "Impostazioni salvate",
      description: "Le tue preferenze sono state aggiornate con successo.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    // Chiudi il modal
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW={{ base: "90%", md: "800px" }}>
        <ModalHeader>Impostazioni</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs variant="line" colorScheme="blue">
            <TabList mb={4}>
              <Tab>Generali</Tab>
              <Tab>Temi</Tab>
            </TabList>
            
            <TabPanels>
              {/* Scheda impostazioni generali */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch" divider={<Divider />}>
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
                </VStack>
              </TabPanel>
              
              {/* Scheda gestione temi */}
              <TabPanel px={0}>
                <ThemeSelector />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Chiudi
          </Button>
          <Button colorScheme="blue" onClick={handleSaveSettings}>
            Salva impostazioni
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImpostazioniModal;