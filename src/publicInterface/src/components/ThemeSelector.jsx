import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, SimpleGrid, useColorMode,
  Button, Tabs, TabList, TabPanels, Tab, TabPanel,
  useColorModeValue, Flex, Tooltip, IconButton, Switch, FormControl, FormLabel,
  useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Divider,
  Icon
} from '@chakra-ui/react';
import { MdRefresh, MdDelete, MdLightMode, MdDarkMode } from 'react-icons/md';
import ThemeMaker from './ThemeMaker';
import ThemeQuiz from './ThemeQuiz';
import { predefinedThemes } from '../theme/predefinedThemes';
import { useDynamicTheme } from '../context/DynamicThemeContext';

/**
 * Componente per la selezione e gestione dei temi dell'applicazione
 */
const ThemeSelector = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [selectedTab, setSelectedTab] = useState(0);
  const [customThemes, setCustomThemes] = useState([]);
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const deleteAlertRef = React.useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [themeToDelete, setThemeToDelete] = useState(null);
  
  // Usa il contesto del tema dinamico
  const { currentTheme, changeTheme, deleteCustomTheme } = useDynamicTheme();
  
  // Carica i temi personalizzati dal localStorage
  const loadCustomThemes = () => {
    const savedThemes = localStorage.getItem('customThemes');
    if (savedThemes) {
      try {
        setCustomThemes(JSON.parse(savedThemes));
      } catch (e) {
        console.error('Errore nel parsing dei temi salvati:', e);
        setCustomThemes([]);
      }
    }
  };
  
  // Carica i temi all'avvio
  useEffect(() => {
    loadCustomThemes();
    
    // Ascolta gli eventi di cambiamento dei temi personalizzati
    const handleThemesChanged = () => {
      loadCustomThemes();
    };
    
    window.addEventListener('customThemesChanged', handleThemesChanged);
    return () => {
      window.removeEventListener('customThemesChanged', handleThemesChanged);
    };
  }, []);
  
  // Salva i temi personalizzati nel localStorage
  const saveCustomTheme = (theme) => {
    const updatedThemes = [...customThemes, theme];
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
  };
  
  // Gestisce l'eliminazione di un tema
  const handleDeleteTheme = (theme, e) => {
    // Ferma la propagazione per evitare che il click raggiunga la card
    e.stopPropagation();
    setThemeToDelete(theme);
    onOpen();
  };
  
  // Conferma l'eliminazione del tema
  const confirmDeleteTheme = () => {
    if (themeToDelete) {
      deleteCustomTheme(themeToDelete.id);
      loadCustomThemes();
    }
    onClose();
  };
  
  // Genera un tema casuale
  const generateRandomTheme = () => {
    const primaryHue = Math.floor(Math.random() * 360);
    const secondaryHue = (primaryHue + Math.floor(Math.random() * 120 + 120)) % 360;
    
    const randomTheme = {
      id: `random-${Date.now()}`,
      name: `Tema Casuale ${new Date().toLocaleDateString()}`,
      description: 'Tema generato casualmente',
      colors: {
        brand: {
          50: `hsl(${primaryHue}, 90%, 95%)`,
          100: `hsl(${primaryHue}, 85%, 90%)`,
          200: `hsl(${primaryHue}, 80%, 80%)`,
          300: `hsl(${primaryHue}, 75%, 70%)`,
          400: `hsl(${primaryHue}, 70%, 60%)`,
          500: `hsl(${primaryHue}, 65%, 50%)`,
          600: `hsl(${primaryHue}, 70%, 40%)`,
          700: `hsl(${primaryHue}, 75%, 30%)`,
          800: `hsl(${primaryHue}, 80%, 20%)`,
          900: `hsl(${primaryHue}, 85%, 10%)`,
        },
        accent: {
          50: `hsl(${secondaryHue}, 90%, 95%)`,
          100: `hsl(${secondaryHue}, 85%, 90%)`,
          500: `hsl(${secondaryHue}, 65%, 50%)`,
          700: `hsl(${secondaryHue}, 75%, 30%)`,
          900: `hsl(${secondaryHue}, 85%, 10%)`,
        }
      },
      transition: {
        duration: `${0.2 + Math.random() * 0.3}s`,
        easing: ['ease', 'ease-in', 'ease-out', 'ease-in-out'][Math.floor(Math.random() * 4)]
      }
    };
    
    saveCustomTheme(randomTheme);
    changeTheme(randomTheme);
    return randomTheme;
  };
  
  // Filtra i temi predefiniti per tipo
  const solidThemes = predefinedThemes.filter(theme => !theme.layout || theme.layout.type !== 'gradient');
  const gradientThemes = predefinedThemes.filter(theme => theme.layout && theme.layout.type === 'gradient');
  
  // Renderizza una card per un tema
  const ThemeCard = ({ theme, isCustom = false }) => {
    const isActive = currentTheme && currentTheme.id === theme.id;
    
    return (
      <Box
        p={4}
        borderRadius="md"
        border="2px solid"
        borderColor={isActive ? 'brand.500' : borderColor}
        bg={cardBg}
        cursor="pointer"
        onClick={() => changeTheme(theme)}
        transition="all 0.2s"
        _hover={{ transform: 'translateY(-4px)', shadow: 'md' }}
        position="relative"
        overflow="hidden"
      >
        {/* Anteprima colori del tema */}
        <Flex mb={3}>
          {[50, 100, 500, 700, 900].map(shade => (
            <Box 
              key={shade} 
              bg={theme.colors.brand[shade]} 
              w="100%" 
              h="20px"
              borderRadius={shade === 50 ? '4px 0 0 4px' : shade === 900 ? '0 4px 4px 0' : '0'}
            />
          ))}
        </Flex>
        
        <Heading size="sm" mb={1}>{theme.name}</Heading>
        <Text fontSize="xs" noOfLines={2}>{theme.description}</Text>
        
        {isActive && (
          <Box 
            position="absolute" 
            top={2} 
            right={2} 
            w={2} 
            h={2} 
            borderRadius="full" 
            bg="green.500" 
          />
        )}
        
        {/* Pulsante di eliminazione per i temi personalizzati */}
        {isCustom && (
          <IconButton
            aria-label="Elimina tema"
            icon={<MdDelete />}
            size="xs"
            position="absolute"
            bottom={2}
            right={2}
            colorScheme="red"
            variant="ghost"
            onClick={(e) => handleDeleteTheme(theme, e)}
          />
        )}
      </Box>
    );
  };
  
  // Gestisce il salvataggio di un tema dal ThemeMaker
  const handleSaveTheme = (theme) => {
    saveCustomTheme(theme);
    changeTheme(theme);
  };
  
  // Gestisce il tema risultante dal quiz
  const handleQuizTheme = (theme) => {
    saveCustomTheme(theme);
    changeTheme(theme);
  };
  
  return (
    <VStack spacing={4} align="stretch" w="100%">
      <Heading size="md" mb={2}>Personalizzazione Tema</Heading>
      
      {/* Selettore Modalità Chiaro/Scuro */}
      <Flex justify="space-between" align="center" mb={2}>
        <FormControl display="flex" alignItems="center" maxW="300px">
          <FormLabel htmlFor="color-mode-switch" mb="0" display="flex" alignItems="center">
            <Icon as={colorMode === 'light' ? MdLightMode : MdDarkMode} mr={2} />
            {colorMode === 'light' ? 'Modalità Chiara' : 'Modalità Scura'}
          </FormLabel>
          <Switch 
            id="color-mode-switch" 
            isChecked={colorMode === 'dark'} 
            onChange={toggleColorMode} 
            colorScheme="blue"
          />
        </FormControl>
      </Flex>
      
      <Divider my={2} />
      
      <Tabs variant="soft-rounded" colorScheme="blue" index={selectedTab} onChange={setSelectedTab}>
        <TabList mb={4} overflowX="auto" py={2}>
          <Tab>Temi Predefiniti</Tab>
          <Tab>Theme Maker</Tab>
          <Tab>Quiz Tema</Tab>
          <Tab>Personalizzati</Tab>
        </TabList>
        
        <TabPanels>
          {/* Temi predefiniti */}
          <TabPanel p={0}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="medium">Temi a tinta unita</Text>
                <Tooltip label="Genera un tema casuale">
                  <Button 
                    leftIcon={<MdRefresh />} 
                    colorScheme="blue" 
                    size="sm"
                    onClick={generateRandomTheme}
                  >
                    Tema Casuale
                  </Button>
                </Tooltip>
              </Flex>
              
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                {solidThemes.map(theme => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </SimpleGrid>
              
              <Divider my={4} />
              
              <Text fontWeight="medium">Temi con gradiente</Text>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                {gradientThemes.map(theme => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </SimpleGrid>
            </VStack>
          </TabPanel>
          
          {/* Theme Maker */}
          <TabPanel p={0}>
            <ThemeMaker onSave={handleSaveTheme} />
          </TabPanel>
          
          {/* Quiz Tema */}
          <TabPanel p={0}>
            <ThemeQuiz onComplete={handleQuizTheme} />
          </TabPanel>
          
          {/* Temi personalizzati */}
          <TabPanel p={0}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="medium">I tuoi temi personalizzati</Text>
                <Tooltip label="Genera un tema casuale">
                  <Button 
                    leftIcon={<MdRefresh />} 
                    colorScheme="blue" 
                    size="sm"
                    onClick={generateRandomTheme}
                  >
                    Tema Casuale
                  </Button>
                </Tooltip>
              </Flex>
              
              {customThemes.length > 0 ? (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                  {customThemes.map(theme => (
                    <ThemeCard key={theme.id} theme={theme} isCustom={true} />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">Non hai ancora temi personalizzati.</Text>
                  <Text color="gray.500" fontSize="sm" mt={2}>
                    Creane uno con Theme Maker o genera un tema casuale!
                  </Text>
                </Box>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Dialog di conferma per l'eliminazione */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={deleteAlertRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Elimina Tema
            </AlertDialogHeader>

            <AlertDialogBody>
              Sei sicuro di voler eliminare il tema "{themeToDelete?.name}"? 
              Questa azione non può essere annullata.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={deleteAlertRef} onClick={onClose}>
                Annulla
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteTheme} ml={3}>
                Elimina
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default ThemeSelector;