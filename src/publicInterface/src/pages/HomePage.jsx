import {
  Box, Heading, Text, Button, Stack, Container,
  SimpleGrid, Image, Icon, Flex, useColorModeValue
} from '@chakra-ui/react';
import { MdTrendingUp, MdInsights, MdSecurity } from 'react-icons/md';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, text, icon }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box
      p={5}
      borderRadius="lg"
      shadow="md"
      bg={bgColor}
      transition="transform 0.3s"
      _hover={{ transform: 'translateY(-5px)' }}
    >
      <Icon as={icon} w={10} h={10} color="brand.500" mb={4} />
      <Heading size="md" mb={2}>{title}</Heading>
      <Text>{text}</Text>
    </Box>
  );
};

const HomePage = ({ setMenuPosition }) => {
  return (
    <Box>
      {/* Hero section */}
      <Box 
        bg={useColorModeValue('brand.50', 'gray.700')} 
        py={20} 
        borderRadius="lg"
      >
        <Container maxW="container.xl">
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            spacing={10}
            align="center"
          >
            <Box flex={1}>
              <Heading 
                as="h1" 
                size="2xl" 
                lineHeight="shorter" 
                mb={5}
              >
                Scopri il potere del tuo cervello con <Text as="span" color="brand.500">BrainScanner</Text>
              </Heading>
              <Text fontSize="xl" mb={8}>
                Analizza, monitora e ottimizza le tue capacità cognitive 
                con la nostra piattaforma all'avanguardia.
              </Text>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  as={Link} 
                  to="/dashboard"
                >
                  Inizia ora
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  as={Link} 
                  to="/supporto"
                >
                  Scopri di più
                </Button>
              </Stack>
            </Box>
            <Flex flex={1} justify="center">
              <Image
                src="https://via.placeholder.com/500x400?text=Brain+Visualization"
                alt="Brain Scanner Visualization"
                borderRadius="lg"
                shadow="xl"
                maxH="400px"
              />
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Features section */}
      <Container maxW="container.xl" py={16}>
        <Heading as="h2" size="xl" mb={10} textAlign="center">
          Funzionalità principali
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <FeatureCard
            title="Analisi avanzate"
            text="Utilizza algoritmi all'avanguardia per analizzare i pattern cerebrali e ottenere insight dettagliati."
            icon={MdInsights}
          />
          <FeatureCard
            title="Monitoraggio progressi"
            text="Tieni traccia dei tuoi miglioramenti nel tempo con dashboard intuitive e grafici personalizzati."
            icon={MdTrendingUp}
          />
          <FeatureCard
            title="Privacy garantita"
            text="I tuoi dati sono protetti con crittografia di massimo livello e non vengono mai condivisi con terze parti."
            icon={MdSecurity}
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default HomePage;