import React, { useState } from 'react';
import {
  Box, VStack, Heading, Text, Button, RadioGroup, Radio,
  Progress, Flex, useColorModeValue, Card, SimpleGrid,
  Image, HStack, IconButton, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { MdNavigateNext, MdNavigateBefore, MdCheckCircle, MdReplay } from 'react-icons/md';

/**
 * Quiz che crea un tema personalizzato basato sulle risposte dell'utente
 */
const ThemeQuiz = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Domande del quiz
  const questions = [
    {
      id: 'season',
      question: 'Quale stagione preferisci?',
      options: [
        { value: 'spring', label: 'Primavera', image: '🌸', colors: { hue: 330, saturation: 80, lightness: 60 } }, // Rosa
        { value: 'summer', label: 'Estate', image: '☀️', colors: { hue: 40, saturation: 100, lightness: 50 } }, // Giallo
        { value: 'autumn', label: 'Autunno', image: '🍂', colors: { hue: 25, saturation: 90, lightness: 45 } }, // Arancione
        { value: 'winter', label: 'Inverno', image: '❄️', colors: { hue: 210, saturation: 70, lightness: 60 } } // Blu
      ]
    },
    {
      id: 'environment',
      question: 'Quale ambiente ti rilassa di più?',
      options: [
        { value: 'forest', label: 'Foresta', image: '🌳', colors: { hue: 120, saturation: 60, lightness: 30 } }, // Verde scuro
        { value: 'beach', label: 'Spiaggia', image: '🏖️', colors: { hue: 195, saturation: 75, lightness: 55 } }, // Azzurro
        { value: 'mountain', label: 'Montagna', image: '🏔️', colors: { hue: 280, saturation: 25, lightness: 45 } }, // Viola tenue
        { value: 'city', label: 'Città', image: '🏙️', colors: { hue: 200, saturation: 15, lightness: 30 } } // Blu grigiastro
      ]
    },
    {
      id: 'mood',
      question: 'Come ti senti oggi?',
      options: [
        { value: 'energetic', label: 'Energico', image: '⚡', colors: { hue: 50, saturation: 100, lightness: 50 } }, // Giallo acceso
        { value: 'calm', label: 'Calmo', image: '🧘', colors: { hue: 180, saturation: 40, lightness: 70 } }, // Turchese chiaro
        { value: 'creative', label: 'Creativo', image: '🎨', colors: { hue: 300, saturation: 80, lightness: 60 } }, // Viola
        { value: 'focused', label: 'Concentrato', image: '🧠', colors: { hue: 220, saturation: 70, lightness: 45 } } // Blu
      ]
    },
    {
      id: 'time',
      question: 'Quale momento della giornata preferisci?',
      options: [
        { value: 'dawn', label: 'Alba', image: '🌅', colors: { hue: 25, saturation: 80, lightness: 65 } }, // Arancione chiaro
        { value: 'day', label: 'Giorno', image: '☀️', colors: { hue: 200, saturation: 100, lightness: 70 } }, // Azzurro cielo
        { value: 'sunset', label: 'Tramonto', image: '🌇', colors: { hue: 15, saturation: 90, lightness: 55 } }, // Arancione rossastro
        { value: 'night', label: 'Notte', image: '🌃', colors: { hue: 240, saturation: 80, lightness: 20 } } // Blu notte
      ]
    },
    {
      id: 'style',
      question: 'Che stile preferisci?',
      options: [
        { value: 'minimal', label: 'Minimalista', image: '⬜', colors: { hue: 0, saturation: 0, lightness: 95 } }, // Quasi bianco
        { value: 'vibrant', label: 'Vivace', image: '🌈', colors: { hue: 320, saturation: 80, lightness: 60 } }, // Rosa acceso
        { value: 'elegant', label: 'Elegante', image: '✨', colors: { hue: 40, saturation: 30, lightness: 40 } }, // Dorato scuro
        { value: 'futuristic', label: 'Futuristico', image: '🚀', colors: { hue: 260, saturation: 60, lightness: 55 } } // Viola elettrico
      ]
    }
  ];
  
  // Mappatura delle combinazioni di risposte a effetti di transizione
  const transitionMappings = {
    energetic: { duration: 0.1, easing: 'ease-in' }, // Transizioni veloci per energia
    calm: { duration: 0.5, easing: 'ease-out' }, // Transizioni lente e morbide per calma
    creative: { duration: 0.3, easing: 'ease-in-out' }, // Transizioni espressive per creatività
    focused: { duration: 0.2, easing: 'linear' }, // Transizioni precise per focus
    minimal: { duration: 0.2, easing: 'ease' }, // Transizioni standard per minimalismo
    vibrant: { duration: 0.25, easing: 'ease-in-out' }, // Transizioni vivaci
    elegant: { duration: 0.4, easing: 'ease' }, // Transizioni fluide per eleganza
    futuristic: { duration: 0.15, easing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)' } // Transizioni tecnologiche
  };
  
  // Avanza alla prossima domanda
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateResult();
    }
  };
  
  // Torna alla domanda precedente
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Salva la risposta alla domanda corrente
  const handleAnswerChange = (value) => {
    setAnswers({
      ...answers,
      [questions[currentStep].id]: value
    });
  };
  
  // Genera il tema basato sulle risposte dell'utente
  const generateResult = () => {
    // Estrai tutte le opzioni scelte
    const selectedOptions = questions.map(question => {
      const selectedValue = answers[question.id];
      return question.options.find(option => option.value === selectedValue);
    });
    
    // Calcola la media dei valori HSL per il colore primario
    const primaryColorValues = selectedOptions.reduce(
      (acc, option) => {
        if (!option) return acc; // Salta se non c'è opzione
        return {
          hue: acc.hue + option.colors.hue,
          saturation: acc.saturation + option.colors.saturation,
          lightness: acc.lightness + option.colors.lightness
        };
      },
      { hue: 0, saturation: 0, lightness: 0 }
    );
    
    const count = selectedOptions.filter(Boolean).length;
    const primaryHue = Math.round(primaryColorValues.hue / count) % 360;
    const primarySaturation = Math.round(primaryColorValues.saturation / count);
    const primaryLightness = Math.round(primaryColorValues.lightness / count);
    
    // Genera un colore di accento complementare (opposto sulla ruota dei colori)
    const accentHue = (primaryHue + 180) % 360;
    
    // Scegli la transizione in base all'umore/stile principale
    let transition = { duration: 0.3, easing: 'ease' }; // Default
    if (answers.mood && transitionMappings[answers.mood]) {
      transition = transitionMappings[answers.mood];
    } else if (answers.style && transitionMappings[answers.style]) {
      transition = transitionMappings[answers.style];
    }
    
    // Genera una palette di colori completa per primario e accento
    const generatePalette = (hue, saturation, lightness) => ({
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
    });
    
    // Crea il tema risultante
    const themeResult = {
      id: `quiz-${Date.now()}`,
      name: `Tema ${getThemeName()}`,
      description: `Tema creato in base alle tue preferenze: ${getThemeDescription()}`,
      colors: {
        brand: generatePalette(primaryHue, primarySaturation, primaryLightness),
        accent: generatePalette(accentHue, primarySaturation, primaryLightness)
      },
      transition: {
        duration: `${transition.duration}s`,
        easing: transition.easing
      }
    };
    
    setResult(themeResult);
    onOpen();
  };
  
  // Genera un nome per il tema basato sulle risposte
  const getThemeName = () => {
    const seasonMapping = {
      spring: 'Primavera',
      summer: 'Estate',
      autumn: 'Autunno',
      winter: 'Inverno'
    };
    
    const moodMapping = {
      energetic: 'Energico',
      calm: 'Sereno',
      creative: 'Creativo',
      focused: 'Concentrato'
    };
    
    let name = '';
    if (answers.mood && moodMapping[answers.mood]) {
      name += moodMapping[answers.mood] + ' ';
    }
    if (answers.season && seasonMapping[answers.season]) {
      name += seasonMapping[answers.season];
    } else {
      name += 'Personalizzato';
    }
    
    return name;
  };
  
  // Genera una descrizione del tema basata sulle risposte
  const getThemeDescription = () => {
    const descriptions = [];
    
    if (answers.season) {
      descriptions.push(`stagione preferita: ${answers.season}`);
    }
    if (answers.environment) {
      descriptions.push(`ambiente: ${answers.environment}`);
    }
    if (answers.mood) {
      descriptions.push(`umore: ${answers.mood}`);
    }
    
    return descriptions.join(', ');
  };
  
  // Salva e applica il tema risultante
  const handleSaveTheme = () => {
    onComplete(result);
    onClose();
    resetQuiz();
  };
  
  // Reimposta il quiz
  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  };
  
  // La domanda corrente
  const currentQuestion = questions[currentStep];
  
  // Progresso del quiz
  const progress = ((currentStep + 1) / questions.length) * 100;
  
  // Renderizza una opzione di risposta
  const Option = ({ option }) => (
    <Box
      as="label"
      cursor="pointer"
      borderWidth="1px"
      borderRadius="md"
      p={4}
      bg={answers[currentQuestion.id] === option.value ? 'brand.50' : cardBg}
      borderColor={answers[currentQuestion.id] === option.value ? 'brand.500' : 'gray.200'}
      _hover={{ borderColor: 'brand.300' }}
      transition="all 0.2s"
    >
      <Radio 
        value={option.value} 
        colorScheme="blue"
        size="lg"
        mb={2}
      >
        <HStack spacing={2} mt={1}>
          <Text fontSize="xl">{option.image}</Text>
          <Text fontWeight="medium">{option.label}</Text>
        </HStack>
      </Radio>
    </Box>
  );
  
  return (
    <VStack spacing={6} align="stretch" w="100%">
      <VStack spacing={1} align="stretch">
        <Heading size="md">Crea il tuo tema con un quiz</Heading>
        <Text>Rispondi a queste 5 domande per generare un tema personalizzato.</Text>
      </VStack>
      
      <Progress value={progress} colorScheme="blue" size="sm" borderRadius="full" />
      
      <Card p={6} bg={cardBg}>
        <VStack spacing={6} align="stretch">
          <Heading size="md">{currentQuestion.question}</Heading>
          
          <RadioGroup 
            onChange={handleAnswerChange}
            value={answers[currentQuestion.id] || ''}
          >
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {currentQuestion.options.map((option) => (
                <Option key={option.value} option={option} />
              ))}
            </SimpleGrid>
          </RadioGroup>
          
          <Flex justify="space-between" mt={4}>
            <Button
              leftIcon={<MdNavigateBefore />}
              onClick={handlePrev}
              isDisabled={currentStep === 0}
              variant="ghost"
            >
              Indietro
            </Button>
            
            <Button
              rightIcon={currentStep === questions.length - 1 ? <MdCheckCircle /> : <MdNavigateNext />}
              onClick={handleNext}
              colorScheme="blue"
              isDisabled={!answers[currentQuestion.id]}
            >
              {currentStep === questions.length - 1 ? 'Completa quiz' : 'Avanti'}
            </Button>
          </Flex>
        </VStack>
      </Card>
      
      {/* Modal con il risultato del quiz */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Il tuo tema personalizzato</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {result && (
              <VStack spacing={5} align="stretch">
                <Heading size="md">{result.name}</Heading>
                <Text>{result.description}</Text>
                
                <Box>
                  <Text fontWeight="bold">Anteprima colori:</Text>
                  <HStack mt={2} spacing={0} borderRadius="md" overflow="hidden">
                    {[50, 100, 500, 700, 900].map(shade => (
                      <Box 
                        key={shade}
                        bg={result.colors.brand[shade]} 
                        w="100%" 
                        h="40px"
                      />
                    ))}
                  </HStack>
                  <HStack mt={2} spacing={0} borderRadius="md" overflow="hidden">
                    {[50, 100, 500, 700, 900].map(shade => (
                      <Box 
                        key={shade}
                        bg={result.colors.accent[shade]} 
                        w="100%" 
                        h="20px"
                      />
                    ))}
                  </HStack>
                </Box>
                
                <Flex justify="space-between" mt={4}>
                  <Button
                    leftIcon={<MdReplay />}
                    onClick={() => { onClose(); resetQuiz(); }}
                    variant="ghost"
                  >
                    Ricomincia quiz
                  </Button>
                  
                  <Button
                    rightIcon={<MdCheckCircle />}
                    onClick={handleSaveTheme}
                    colorScheme="blue"
                  >
                    Applica tema
                  </Button>
                </Flex>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ThemeQuiz;