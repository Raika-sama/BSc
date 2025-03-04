import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Grid, GridItem, Text, Input, 
  FormControl, FormLabel, Button, Slider, SliderTrack, 
  SliderFilledTrack, SliderThumb, Flex, Heading, Select,
  useColorModeValue, Tooltip, Card, CardBody, Modal,
  ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, useDisclosure, Tabs, TabList, Tab, 
  TabPanels, TabPanel, Switch, Stack, IconButton,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper
} from '@chakra-ui/react';
import { MdColorize, MdSave, MdPreview, MdRefresh, MdAdd, MdRemove } from 'react-icons/md';
import { useDynamicTheme } from '../context/DynamicThemeContext';

// Componenti di UI per il preview
const PreviewComponents = ({ colors, transition }) => {
  return (
    <VStack spacing={4} align="stretch" w="100%">
      {/* Card di esempio */}
      <Card borderRadius="md" overflow="hidden" transition={`all ${transition.duration} ${transition.easing}`}>
        <Box bg={colors.brand[500]} h="80px" />
        <CardBody>
          <Heading size="md" mb={2} color={colors.brand[700]}>Titolo Esempio</Heading>
          <Text>Questo è un esempio di come apparirà il tuo tema nell'applicazione.</Text>
          <Button mt={4} bg={colors.brand[500]} color="white" _hover={{ bg: colors.brand[600] }}>
            Pulsante Primario
          </Button>
        </CardBody>
      </Card>
      
      {/* Altri elementi UI */}
      <Box p={4} borderRadius="md" bg={colors.brand[50]} borderLeft="4px solid" borderColor={colors.brand[500]}>
        <Text fontWeight="bold" color={colors.brand[700]}>Nota Informativa</Text>
        <Text fontSize="sm">Ecco come apparirà un avviso nel tuo tema.</Text>
      </Box>
      
      <HStack spacing={2}>
        <Button size="sm" bg={colors.brand[500]} color="white">Primario</Button>
        <Button size="sm" variant="outline" borderColor={colors.brand[500]} color={colors.brand[500]}>Secondario</Button>
        <Button size="sm" variant="ghost" color={colors.brand[500]}>Azione Ghost</Button>
      </HStack>
      
      <Box borderRadius="md" overflow="hidden" bg={colors.accent[50]} p={2}>
        <Text fontSize="sm">Colore di accento: <Box as="span" color={colors.accent[500]} fontWeight="bold">testo evidenziato</Box></Text>
      </Box>
    </VStack>
  );
};

// Funzione helper per convertire un colore HSL o HEX in valori HSL
const extractHSL = (color) => {
  // Controlla se il colore è già in formato HSL
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    return {
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3])
    };
  }
  
  // Controlla se il colore è in formato HEX
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  // Converti HEX in RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Converti RGB in HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    
    h = Math.round(h * 60);
  }
  
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return { h, s, l };
};

/**
 * Editor visuale per creare e personalizzare temi
 */
