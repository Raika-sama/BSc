import React, { useState } from 'react';
import {
  Box, VStack, HStack, Grid, GridItem, Text, Input, 
  FormControl, FormLabel, Button, Slider, SliderTrack, 
  SliderFilledTrack, SliderThumb, Flex, Heading, Select,
  useColorModeValue, Tooltip, Card, CardBody, Modal,
  ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, useDisclosure, Tabs, TabList, Tab, 
  TabPanels, TabPanel
} from '@chakra-ui/react';
import { MdColorize, MdSave, MdPreview, MdRefresh } from 'react-icons/md';

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

/**
 * Editor visuale per creare e personalizzare temi
 */
const ThemeMaker = ({ onSave }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [themeName, setThemeName] = useState('Il Mio Tema Personalizzato');
  const [themeDescription, setThemeDescription] = useState('Un tema creato con Theme Maker');
  
  // Stato per i colori
  const [primaryHue, setPrimaryHue] = useState(210); // Blu
  const [primarySaturation, setPrimarySaturation] = useState(65);
  const [primaryLightness, setPrimaryLightness] = useState(50);
  
  const [accentHue, setAccentHue] = useState(25); // Arancione
  const [accentSaturation, setAccentSaturation] = useState(65);
  const [accentLightness, setAccentLightness] = useState(50);
  
  // Stato per le transizioni
  const [transitionDuration, setTransitionDuration] = useState(0.2);
  const [transitionEasing, setTransitionEasing] = useState('ease');
  
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
    return {
      id: `custom-${Date.now()}`,
      name: themeName,
      description: themeDescription,
      colors: themeColors,
      transition: themeTransition
    };
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
  
  return (
    <Box w="100%">
      <VStack spacing={6} align="stretch">
        <Heading size="md">Theme Maker</Heading>
        <Text>Crea il tuo tema personalizzato regolando colori e transizioni.</Text>
        
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          {/* Pannello controlli */}
          <GridItem>
            <VStack spacing={4} align="stretch">
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
                  <Tab>Colore Primario</Tab>
                  <Tab>Colore Accento</Tab>
                  <Tab>Transizioni</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Colore primario */}
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
                  
                  {/* Colore accento */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel htmlFor="accent-hue">Tonalità ({accentHue}°)</FormLabel>
                        <Slider 
                          id="accent-hue" 
                          min={0} 
                          max={359} 
                          step={1}
                          value={accentHue} 
                          onChange={setAccentHue}
                        >
                          <SliderTrack bg="gray.200">
                            <SliderFilledTrack bg={`hsl(${accentHue}, 80%, 50%)`} />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg={`hsl(${accentHue}, ${accentSaturation}%, ${accentLightness}%)`} />
                        </Slider>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel htmlFor="accent-saturation">Saturazione ({accentSaturation}%)</FormLabel>
                        <Slider 
                          id="accent-saturation" 
                          min={0} 
                          max={100} 
                          step={1}
                          value={accentSaturation} 
                          onChange={setAccentSaturation}
                        >
                          <SliderTrack bg="gray.200">
                            <SliderFilledTrack bg={`hsl(${accentHue}, 80%, 50%)`} />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg={`hsl(${accentHue}, ${accentSaturation}%, ${accentLightness}%)`} />
                        </Slider>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel htmlFor="accent-lightness">Luminosità ({accentLightness}%)</FormLabel>
                        <Slider 
                          id="accent-lightness" 
                          min={10} 
                          max={90} 
                          step={1}
                          value={accentLightness} 
                          onChange={setAccentLightness}
                        >
                          <SliderTrack bg="gray.200">
                            <SliderFilledTrack bg={`hsl(${accentHue}, 80%, 50%)`} />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg={`hsl(${accentHue}, ${accentSaturation}%, ${accentLightness}%)`} />
                        </Slider>
                      </FormControl>
                      
                      <Text fontWeight="medium" mt={2}>Anteprima palette accento:</Text>
                      <Flex justify="space-between" wrap="wrap" gap={2}>
                        {Object.entries(themeColors.accent).map(([key, color]) => (
                          <ColorSwatch key={key} color={color} label={key} />
                        ))}
                      </Flex>
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
                bg={useColorModeValue('gray.50', 'gray.800')}
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