import {
  Box, Container, Stack, Text, Link, ButtonGroup, IconButton, Button,
  useColorModeValue, Divider, HStack, Flex, Icon
} from '@chakra-ui/react';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Footer = ({ showMenu = false }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = 'rgba(0, 0, 0, 0.75)'; // Colore fisso nero al 75% di opacità
  const linkColor = 'rgba(0, 0, 0, 0.75)'; // Colore fisso nero al 75% di opacità per i link
  const logoutColor = useColorModeValue('red.600', 'red.300');
  const menuBgHover = useColorModeValue('gray.100', 'whiteAlpha.300');
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
      className="footer"
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
                <Button as={RouterLink} to="/" variant="ghost" size="sm" color={textColor} _hover={{ bg: menuBgHover }}>Home</Button>
                <Button as={RouterLink} to="/dashboard" variant="ghost" size="sm" color={textColor} _hover={{ bg: menuBgHover }}>Dashboard</Button>
                <Button as={RouterLink} to="/analisi" variant="ghost" size="sm" color={textColor} _hover={{ bg: menuBgHover }}>Analisi</Button>
                <Button as={RouterLink} to="/supporto" variant="ghost" size="sm" color={textColor} _hover={{ bg: menuBgHover }}>Supporto</Button>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="sm"
                  color={logoutColor}
                  leftIcon={<Icon as={MdLogout} />}
                  _hover={{ bg: menuBgHover }}
                >
                  Logout
                </Button>
              </HStack>
            </Flex>
            
            {/* Versione mobile del menu inferiore */}
            <HStack spacing={2} display={{ base: 'flex', md: 'none' }} width="100%" overflow="auto">
              <Button as={RouterLink} to="/" variant="ghost" size="sm" flexShrink={0} color={textColor} _hover={{ bg: menuBgHover }}>Home</Button>
              <Button as={RouterLink} to="/dashboard" variant="ghost" size="sm" flexShrink={0} color={textColor} _hover={{ bg: menuBgHover }}>Dashboard</Button>
              <Button as={RouterLink} to="/analisi" variant="ghost" size="sm" flexShrink={0} color={textColor} _hover={{ bg: menuBgHover }}>Analisi</Button>
              <Button as={RouterLink} to="/supporto" variant="ghost" size="sm" flexShrink={0} color={textColor} _hover={{ bg: menuBgHover }}>Supporto</Button>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm"
                flexShrink={0}
                color={logoutColor}
                leftIcon={<Icon as={MdLogout} />}
                _hover={{ bg: menuBgHover }}
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
          <Text fontSize="sm" color={textColor}>© 2025 BrainScanner. Tutti i diritti riservati.</Text>
          
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={{ base: 2, sm: 4 }}>
            <Link href="/privacy" fontSize="sm" color={linkColor}>Privacy</Link>
            <Link href="/termini" fontSize="sm" color={linkColor}>Termini di Servizio</Link>
            <Link href="/contatti" fontSize="sm" color={linkColor}>Contatti</Link>
          </Stack>
          
          <ButtonGroup variant="ghost">
            <IconButton as="a" href="#" aria-label="LinkedIn" icon={<FaLinkedin />} color={linkColor} _hover={{ bg: menuBgHover }} />
            <IconButton as="a" href="#" aria-label="GitHub" icon={<FaGithub />} color={linkColor} _hover={{ bg: menuBgHover }} />
            <IconButton as="a" href="#" aria-label="Twitter" icon={<FaTwitter />} color={linkColor} _hover={{ bg: menuBgHover }} />
          </ButtonGroup>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;