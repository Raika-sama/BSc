import {
  Box, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody,
  DrawerCloseButton, VStack, Text, Divider, Icon, Flex,
  useColorModeValue, Link as ChakraLink
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { MdDashboard, MdAnalytics, MdPerson, MdSettings, MdHelp, MdHome } from 'react-icons/md';

const NavItem = ({ icon, children, to }) => {
  const activeBg = useColorModeValue('brand.50', 'rgba(0,136,204,0.2)');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: 'none' }}
      w="100%"
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
          color="brand.500"
        />
        <Text>{children}</Text>
      </Flex>
    </ChakraLink>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Contenuto della sidebar
  const SidebarContent = () => (
    <VStack spacing={1} align="stretch" pt={2}>
      <NavItem icon={MdHome} to="/">Home</NavItem>
      <NavItem icon={MdDashboard} to="/dashboard">Dashboard</NavItem>
      <NavItem icon={MdAnalytics} to="/analisi">Analisi</NavItem>
      <NavItem icon={MdPerson} to="/profilo">Profilo</NavItem>
      <Divider my={2} />
      <NavItem icon={MdSettings} to="/impostazioni">Impostazioni</NavItem>
      <NavItem icon={MdHelp} to="/supporto">Supporto</NavItem>
    </VStack>
  );

  return (
    <>
      {/* Versione mobile: Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
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
        bg={bgColor}
        borderRight="1px"
        borderColor={borderColor}
        position="sticky"
        top="0"
        h="calc(100vh - 0px)"
        pt="70px" // Spazio per l'header
        pb={4}
        overflowY="auto"
      >
        <SidebarContent />
      </Box>
    </>
  );
};

export default Sidebar;