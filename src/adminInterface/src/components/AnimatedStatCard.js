import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { CardHeader, IconButton } from '@mui/material';
import { Refresh } from '@mui/icons-material';

const AnimatedStatCard = ({ title, value, icon, color, trend, percentage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card>
        <CardHeader
          avatar={
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <Box
                sx={{
                  backgroundColor: `${color}.light`,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                }}
              >
                {icon}
              </Box>
            </motion.div>
          }
          action={
            <IconButton size="small">
              <Refresh />  {/* Qui era l'errore: cambiato da RefreshIcon a Refresh */}
            </IconButton>
          }
        />
        <CardContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Typography variant="h4" component="div" gutterBottom>
              {value}
            </Typography>
          </motion.div>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {trend && (
              <motion.div
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Box 
                  display="flex" 
                  alignItems="center" 
                  sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}
                >
                  {trend === 'up' ? "↑" : "↓"}
                  <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                    {percentage}%
                  </Typography>
                </Box>
              </motion.div>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnimatedStatCard;