import {
  Box, Container, Stack, Text, Link, ButtonGroup, IconButton, Button,
  useColorModeValue, Divider, HStack, Flex, Icon
} from '@chakra-ui/react';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Footer = ({ showMenu = false }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('red.600', 'red.300');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      navigate('/login', { replace: true });
      await logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <Box
      as="footer"
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      position={showMenu ? "sticky" : "relative"}
      bottom={showMenu ? "0" : "auto"}
      width="100%"
      py={4}
    >
      <Container maxW="container.xl">
        {showMenu && (
          <>
            <Flex justify="center" mb={4}>
              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <Button as={RouterLink} to="/" variant="ghost" size="sm">Home</Button>
                <Button as={RouterLink} to="/dashboard" variant="ghost" size="sm">Dashboard</Button>
                <Button as={RouterLink} to="/analisi" variant="ghost" size="sm">Analisi</Button>
                <Button as={RouterLink} to="/supporto" variant="ghost" size="sm">Supporto</Button>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="sm"
                  color={textColor}
                  leftIcon={<Icon as={MdLogout} />}
                >
                  Logout
                </Button>
              </HStack>
            </Flex>
            
            {/* Versione mobile del menu inferiore */}
            <HStack spacing={2} display={{ base: 'flex', md: 'none' }} width="100%" overflow="auto">
              <Button as={RouterLink} to="/" variant="ghost" size="sm" flexShrink={0}>Home</Button>
              <Button as={RouterLink} to="/dashboard" variant="ghost" size="sm" flexShrink={0}>Dashboard</Button>
              <Button as={RouterLink} to="/analisi" variant="ghost" size="sm" flexShrink={0}>Analisi</Button>
              <Button as={RouterLink} to="/supporto" variant="ghost" size="sm" flexShrink={0}>Supporto</Button>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm"
                flexShrink={0}
                color={textColor}
                leftIcon={<Icon as={MdLogout} />}
              >
                Logout
              </Button>
            </HStack>
            
            <Divider mb={4} />
          </>
        )}
        
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify={{ base: 'center', md: 'space-between' }}
          align={{ base: 'center', md: 'center' }}
        >
          <Text fontSize="sm">© 2025 BrainScanner. Tutti i diritti riservati.</Text>
          
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={{ base: 2, sm: 4 }}>
            <Link href="/privacy" fontSize="sm">Privacy</Link>
            <Link href="/termini" fontSize="sm">Termini di Servizio</Link>
            <Link href="/contatti" fontSize="sm">Contatti</Link>
          </Stack>
          
          <ButtonGroup variant="ghost" color="gray.600">
            <IconButton as="a" href="#" aria-label="LinkedIn" icon={<FaLinkedin />} />
            <IconButton as="a" href="#" aria-label="GitHub" icon={<FaGithub />} />
            <IconButton as="a" href="#" aria-label="Twitter" icon={<FaTwitter />} />
          </ButtonGroup>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;