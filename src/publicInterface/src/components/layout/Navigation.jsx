import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, SettingsIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

/**
 * Componente di navigazione che mostra info studente e opzioni
 */
const Navigation = () => {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <Box 
      as="nav" 
      bg={bg} 
      borderBottom="1px" 
      borderColor={borderColor}
      py={3}
      px={5}
      position="sticky"
      top="0"
      zIndex="1000"
    >
      <Flex justify="space-between" align="center">
        <Link to="/">
          <Text fontWeight="bold" fontSize="xl">BrainScanner</Text>
        </Link>
        
        {student && (
          <HStack spacing={4}>
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                rightIcon={<ChevronDownIcon />}
              >
                <HStack>
                  <Avatar 
                    size="sm" 
                    name={student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : 'Studente'}
                    src={null}
                  />
                  {student.firstName && student.lastName && (
                    <Text fontSize="sm" display={{ base: 'none', md: 'block' }}>
                      {student.firstName} {student.lastName}
                    </Text>
                  )}
                </HStack>
              </MenuButton>
              
              <MenuList>
                <MenuItem as={Link} to="/impostazioni" icon={<SettingsIcon />}>
                  Impostazioni
                </MenuItem>
                <MenuItem as={Link} to="/test-assegnati" icon={<ExternalLinkIcon />}>
                  Test Assegnati
                </MenuItem>
                <MenuItem onClick={handleLogout} icon={<Icon as={FiLogOut} />}>
                  Esci
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

export default Navigation;