import React from 'react';
import { motion } from 'framer-motion';

const GaugeIndicator = ({ leftLabel, rightLabel, value, color }) => {
    const radius = 60;
    const strokeWidth = 4;
    const centerX = 100;
    const centerY = 80;
    
    // Calcola l'angolo per l'indicatore (da -90 a 90 gradi)
    const angleRange = 180; // range totale in gradi
    const normalizedValue = value - 50; // converte da 0-100 a -50/+50
    const angle = (normalizedValue * angleRange) / 100;
    
    // Calcola il punto finale dell'indicatore usando trigonometria
    const radians = (angle - 90) * (Math.PI / 180);
    const indicatorLength = radius - 10;
    const endX = centerX + indicatorLength * Math.cos(radians);
    const endY = centerY + indicatorLength * Math.sin(radians);
    
    // Genera i punti per l'arco della scala
    const generateScaleMarks = () => {
        const marks = [];
        for (let i = -90; i <= 90; i += 18) { // 10 marks totali
            const rad = i * (Math.PI / 180);
            const x = centerX + radius * Math.cos(rad);
            const y = centerY + radius * Math.sin(rad);
            const isCenter = i === 0;
            marks.push(
                <line
                    key={i}
                    x1={centerX + (radius - 8) * Math.cos(rad)}
                    y1={centerY + (radius - 8) * Math.sin(rad)}
                    x2={x}
                    y2={y}
                    stroke={isCenter ? "#374151" : "#9CA3AF"}
                    strokeWidth={isCenter ? 2 : 1}
                />
            );
        }
        return marks;
    };

    return (
        <div className="mb-12">
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{leftLabel}</span>
                <span className="text-sm font-medium text-gray-600">{rightLabel}</span>
            </div>
            
            <div className="relative">
                <svg width="200" height="120" className="mx-auto">
                    {/* Arco di fondo */}
                    <path
                        d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth={strokeWidth}
                    />
                    
                    {/* Segni della scala */}
                    {generateScaleMarks()}
                    
                    {/* Indicatore */}
                    <motion.line
                        initial={{ x2: centerX, y2: centerY - indicatorLength }}
                        animate={{ x2: endX, y2: endY }}
                        transition={{ type: "spring", stiffness: 60 }}
                        x1={centerX}
                        y1={centerY}
                        stroke={color}
                        strokeWidth={3}
                    />
                    
                    {/* Punto centrale */}
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={4}
                        fill={color}
                    />
                </svg>
                
                {/* Valore numerico */}
                <div className="text-center mt-2">
                    <span className="font-medium" style={{ color }}>
                        {value}%
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                        ({normalizedValue > 0 ? '+' : ''}{normalizedValue}% dall'equilibrio)
                    </span>
                </div>
            </div>
        </div>
    );
};

const DIMENSION_MAPPING = {
    'analitico': { 
        left: 'Analitico', 
        right: 'Globale', 
        color: '#2196f3',
        description: 'Modalità di elaborazione delle informazioni'
    },
    'sistematico': { 
        left: 'Sistematico', 
        right: 'Intuitivo', 
        color: '#4caf50',
        description: 'Approccio alla risoluzione dei problemi'
    },
    'verbale': { 
        left: 'Verbale', 
        right: 'Visivo', 
        color: '#ff9800',
        description: 'Preferenza nella modalità di apprendimento'
    },
    'impulsivo': { 
        left: 'Impulsivo', 
        right: 'Riflessivo', 
        color: '#9c27b0',
        description: 'Stile decisionale'
    },
    'dipendente': { 
        left: 'Dipendente', 
        right: 'Indipendente', 
        color: '#f44336',
        description: 'Autonomia nell\'apprendimento'
    }
};

const TestDetailsView = ({ test, formatDate }) => {
    if (!test) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">
                    Seleziona un test per visualizzarne i dettagli
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Risultati Test {test.test?.tipo || test.tipo}
                </h2>
                <p className="text-gray-600">
                    Completato il {formatDate(test.dataCompletamento)}
                </p>
            </div>

            {/* Indicatori */}
            <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-8">
                    Profilo Cognitivo
                </h3>
                <div className="space-y-6">
                    {test.punteggi && Object.entries(test.punteggi).map(([dimension, value]) => {
                        const mapping = DIMENSION_MAPPING[dimension];
                        if (!mapping) return null;

                        return (
                            <div key={dimension} className="border-b border-gray-100 pb-8 last:border-0">
                                <div className="text-sm text-gray-500 mb-4">
                                    {mapping.description}
                                </div>
                                <GaugeIndicator
                                    leftLabel={mapping.left}
                                    rightLabel={mapping.right}
                                    value={value}
                                    color={mapping.color}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Raccomandazioni */}
            {test.metadata?.profile?.recommendations && (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        Raccomandazioni
                    </h3>
                    <div className="space-y-2">
                        {test.metadata.profile.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start text-gray-600">
                                <span className="text-blue-500 mr-2">•</span>
                                <p>{rec}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestDetailsView;