import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Label 
} from 'recharts';

const CognitiveGauge = ({ 
  value = 50,
  leftLabel = '', 
  rightLabel = '', 
  color = '#2196f3',
  description = ''
}) => {
  // Normalizza il valore tra 0 e 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  
  // Calcola il valore per la visualizzazione del gauge
  const gaugeData = [
    { name: 'value', value: normalizedValue },
    { name: 'empty', value: 100 - normalizedValue }
  ];

  // Calcola la deviazione dall'equilibrio (50%)
  const deviation = normalizedValue - 50;
  const deviationText = deviation > 0 ? `+${deviation}` : deviation;

  // Colori per il gauge
  const colors = [color, '#f5f5f5'];

  // Custom tooltip che mostra il valore preciso
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-lg rounded border text-sm">
          <p className="font-medium">{`${payload[0].value}%`}</p>
          <p className="text-gray-600">{`${deviationText}% dall'equilibrio`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Labels */}
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{leftLabel}</span>
        <span className="text-sm font-medium text-gray-600">{rightLabel}</span>
      </div>

      {/* Description */}
      {description && (
        <div className="text-sm text-gray-500 mb-2">
          {description}
        </div>
      )}

      {/* Gauge */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={0}
              dataKey="value"
            >
              {gaugeData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index]} 
                  strokeWidth={0}
                />
              ))}
              <Label
                value={`${normalizedValue}%`}
                position="center"
                fill={color}
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  transform: 'translateY(-20px)'
                }}
              />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Deviation indicator */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-500">
          {deviationText}% dall'equilibrio
        </span>
      </div>
    </div>
  );
};

export default CognitiveGauge;