const ThemeMaker = ({ onSave }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentTheme } = useDynamicTheme();
  
  // Stato per il tipo di tema
  const [themeType, setThemeType] = useState('solid');
  
  // Estrai i valori HSL dal tema corrente
  const [themeInitialized, setThemeInitialized] = useState(false);
  
  // Stato per i metadati del tema
  const [themeName, setThemeName] = useState('Il Mio Tema Personalizzato');
  const [themeDescription, setThemeDescription] = useState('Un tema creato con Theme Maker');
  
  // Stato per i colori
  const [primaryHue, setPrimaryHue] = useState(210);
  const [primarySaturation, setPrimarySaturation] = useState(65);
  const [primaryLightness, setPrimaryLightness] = useState(50);
  
  const [accentHue, setAccentHue] = useState(25);
  const [accentSaturation, setAccentSaturation] = useState(65);
  const [accentLightness, setAccentLightness] = useState(50);
  
  // Stato per le transizioni
  const [transitionDuration, setTransitionDuration] = useState(0.2);
  const [transitionEasing, setTransitionEasing] = useState('ease');
  
  // Stati per i gradienti
  const [gradients, setGradients] = useState({
    sidebar: {
      direction: '135deg',
      colors: ['#000000', '#333333']
    },
    topMenu: {
      direction: '90deg',
      colors: ['#000000', '#333333']
    },
    footer: {
      direction: '90deg',
      colors: ['#000000', '#333333']
    },
    background: {
      direction: '135deg',
      colors: ['#ffffff', '#f0f0f0']
    },
    text: {
      direction: '45deg',
      colors: ['#000000', '#333333']
    }
  });
  
  // Stati per le animazioni
  const [animations, setAnimations] = useState({
    glow: {
      enabled: false,
      intensity: 0.2,
      duration: '2s'
    },
    shine: {
      enabled: false,
      duration: '3s'
    },
    pulse: {
      enabled: false,
      intensity: 0.02,
      duration: '2s'
    }
  });
  
  // Inizializza i valori basandosi sul tema corrente
  useEffect(() => {
    if (currentTheme && !themeInitialized) {
      try {
        // Estrai i valori HSL dal colore primario (500)
        const primaryColor = currentTheme.colors.brand[500];
        const primaryHSL = extractHSL(primaryColor);
        
        // Estrai i valori HSL dal colore di accento (500)
        const accentColor = currentTheme.colors.accent[500];
        const accentHSL = extractHSL(accentColor);
        
        // Imposta i valori del tema
        setPrimaryHue(primaryHSL.h);
        setPrimarySaturation(primaryHSL.s);
        setPrimaryLightness(primaryHSL.l);
        
        setAccentHue(accentHSL.h);
        setAccentSaturation(accentHSL.s);
        setAccentLightness(accentHSL.l);
        
        // Imposta i valori di transizione
        if (currentTheme.transition) {
          const duration = parseFloat(currentTheme.transition.duration);
          if (!isNaN(duration)) {
            setTransitionDuration(duration);
          }
          
          if (currentTheme.transition.easing) {
            setTransitionEasing(currentTheme.transition.easing);
          }
        }
        
        // Imposta il nome e la descrizione con suffisso per indicare che è una modifica
        setThemeName(`${currentTheme.name} (Modificato)`);
        setThemeDescription(`Versione personalizzata di ${currentTheme.name}`);
        
        // Inizializza il tipo di tema
        if (currentTheme.layout?.type === 'gradient') {
          setThemeType('gradient');
          if (currentTheme.layout.gradient) {
            setGradients(currentTheme.layout.gradient);
          }
        }
        
        // Inizializza le animazioni
        if (currentTheme.animations) {
          setAnimations(currentTheme.animations);
        }
        
        setThemeInitialized(true);
      } catch (error) {
        console.error('Errore durante l\'inizializzazione del tema:', error);
      }
    }
  }, [currentTheme, themeInitialized]);
  
  // Genera la palette completa di colori basata sulle impostazioni HSL
  const generateColorPalette = (hue, saturation, lightness) => {
    return {
      50: `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 45, 95)}%)`,
      100: `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 40, 90)}%)`,
      200: `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 30, 80)}%)`,
      300: `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 20, 70)}%)`,
      400: `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 10, 60)}%)`,
      500: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      600: `hsl(${hue}, ${saturation}%, ${Math.max(lightness - 10, 10)}%)`,
      700: `hsl(${hue}, ${saturation}%, ${Math.max(lightness - 20, 10)}%)`,
      800: `hsl(${hue}, ${saturation}%, ${Math.max(lightness - 30, 10)}%)`,
      900: `hsl(${hue}, ${saturation}%, ${Math.max(lightness - 40, 5)}%)`,
    };
  };
  
  // Aggiorna un colore del gradiente
  const updateGradientColor = (section, index, color) => {
    setGradients(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        colors: prev[section].colors.map((c, i) => i === index ? color : c)
      }
    }));
  };
  
  // Aggiunge un colore al gradiente
  const addGradientColor = (section) => {
    setGradients(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        colors: [...prev[section].colors, '#000000']
      }
    }));
  };
  
  // Rimuove un colore dal gradiente
  const removeGradientColor = (section, index) => {
    if (gradients[section].colors.length > 2) {
      setGradients(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          colors: prev[section].colors.filter((_, i) => i !== index)
        }
      }));
    }
  };
  
  // Aggiorna la direzione del gradiente
  const updateGradientDirection = (section, direction) => {
    setGradients(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        direction
      }
    }));
  };
  
  // Aggiorna le proprietà delle animazioni
  const updateAnimation = (type, property, value) => {
    setAnimations(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [property]: value
      }
    }));
  };
  
  // Colori attuali del tema
  const themeColors = {
    brand: generateColorPalette(primaryHue, primarySaturation, primaryLightness),
    accent: generateColorPalette(accentHue, accentSaturation, accentLightness)
  };
  
  // Transizione attuale
  const themeTransition = {
    duration: `${transitionDuration}s`,
    easing: transitionEasing
  };
  
  // Genera un tema completo
  const generateTheme = () => {
    const theme = {
      id: `custom-${Date.now()}`,
      name: themeName,
      description: themeDescription,
      colors: {
        brand: generateColorPalette(primaryHue, primarySaturation, primaryLightness),
        accent: generateColorPalette(accentHue, accentSaturation, accentLightness)
      },
      transition: themeTransition,
      animations,
      layout: {
        type: themeType,
        ...(themeType === 'gradient' ? {
          gradient: gradients
        } : {
          colors: {
            sidebar: `hsl(${primaryHue}, ${primarySaturation}%, ${Math.max(primaryLightness - 20, 10)}%)`,
            topMenu: `hsl(${primaryHue}, ${primarySaturation}%, ${Math.max(primaryLightness - 10, 20)}%)`,
            footer: `hsl(${primaryHue}, ${primarySaturation}%, ${Math.max(primaryLightness - 30, 5)}%)`,
            background: `hsl(${primaryHue}, ${primarySaturation}%, ${Math.min(primaryLightness + 45, 95)}%)`
          }
        })
      }
    };
    
    return theme;
  };
  
  // Salva il tema
  const handleSaveTheme = () => {
    const theme = generateTheme();
    onSave(theme);
    onClose();
  };
  
  // Genera valori casuali per il tema
  const generateRandomValues = () => {
    setPrimaryHue(Math.floor(Math.random() * 360));
    setPrimarySaturation(Math.floor(Math.random() * 40) + 50); // 50-90%
    setPrimaryLightness(Math.floor(Math.random() * 30) + 40); // 40-70%
    
    setAccentHue(Math.floor(Math.random() * 360));
    setAccentSaturation(Math.floor(Math.random() * 40) + 50); // 50-90%
    setAccentLightness(Math.floor(Math.random() * 30) + 40); // 40-70%
    
    setTransitionDuration(Math.floor(Math.random() * 5 + 1) / 10); // 0.1-0.5s
    setTransitionEasing(['ease', 'ease-in', 'ease-out', 'ease-in-out'][Math.floor(Math.random() * 4)]);
  };
  
  // Card per visualizzare un campione di colore
  const ColorSwatch = ({ color, label }) => (
    <Tooltip label={color}>
      <VStack spacing={1}>
        <Box
          w="100%"
          h="36px"
          bg={color}
          borderRadius="md"
          border="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        />
        <Text fontSize="xs">{label}</Text>
      </VStack>
    </Tooltip>
  );
  
  // Componente per il controllo del gradiente
  const GradientControl = ({ section, label }) => (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <VStack align="stretch" spacing={2}>
        <Select
          value={gradients[section].direction}
          onChange={(e) => updateGradientDirection(section, e.target.value)}
        >
          <option value="0deg">Orizzontale →</option>
          <option value="90deg">Verticale ↓</option>
          <option value="45deg">Diagonale ↘</option>
          <option value="135deg">Diagonale ↙</option>
          <option value="180deg">Orizzontale ←</option>
          <option value="270deg">Verticale ↑</option>
        </Select>
        <Flex wrap="wrap" gap={2}>
          {gradients[section].colors.map((color, index) => (
            <HStack key={index}>
              <Box
                as="input"
                type="color"
                value={color}
                onChange={(e) => updateGradientColor(section, index, e.target.value)}
                w="60px"
                h="30px"
                borderRadius="md"
              />
              {gradients[section].colors.length > 2 && (
                <IconButton
                  icon={<MdRemove />}
                  size="sm"
                  onClick={() => removeGradientColor(section, index)}
                />
              )}
            </HStack>
          ))}
          <IconButton
            icon={<MdAdd />}
            size="sm"
            onClick={() => addGradientColor(section)}
          />
        </Flex>
        <Box
          h="20px"
          borderRadius="md"
          background={`linear-gradient(${gradients[section].direction}, ${gradients[section].colors.join(', ')})`}
        />
      </VStack>
    </FormControl>
  );
  
  // Componente per il controllo delle animazioni
  const AnimationControl = ({ type, label, hasIntensity = false }) => {
    // Verifica che questo tipo di animazione esista nell'oggetto animations
    const animationExists = animations[type] !== undefined;
    const isEnabled = animationExists && animations[type].enabled === true;
    
    return (
      <FormControl>
        <FormLabel>{label}</FormLabel>
        <VStack align="stretch" spacing={2}>
          <Switch
            isChecked={isEnabled}
            onChange={(e) => {
              // Inizializza l'animazione se non esiste
              if (!animationExists) {
                setAnimations(prev => ({
                  ...prev,
                  [type]: {
                    enabled: e.target.checked,
                    duration: '2s',
                    ...(hasIntensity ? { intensity: 0.2 } : {})
                  }
                }));
              } else {
                updateAnimation(type, 'enabled', e.target.checked);
              }
            }}
          >
            Attiva {label.toLowerCase()}
          </Switch>
          {isEnabled && (
            <>
              <FormControl>
                <FormLabel>Durata</FormLabel>
                <Select
                  value={animations[type].duration || '2s'}
                  onChange={(e) => updateAnimation(type, 'duration', e.target.value)}
                >
                  <option value="1s">Veloce (1s)</option>
                  <option value="2s">Normale (2s)</option>
                  <option value="3s">Lento (3s)</option>
                  <option value="5s">Molto lento (5s)</option>
                </Select>
              </FormControl>
              {hasIntensity && (
                <FormControl>
                  <FormLabel>Intensità</FormLabel>
                  <NumberInput
                    value={animations[type].intensity || 0.2}
                    onChange={(value) => updateAnimation(type, 'intensity', parseFloat(value))}
                    step={0.01}
                    min={0.01}
                    max={0.5}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}
            </>
          )}
        </VStack>
      </FormControl>
    );
  };
  
  return (
    <Box w="100%">
      <VStack spacing={6} align="stretch">
        <Heading size="md">Theme Maker</Heading>
        <Text>Modifica il tema corrente o crea il tuo tema personalizzato regolando colori e transizioni.</Text>
        
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          {/* Pannello controlli */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Tipo di tema</FormLabel>
                <Select value={themeType} onChange={(e) => setThemeType(e.target.value)}>
                  <option value="solid">Tinta unita</option>
                  <option value="gradient">Gradiente</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="theme-name">Nome del tema</FormLabel>
                <Input 
                  id="theme-name" 
                  value={themeName} 
                  onChange={(e) => setThemeName(e.target.value)} 
                  placeholder="Nome del tema"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="theme-description">Descrizione</FormLabel>
                <Input 
                  id="theme-description" 
                  value={themeDescription} 
                  onChange={(e) => setThemeDescription(e.target.value)} 
                  placeholder="Descrizione del tema"
                />
              </FormControl>
              
              <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
                <TabList>
                  <Tab>Colori Base</Tab>
                  <Tab>Layout</Tab>
                  <Tab>Animazioni</Tab>
                  <Tab>Transizioni</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Colori base */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel htmlFor="primary-hue">Tonalità ({primaryHue}°)</FormLabel>
                        <Slider 
                          id="primary-hue" 
                          min={0} 
                          max={359} 
                          step={1}
                          value={primaryHue} 
                          onChange={setPrimaryHue}
                        >
                          <SliderTrack bg="gray.200">
                            <SliderFilledTrack bg={`hsl(${primaryHue}, 80%, 50%)`} />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg={`hsl(${primaryHue}, ${primarySaturation}%, ${primaryLightness}%)`} />
                        </Slider>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel htmlFor="primary-saturation">Saturazione ({primarySaturation}%)</FormLabel>
                        <Slider 
                          id="primary-saturation" 
                          min={0} 
                          max={100} 
                          step={1}
                          value={primarySaturation} 
                          onChange={setPrimarySaturation}
                        >
                          <SliderTrack bg="gray.200">
                            <SliderFilledTrack bg={`hsl(${primaryHue}, 80%, 50%)`} />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg={`hsl(${primaryHue}, ${primarySaturation}%, ${primaryLightness}%)`} />
                        </Slider>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel htmlFor="primary-lightness">Luminosità ({primaryLightness}%)</FormLabel>
                        <Slider 
                          id="primary-lightness" 
                          min={10} 
                          max={90} 
                          step={1}
                          value={primaryLightness} 
                          onChange={setPrimaryLightness}
                        >
                          <SliderTrack bg="gray.200">
                            <SliderFilledTrack bg={`hsl(${primaryHue}, 80%, 50%)`} />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg={`hsl(${primaryHue}, ${primarySaturation}%, ${primaryLightness}%)`} />
                        </Slider>
                      </FormControl>
                      
                      <Text fontWeight="medium" mt={2}>Anteprima palette primaria:</Text>
                      <Flex justify="space-between" wrap="wrap" gap={2}>
                        {Object.entries(themeColors.brand).map(([key, color]) => (
                          <ColorSwatch key={key} color={color} label={key} />
                        ))}
                      </Flex>
                    </VStack>
                  </TabPanel>
                  
                  {/* Layout */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      {themeType === 'gradient' ? (
                        <>
                          <GradientControl section="sidebar" label="Sidebar" />
                          <GradientControl section="topMenu" label="Menu superiore" />
                          <GradientControl section="footer" label="Footer" />
                          <GradientControl section="background" label="Sfondo contenuto" />
                          <GradientControl section="text" label="Testo con gradiente" />
                        </>
                      ) : (
                        <Text>Il layout utilizzerà automaticamente le variazioni del colore primario</Text>
                      )}
                    </VStack>
                  </TabPanel>
                  
                  {/* Animazioni */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      <AnimationControl type="glow" label="Bagliore" hasIntensity={true} />
                      <AnimationControl type="shine" label="Riflesso" />
                      <AnimationControl type="pulse" label="Pulsazione" hasIntensity={true} />
                    </VStack>
                  </TabPanel>
                  
                  {/* Transizioni */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel htmlFor="transition-duration">Durata transizione ({transitionDuration}s)</FormLabel>
                        <Slider 
                          id="transition-duration" 
                          min={0.1} 
                          max={1.0} 
                          step={0.1}
                          value={transitionDuration} 
                          onChange={setTransitionDuration}
                        >
                          <SliderTrack bg="gray.200">
                            <SliderFilledTrack bg={themeColors.brand[500]} />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg={themeColors.brand[500]} />
                        </Slider>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel htmlFor="transition-easing">Tipo di transizione</FormLabel>
                        <Select 
                          id="transition-easing" 
                          value={transitionEasing} 
                          onChange={(e) => setTransitionEasing(e.target.value)}
                        >
                          <option value="ease">Naturale (ease)</option>
                          <option value="ease-in">Accelerazione (ease-in)</option>
                          <option value="ease-out">Decelerazione (ease-out)</option>
                          <option value="ease-in-out">Accelerazione e decelerazione (ease-in-out)</option>
                          <option value="linear">Lineare</option>
                        </Select>
                      </FormControl>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          </GridItem>
          
          {/* Pannello anteprima */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              <Heading size="sm">Anteprima del tema</Heading>
              <Box 
                p={4} 
                borderRadius="md" 
                border="1px dashed" 
                borderColor="gray.300"
                className={themeType === 'gradient' ? 'mainContent' : ''}
                bg={themeType === 'solid' ? useColorModeValue('gray.50', 'gray.800') : undefined}
              >
                <PreviewComponents colors={themeColors} transition={themeTransition} />
              </Box>
            </VStack>
          </GridItem>
        </Grid>
        
        <HStack spacing={4} justifyContent="flex-end">
          <Button 
            leftIcon={<MdRefresh />} 
            onClick={generateRandomValues}
            variant="outline"
          >
            Valori casuali
          </Button>
          <Button 
            leftIcon={<MdPreview />} 
            onClick={onOpen}
          >
            Anteprima completa
          </Button>
          <Button 
            leftIcon={<MdSave />} 
            colorScheme="blue"
            onClick={handleSaveTheme}
          >
            Salva tema
          </Button>
        </HStack>
      </VStack>
      
      {/* Modal anteprima completa */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Anteprima: {themeName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Text>{themeDescription}</Text>
              
              <Box>
                <Heading size="sm" mb={2}>Palette colori:</Heading>
                <Grid templateColumns="repeat(auto-fill, minmax(60px, 1fr))" gap={2}>
                  {Object.entries(themeColors.brand).map(([key, color]) => (
                    <ColorSwatch key={`brand-${key}`} color={color} label={`${key}`} />
                  ))}
                </Grid>
                <Grid templateColumns="repeat(auto-fill, minmax(60px, 1fr))" gap={2} mt={4}>
                  {Object.entries(themeColors.accent).map(([key, color]) => (
                    <ColorSwatch key={`accent-${key}`} color={color} label={`A-${key}`} />
                  ))}
                </Grid>
              </Box>
              
              <Box>
                <Heading size="sm" mb={3}>Anteprima componenti:</Heading>
                <PreviewComponents colors={themeColors} transition={themeTransition} />
              </Box>
              
              <Button 
                onClick={handleSaveTheme} 
                colorScheme="blue" 
                leftIcon={<MdSave />}
              >
                Salva e applica tema
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ThemeMaker;