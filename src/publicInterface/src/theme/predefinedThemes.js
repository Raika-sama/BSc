/**
 * Temi predefiniti per l'applicazione
 */
export const predefinedThemes = [
    {
      id: 'default-blue',
      name: 'BrainScanner Default',
      description: 'Il tema predefinito dell\'applicazione con tonalità blu',
      colors: {
        brand: {
          50: '#e6f7ff',
          100: '#b3e0ff',
          200: '#80caff',
          300: '#4db5ff',
          400: '#1a9fff',
          500: '#0088cc',
          600: '#006da3',
          700: '#00527a',
          800: '#003652',
          900: '#001b29',
        },
        accent: {
          50: '#fff8e6',
          100: '#ffebb3',
          200: '#ffdf80',
          300: '#ffd24d',
          400: '#ffc51a',
          500: '#e6b800',
          600: '#b39200',
          700: '#806d00',
          800: '#4d4000',
          900: '#1a1600',
        }
      },
      transition: {
        duration: '0.2s',
        easing: 'ease',
      }
    },
    {
      id: 'emerald-green',
      name: 'Smeraldo',
      description: 'Un tema elegante con tonalità verde smeraldo',
      colors: {
        brand: {
          50: '#e6fff7',
          100: '#b3ffe6',
          200: '#80ffd4',
          300: '#4dffc2',
          400: '#1affb1',
          500: '#00e699',
          600: '#00b377',
          700: '#008055',
          800: '#004d33',
          900: '#001a11',
        },
        accent: {
          50: '#fff0e6',
          100: '#ffd9b3',
          200: '#ffc180',
          300: '#ffaa4d',
          400: '#ff921a',
          500: '#e67700',
          600: '#b35e00',
          700: '#804400',
          800: '#4d2900',
          900: '#1a0e00',
        }
      },
      transition: {
        duration: '0.25s',
        easing: 'ease-out',
      }
    },
    {
      id: 'sunset-orange',
      name: 'Tramonto',
      description: 'Un tema caldo ispirato al tramonto con tonalità arancioni',
      colors: {
        brand: {
          50: '#fff0e6',
          100: '#ffd9b3',
          200: '#ffc180',
          300: '#ffaa4d',
          400: '#ff921a',
          500: '#e67700',
          600: '#b35e00',
          700: '#804400',
          800: '#4d2900',
          900: '#1a0e00',
        },
        accent: {
          50: '#e6f7ff',
          100: '#b3e0ff',
          200: '#80caff',
          300: '#4db5ff',
          400: '#1a9fff',
          500: '#0088cc',
          600: '#006da3',
          700: '#00527a',
          800: '#003652',
          900: '#001b29',
        }
      },
      transition: {
        duration: '0.3s',
        easing: 'ease-in-out',
      }
    },
    {
      id: 'royal-purple',
      name: 'Porpora Reale',
      description: 'Un tema elegante con tonalità viola regale',
      colors: {
        brand: {
          50: '#f5e6ff',
          100: '#dfb3ff',
          200: '#c980ff',
          300: '#b34dff',
          400: '#9d1aff',
          500: '#8400e6',
          600: '#6900b3',
          700: '#4d0080',
          800: '#30004d',
          900: '#10001a',
        },
        accent: {
          50: '#fffae6',
          100: '#fff2b3',
          200: '#ffea80',
          300: '#ffe34d',
          400: '#ffdb1a',
          500: '#e6c300',
          600: '#b39800',
          700: '#806d00',
          800: '#4d4200',
          900: '#1a1600',
        }
      },
      transition: {
        duration: '0.22s',
        easing: 'ease',
      }
    },
    {
      id: 'dark-tech',
      name: 'Tech Scuro',
      description: 'Un tema scuro moderno con accenti al neon, perfetto per lunghe sessioni',
      colors: {
        brand: {
          50: '#e6fff9',
          100: '#b3ffee',
          200: '#80ffe3',
          300: '#4dffd8',
          400: '#1affcd',
          500: '#00e6b5',
          600: '#00b38e',
          700: '#008067',
          800: '#004d3d',
          900: '#001a14',
        },
        accent: {
          50: '#ffe6fb',
          100: '#ffb3f3',
          200: '#ff80eb',
          300: '#ff4de3',
          400: '#ff1adb',
          500: '#e600c2',
          600: '#b30098',
          700: '#80006d',
          800: '#4d0041',
          900: '#1a0016',
        }
      },
      transition: {
        duration: '0.15s',
        easing: 'ease-in',
      }
    },
    {
      id: 'rose-gold',
      name: 'Oro Rosa',
      description: 'Un tema elegante con sfumature di oro rosa e accenti dorati',
      colors: {
        brand: {
          50: '#fff0f0',
          100: '#ffd6d6',
          200: '#ffbdbd',
          300: '#ffa3a3',
          400: '#ff8a8a',
          500: '#e67070',
          600: '#b35656',
          700: '#803d3d',
          800: '#4d2424',
          900: '#1a0c0c',
        },
        accent: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffec9e',
          300: '#ffe478',
          400: '#ffdd52',
          500: '#e6c639',
          600: '#b3992c',
          700: '#806d1f',
          800: '#4d4012',
          900: '#1a1606',
        }
      },
      transition: {
        duration: '0.35s',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
    {
      id: 'arctic-blue',
      name: 'Blu Artico',
      description: 'Un tema fresco e minimalista con tonalità di blu ghiaccio',
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#d6ecff',
          200: '#bde0ff',
          300: '#a3d3ff',
          400: '#8ac7ff',
          500: '#70ade6',
          600: '#5687b3',
          700: '#3d6080',
          800: '#24394d',
          900: '#0c131a',
        },
        accent: {
          50: '#f0fff9',
          100: '#d6ffed',
          200: '#bdffe2',
          300: '#a3ffd6',
          400: '#8affca',
          500: '#70e6b1',
          600: '#56b38a',
          700: '#3d8062',
          800: '#244d3b',
          900: '#0c1a14',
        }
      },
      transition: {
        duration: '0.2s',
        easing: 'ease-out',
      }
    },
    {
      id: 'high-contrast',
      name: 'Alto Contrasto',
      description: 'Un tema ad alto contrasto per una maggiore accessibilità',
      colors: {
        brand: {
          50: '#f0f0f0',
          100: '#d6d6d6',
          200: '#bdbdbd',
          300: '#a3a3a3',
          400: '#8a8a8a',
          500: '#707070',
          600: '#565656',
          700: '#3d3d3d',
          800: '#242424',
          900: '#0c0c0c',
        },
        accent: {
          50: '#fff9f0',
          100: '#ffedd6',
          200: '#ffe2bd',
          300: '#ffd6a3',
          400: '#ffcb8a',
          500: '#e6b170',
          600: '#b38a56',
          700: '#80623d',
          800: '#4d3b24',
          900: '#1a140c',
        }
      },
      transition: {
        duration: '0.1s',
        easing: 'linear',
      }
    }
  ];
  
  export default predefinedThemes;