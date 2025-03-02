import { 
  Box, Flex, IconButton, useColorModeValue, useColorMode,
  Heading, HStack, Menu, MenuButton, MenuList, MenuItem,
  Button, Avatar, Container, Spacer
} from '@chakra-ui/react';
import { HamburgerIcon, SunIcon, MoonIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

const Header = ({ onSidebarToggle, showMenu }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      as="header" 
      position="sticky" 
      top="0"
      bg={bgColor} 
      borderBottom="1px" 
      borderColor={borderColor}
      px={4}
      zIndex="1000"
      boxShadow="sm"
    >
      <Container maxW="container.xl">
        <Flex py={3} alignItems="center">
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            variant="ghost"
            icon={<HamburgerIcon fontSize="20px" />}
            onClick={onSidebarToggle}
            aria-label="Apri menu laterale"
            mr={2}
          />
          
          <Heading as="h1" size="md" letterSpacing="tight">
            BrainScanner
          </Heading>
          
          <Spacer />
          
          {showMenu && (
            <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
              <Button as={Link} to="/" variant="ghost">Home</Button>
              <Button as={Link} to="/dashboard" variant="ghost">Dashboard</Button>
              <Button as={Link} to="/analisi" variant="ghost">Analisi</Button>
              <Button as={Link} to="/supporto" variant="ghost">Supporto</Button>
            </HStack>
          )}
          
          <Spacer display={{ base: 'none', md: 'block' }} />
          
          <HStack spacing={3}>
            <IconButton
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Cambia tema"
            />
            
            <Menu>
              <MenuButton as={Button} variant="ghost" rounded="full">
                <Avatar size="sm" name="Utente" />
              </MenuButton>
              <MenuList>
                <MenuItem as={Link} to="/profilo">Profilo</MenuItem>
                <MenuItem as={Link} to="/impostazioni">Impostazioni</MenuItem>
                <MenuItem as={Link} to="/logout">Logout</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
        
        {showMenu && (
          <Flex display={{ base: 'flex', md: 'none' }} pb={2}>
            <Button as={Link} to="/" size="sm" variant="ghost" flex="1">Home</Button>
            <Button as={Link} to="/dashboard" size="sm" variant="ghost" flex="1">Dashboard</Button>
            <Button as={Link} to="/analisi" size="sm" variant="ghost" flex="1">Analisi</Button>
            <Button as={Link} to="/supporto" size="sm" variant="ghost" flex="1">Supporto</Button>
          </Flex>
        )}
      </Container>
    </Box>
  );
};

export default Header;