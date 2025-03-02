import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, Text, SimpleGrid, useColorMode,
  Button, Tabs, TabList, TabPanels, Tab, TabPanel,
  useColorModeValue, Flex, Tooltip
} from '@chakra-ui/react';
import { MdRefresh, MdAutoAwesome, MdPalette, MdSave } from 'react-icons/md';
import ThemeMaker from './ThemeMaker';
import ThemeQuiz from './ThemeQuiz';
import { predefinedThemes } from '../theme/predefinedThemes';

/**
 * Componente per la selezione e gestione dei temi dell'applicazione
 */
const ThemeSelector = ({ onThemeChange, currentTheme }) => {
  const { colorMode } = useColorMode();
  const [selectedTab, setSelectedTab] = useState(0);
  const [customThemes, setCustomThemes] = useState([]);
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Carica i temi personalizzati dal localStorage
  useEffect(() => {
    const savedThemes = localStorage.getItem('customThemes');
    if (savedThemes) {
      try {
        setCustomThemes(JSON.parse(savedThemes));
      } catch (e) {
        console.error('Errore nel parsing dei temi salvati:', e);
        setCustomThemes([]);
      }
    }
  }, []);
  
  // Salva i temi personalizzati nel localStorage
  const saveCustomTheme = (theme) => {
    const updatedThemes = [...customThemes, theme];
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
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
    onThemeChange(randomTheme);
    return randomTheme;
  };
  
  // Renderizza una card per un tema
  const ThemeCard = ({ theme }) => {
    const isActive = currentTheme && currentTheme.id === theme.id;
    
    return (
      <Box
        p={4}
        borderRadius="md"
        border="2px solid"
        borderColor={isActive ? 'brand.500' : borderColor}
        bg={cardBg}
        cursor="pointer"
        onClick={() => onThemeChange(theme)}
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
      </Box>
    );
  };
  
  // Gestisce il salvataggio di un tema dal ThemeMaker
  const handleSaveTheme = (theme) => {
    saveCustomTheme(theme);
    onThemeChange(theme);
  };
  
  // Gestisce il tema risultante dal quiz
  const handleQuizTheme = (theme) => {
    saveCustomTheme(theme);
    onThemeChange(theme);
  };
  
  return (
    <VStack spacing={4} align="stretch" w="100%">
      <Heading size="md" mb={2}>Personalizzazione Tema</Heading>
      
      <Tabs variant="soft-rounded" colorScheme="blue" index={selectedTab} onChange={setSelectedTab}>
        <TabList mb={4} overflowX="auto" py={2}>
          <Tab>Predefiniti</Tab>
          <Tab>Personalizzati</Tab>
          <Tab>Theme Maker</Tab>
          <Tab>Quiz Tema</Tab>
        </TabList>
        
        <TabPanels>
          {/* Temi predefiniti */}
          <TabPanel p={0}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="medium">Temi predefiniti del sistema</Text>
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
                {predefinedThemes.map(theme => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </SimpleGrid>
            </VStack>
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
                    <ThemeCard key={theme.id} theme={theme} />
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
          
          {/* Theme Maker */}
          <TabPanel p={0}>
            <ThemeMaker onSave={handleSaveTheme} />
          </TabPanel>
          
          {/* Quiz Tema */}
          <TabPanel p={0}>
            <ThemeQuiz onComplete={handleQuizTheme} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default ThemeSelector;