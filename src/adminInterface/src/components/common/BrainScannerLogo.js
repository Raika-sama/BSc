// src/components/common/BrainScannerLogo.js
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const BrainScannerLogo = ({ width = 40, height = 40 }) => {
    const theme = useTheme();
    
    // Determiniamo i colori in base al modo del tema
    const primaryColor = theme.palette.mode === 'dark'
        ? theme.palette.primary.contrastText // bianco in dark mode
        : theme.palette.primary.main; // colore primario in light mode

    const secondaryColor = theme.palette.mode === 'dark'
        ? alpha(theme.palette.primary.contrastText, 0.8) // bianco trasparente in dark mode
        : alpha(theme.palette.primary.main, 0.8); // colore primario trasparente in light mode

    // Per l'header, dove lo sfondo è colorato, usiamo sempre colori chiari
    const isInHeader = true; // puoi passare questa prop dal componente padre se necessario
    
    const logoColors = isInHeader ? {
        primary: theme.palette.primary.contrastText,
        secondary: alpha(theme.palette.primary.contrastText, 0.8)
    } : {
        primary: primaryColor,
        secondary: secondaryColor
    };

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 100 100"
            style={{
                transition: 'all 0.3s ease',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
        >
            {/* Contorno cervello */}
            <path
                d="M25 50 
                   C25 35 30 25 40 20 
                   C50 15 60 15 70 20 
                   C80 25 85 35 85 50
                   C85 65 80 75 70 80
                   C60 85 50 85 40 80
                   C30 75 25 65 25 50"
                fill="none"
                stroke={logoColors.primary}
                strokeWidth="2"
                opacity="0.9"
            />

            {/* Metà sinistra - Cervello organico */}
            <path
                d="M25 50 
                   C25 35 30 25 40 20 
                   C50 15 55 15 55 20
                   C55 35 55 65 55 80
                   C50 85 45 85 40 80
                   C30 75 25 65 25 50"
                fill={logoColors.primary}
                opacity="0.8"
            />

            {/* Dettagli cervello organico */}
            <path
                d="M30 45 C35 40 40 42 45 45"
                fill="none"
                stroke={logoColors.secondary}
                strokeWidth="1"
                opacity="0.9"
            />
            <path
                d="M32 55 C37 50 42 52 47 55"
                fill="none"
                stroke={logoColors.secondary}
                strokeWidth="1"
                opacity="0.9"
            />

            {/* Metà destra - Rete neurale */}
            <path
                d="M55 20 
                   C60 15 65 15 70 20
                   C80 25 85 35 85 50
                   C85 65 80 75 70 80
                   C65 85 60 85 55 80
                   C55 65 55 35 55 20"
                fill={logoColors.secondary}
                opacity="0.8"
            />

            {/* Nodi della rete neurale */}
            <circle cx="65" cy="30" r="2" fill={logoColors.primary} />
            <circle cx="75" cy="45" r="2" fill={logoColors.primary} />
            <circle cx="70" cy="60" r="2" fill={logoColors.primary} />
            <circle cx="65" cy="70" r="2" fill={logoColors.primary} />

            {/* Connessioni della rete neurale */}
            <line 
                x1="65" y1="30" 
                x2="75" y2="45" 
                stroke={logoColors.primary} 
                strokeWidth="1" 
            />
            <line 
                x1="75" y1="45" 
                x2="70" y2="60" 
                stroke={logoColors.primary} 
                strokeWidth="1" 
            />
            <line 
                x1="70" y1="60" 
                x2="65" y2="70" 
                stroke={logoColors.primary} 
                strokeWidth="1" 
            />
            <line 
                x1="65" y1="30" 
                x2="70" y2="60" 
                stroke={logoColors.primary} 
                strokeWidth="1" 
                opacity="0.5" 
            />

            {/* Effetto pulsante per i nodi */}
            <circle cx="65" cy="30" r="3" fill={logoColors.primary} opacity="0.3">
                <animate
                    attributeName="r"
                    values="3;4;3"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </circle>
            <circle cx="70" cy="60" r="3" fill={logoColors.primary} opacity="0.3">
                <animate
                    attributeName="r"
                    values="3;4;3"
                    dur="2s"
                    begin="0.5s"
                    repeatCount="indefinite"
                />
            </circle>
        </svg>
    );
};

export default BrainScannerLogo;