import {
  Box, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody,
  DrawerCloseButton, VStack, Text, Divider, Icon, Flex,
  useColorModeValue, Link as ChakraLink
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdAnalytics, MdPerson, MdSettings, MdHelp, MdHome, MdLogout, MdAssignment } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import { useImpostazioni } from '../../hooks/ImpostazioniContext';

const NavItem = ({ icon, children, to, onClick }) => {
  const activeBg = useColorModeValue('brand.50', 'whiteAlpha.200');
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.300');
  const textColor = 'rgba(0, 0, 0, 0.75)'; // Colore fisso nero al 75% di opacità
  const logoutColor = useColorModeValue('red.600', 'red.300');

  // Se c'è un onClick, renderizza un button invece di un link
  if (onClick) {
    return (
      <Flex
        align="center"
        p="3"
        borderRadius="md"
        role="group"
        cursor="pointer"
        onClick={onClick}
        _hover={{ bg: hoverBg }}
        color={icon === MdLogout ? logoutColor : textColor}
        fontWeight="medium"
      >
        <Icon
          mr="3"
          fontSize="18"
          as={icon}
          color={icon === MdLogout ? logoutColor : textColor}
        />
        <Text>{children}</Text>
      </Flex>
    );
  }

  // Altrimenti renderizza un link
  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: 'none' }}
      w="100%"
      color={textColor}
    >
      <Flex
        align="center"
        p="3"
        borderRadius="md"
        role="group"
        cursor="pointer"
        _hover={{ bg: hoverBg }}
        fontWeight="medium"
      >
        <Icon
          mr="3"
          fontSize="18"
          as={icon}
          color={textColor}
        />
        <Text>{children}</Text>
      </Flex>
    </ChakraLink>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { logout } = useAuth();
  const { openImpostazioni } = useImpostazioni();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Prima naviga al login
      navigate('/login', { replace: true });
      
      // Poi esegui il logout
      await logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  // Contenuto della sidebar
  const SidebarContent = () => (
    <VStack spacing={1} align="stretch" pt={2}>
      <NavItem icon={MdHome} to="/">Home</NavItem>
      <NavItem icon={MdDashboard} to="/dashboard">Dashboard</NavItem>
      <NavItem icon={MdAnalytics} to="/analisi">Analisi</NavItem>
      <NavItem icon={MdAssignment} to="/test-assegnati">Test Assegnati</NavItem>
      <NavItem icon={MdPerson} to="/profilo">Profilo</NavItem>
      <Divider my={2} />
      <NavItem icon={MdSettings} onClick={openImpostazioni}>Impostazioni</NavItem>
      <NavItem icon={MdHelp} to="/supporto">Supporto</NavItem>
      <Divider my={2} />
      <NavItem icon={MdLogout} onClick={handleLogout}>Logout</NavItem>
    </VStack>
  );

  return (
    <>
      {/* Versione mobile: Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent className="sidebar">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Versione desktop: sidebar fissa */}
      <Box
        display={{ base: 'none', md: 'block' }}
        w="240px"
        className="sidebar"
        borderRight="1px"
        borderColor={borderColor}
        position="sticky"
        top="0"
        h="calc(100vh - 0px)"
        pt="70px"
        pb={4}
        overflowY="auto"
      >
        <SidebarContent />
      </Box>
    </>
  );
};

export default Sidebar;