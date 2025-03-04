import { Box, Flex, useDisclosure, useColorModeValue } from '@chakra-ui/react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';  // Importa Outlet
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

const Layout = ({ menuPosition = 'top' }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  // Chiudi la sidebar quando la finestra si ridimensiona a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  return (
    <Flex minH="100vh" direction="column" bg={bgColor}>
      {menuPosition === 'top' && (
        <Header 
          onSidebarToggle={onOpen} 
          showMenu={menuPosition === 'top'}
        />
      )}
      
      <Flex flex="1">
        <Sidebar isOpen={isOpen} onClose={onClose} />
        
        <Box flex="1" p={4} maxW="100%" className="mainContent">
          <Outlet />  {/* Usa Outlet invece di children */}
        </Box>
      </Flex>
      
      {menuPosition === 'bottom' && (
        <Footer 
          showMenu={menuPosition === 'bottom'}
        />
      )}
      
      {menuPosition === 'top' && <Footer showMenu={false} />}
    </Flex>
  );
};

export default Layout;