import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

const CognitiveGauge = ({ 
  value = 50,
  leftLabel = '', 
  rightLabel = '', 
  color = '#2196f3',
  description = ''
}) => {
  // Normalizza il valore tra 0 e 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  
  // Dati per il grafico
  const data = {
    datasets: [{
      data: [normalizedValue, 100 - normalizedValue],
      backgroundColor: [color, '#f5f5f5'],
      borderWidth: 0
    }],
  };

  // Opzioni per il grafico
  const options = {
    cutout: '70%',
    plugins: {
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            const deviation = normalizedValue - 50;
            const deviationText = deviation > 0 ? `+${deviation}` : deviation;
            return `${tooltipItem.raw}% (${deviationText}% dall'equilibrio)`;
          }
        }
      },
      legend: {
        display: false
      }
    }
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
        <Doughnut data={data} options={options} />
      </div>

      {/* Deviation indicator */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-500">
          {normalizedValue - 50}% dall'equilibrio
        </span>
      </div>
    </div>
  );
};

export default CognitiveGauge;