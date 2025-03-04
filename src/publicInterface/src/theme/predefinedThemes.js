/**
 * Temi predefiniti per l'applicazione
 */
export const predefinedThemes = [
  // TEMI A TINTA UNITA
  {
    id: 'default-blue',
    name: 'BrainScanner Blu',
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
    id: 'forest-green',
    name: 'Verde Foresta',
    description: 'Tema verde rilassante ispirato alla natura',
    colors: {
      brand: {
        50: '#e6ffec',
        100: '#b3ffce',
        200: '#80ffb0',
        300: '#4dff92',
        400: '#1aff74',
        500: '#00e65c',
        600: '#00b349',
        700: '#008035',
        800: '#004d20',
        900: '#001a0b',
      },
      accent: {
        50: '#ffebf5',
        100: '#ffb3df',
        200: '#ff80ca',
        300: '#ff4db4',
        400: '#ff1a9f',
        500: '#e60089',
        600: '#b3006c',
        700: '#80004d',
        800: '#4d002e',
        900: '#1a000f',
      }
    },
    transition: {
      duration: '0.25s',
      easing: 'ease-out',
    }
  },
  {
    id: 'royal-purple',
    name: 'Viola Reale',
    description: 'Tema elegante con tonalità viola',
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
    id: 'coral-red',
    name: 'Rosso Corallo',
    description: 'Tema vivace con tonalità di rosso corallo',
    colors: {
      brand: {
        50: '#ffebeb',
        100: '#ffbfbf',
        200: '#ff9494',
        300: '#ff6868',
        400: '#ff3d3d',
        500: '#ff1111',
        600: '#d10000',
        700: '#9e0000',
        800: '#6b0000',
        900: '#380000',
      },
      accent: {
        50: '#e6f9ff',
        100: '#b3eeff',
        200: '#80e3ff',
        300: '#4dd8ff',
        400: '#1acdff',
        500: '#00b8e6',
        600: '#008eb3',
        700: '#006480',
        800: '#003a4d',
        900: '#00111a',
      }
    },
    transition: {
      duration: '0.2s',
      easing: 'ease-in-out',
    }
  },
  {
    id: 'warm-orange',
    name: 'Arancio Caldo',
    description: 'Tema energico con tonalità arancioni',
    colors: {
      brand: {
        50: '#fff2e6',
        100: '#ffd9b3',
        200: '#ffbf80',
        300: '#ffa64d',
        400: '#ff8c1a',
        500: '#e67300',
        600: '#b35900',
        700: '#804000',
        800: '#4d2600',
        900: '#1a0d00',
      },
      accent: {
        50: '#e6f2ff',
        100: '#b3d9ff',
        200: '#80bfff',
        300: '#4da6ff',
        400: '#1a8cff',
        500: '#0073e6',
        600: '#005ab3',
        700: '#004080',
        800: '#00264d',
        900: '#000d1a',
      }
    },
    transition: {
      duration: '0.23s',
      easing: 'ease',
    }
  },
  {
    id: 'teal-calm',
    name: 'Turchese Calmo',
    description: 'Tema rilassante con tonalità turchesi',
    colors: {
      brand: {
        50: '#e6fffd',
        100: '#b3fffa',
        200: '#80fff6',
        300: '#4dfff3',
        400: '#1affef',
        500: '#00e6d6',
        600: '#00b3a7',
        700: '#008077',
        800: '#004d48',
        900: '#001a18',
      },
      accent: {
        50: '#fff0e6',
        100: '#ffd4b3',
        200: '#ffb980',
        300: '#ff9d4d',
        400: '#ff821a',
        500: '#e66900',
        600: '#b35200',
        700: '#803a00',
        800: '#4d2300',
        900: '#1a0c00',
      }
    },
    transition: {
      duration: '0.3s',
      easing: 'ease-in-out',
    }
  },
  
  // TEMI CON GRADIENTI
  {
    id: 'emerald-gradient',
    name: 'Smeraldo Sfumato',
    description: 'Un tema elegante con gradienti di verde smeraldo',
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
    },
    layout: {
      type: 'gradient',
      gradient: {
        sidebar: {
          direction: '135deg',
          colors: ['#e6fff7', '#80ffd4', '#e6fff7']
        },
        topMenu: {
          direction: '90deg',
          colors: ['#b3ffe6', '#4dffc2']
        },
        footer: {
          direction: '90deg',
          colors: ['#e6fff7', '#b3ffe6']
        },
        background: {
          direction: '135deg',
          colors: ['#e6fff7', '#b3ffe6']
        },
        text: {
          direction: '45deg',
          colors: ['#00e699', '#008055']
        }
      }
    },
    animations: {
      glow: {
        enabled: true,
        intensity: 0.1,
        duration: '3s'
      },
      shine: {
        enabled: true,
        duration: '2s'
      }
    }
  },
  {
    id: 'sunset-gradient',
    name: 'Tramonto Dinamico',
    description: 'Un tema caldo con gradienti ispirati al tramonto',
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
    },
    layout: {
      type: 'gradient',
      gradient: {
        sidebar: {
          direction: '135deg',
          colors: ['#fff0e6', '#ffd9b3', '#fff0e6']
        },
        topMenu: {
          direction: '90deg',
          colors: ['#ffd9b3', '#ffaa4d']
        },
        footer: {
          direction: '90deg',
          colors: ['#fff0e6', '#ffd9b3']
        },
        background: {
          direction: '135deg',
          colors: ['#fff0e6', '#ffd9b3']
        },
        text: {
          direction: '45deg',
          colors: ['#ff921a', '#e67700']
        }
      }
    },
    animations: {
      glow: {
        enabled: true,
        intensity: 0.15,
        duration: '4s'
      },
      pulse: {
        enabled: true,
        intensity: 0.02,
        duration: '3s'
      }
    }
  },
  {
    id: 'neon-cyber',
    name: 'Cyber Neon',
    description: 'Un tema futuristico con effetti neon luminosi',
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
    },
    layout: {
      type: 'gradient',
      gradient: {
        sidebar: {
          direction: '135deg',
          colors: ['#e6fff9', '#b3ffee', '#e6fff9']
        },
        topMenu: {
          direction: '90deg',
          colors: ['#b3ffee', '#4dffd8']
        },
        footer: {
          direction: '90deg',
          colors: ['#e6fff9', '#b3ffee']
        },
        background: {
          direction: '135deg',
          colors: ['#f2f2f2', '#e6fff9']
        },
        text: {
          direction: '45deg',
          colors: ['#1affcd', '#00e6b5']
        }
      }
    },
    animations: {
      glow: {
        enabled: true,
        intensity: 0.3,
        duration: '2s'
      },
      shine: {
        enabled: true,
        duration: '1.5s'
      }
    }
  },
  {
    id: 'purple-dream',
    name: 'Sogno Viola',
    description: 'Un tema elegante con gradienti viola e rosa',
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
        50: '#ffe6f5',
        100: '#ffb3e0',
        200: '#ff80cc',
        300: '#ff4db8',
        400: '#ff1aa4',
        500: '#e6008f',
        600: '#b3006f',
        700: '#80004f',
        800: '#4d002f',
        900: '#1a0010',
      }
    },
    transition: {
      duration: '0.22s',
      easing: 'ease',
    },
    layout: {
      type: 'gradient',
      gradient: {
        sidebar: {
          direction: '135deg',
          colors: ['#f5e6ff', '#dfb3ff', '#f5e6ff']
        },
        topMenu: {
          direction: '90deg',
          colors: ['#dfb3ff', '#b34dff']
        },
        footer: {
          direction: '90deg',
          colors: ['#f5e6ff', '#dfb3ff']
        },
        background: {
          direction: '135deg',
          colors: ['#f5e6ff', '#dfb3ff']
        },
        text: {
          direction: '45deg',
          colors: ['#9d1aff', '#8400e6']
        }
      }
    },
    animations: {
      glow: {
        enabled: true,
        intensity: 0.2,
        duration: '3s'
      }
    }
  },
  {
    id: 'ocean-waves',
    name: 'Onde Marine',
    description: 'Un tema rilassante ispirato alle onde dell\'oceano',
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
        50: '#e6fffa',
        100: '#b3ffee',
        200: '#80ffe3',
        300: '#4dffd8',
        400: '#1affcd',
        500: '#00e6b5',
        600: '#00b38e',
        700: '#008067',
        800: '#004d3d',
        900: '#001a14',
      }
    },
    transition: {
      duration: '0.4s',
      easing: 'ease-in-out',
    },
    layout: {
      type: 'gradient',
      gradient: {
        sidebar: {
          direction: '135deg',
          colors: ['#e6f7ff', '#b3e0ff', '#e6f7ff']
        },
        topMenu: {
          direction: '90deg',
          colors: ['#b3e0ff', '#4db5ff']
        },
        footer: {
          direction: '90deg',
          colors: ['#e6f7ff', '#b3e0ff']
        },
        background: {
          direction: '135deg',
          colors: ['#e6f7ff', '#b3e0ff']
        },
        text: {
          direction: '45deg',
          colors: ['#1a9fff', '#0088cc']
        }
      }
    },
    animations: {
      glow: {
        enabled: false
      },
      shine: {
        enabled: true,
        duration: '4s'
      },
      pulse: {
        enabled: true,
        intensity: 0.01,
        duration: '5s'
      }
    }
  },
  {
    id: 'fire-gradient',
    name: 'Fuoco Ardente',
    description: 'Un tema energetico con gradienti ispirati al fuoco',
    colors: {
      brand: {
        50: '#fff0e6',
        100: '#ffd4b3',
        200: '#ffb980',
        300: '#ff9d4d',
        400: '#ff821a',
        500: '#e66900',
        600: '#b35200',
        700: '#803a00',
        800: '#4d2300',
        900: '#1a0c00',
      },
      accent: {
        50: '#ffebeb',
        100: '#ffbfbf',
        200: '#ff9494',
        300: '#ff6868',
        400: '#ff3d3d',
        500: '#ff1111',
        600: '#d10000',
        700: '#9e0000',
        800: '#6b0000',
        900: '#380000',
      }
    },
    transition: {
      duration: '0.2s',
      easing: 'ease-in-out',
    },
    layout: {
      type: 'gradient',
      gradient: {
        sidebar: {
          direction: '135deg',
          colors: ['#fff0e6', '#ffd4b3', '#fff0e6']
        },
        topMenu: {
          direction: '90deg',
          colors: ['#ffd4b3', '#ff9d4d']
        },
        footer: {
          direction: '90deg',
          colors: ['#fff0e6', '#ffd4b3']
        },
        background: {
          direction: '135deg',
          colors: ['#fff0e6', '#ffd4b3']
        },
        text: {
          direction: '45deg',
          colors: ['#ff821a', '#e66900']
        }
      }
    },
    animations: {
      glow: {
        enabled: true,
        intensity: 0.25,
        duration: '2s'
      },
      shine: {
        enabled: false
      },
      pulse: {
        enabled: false
      }
    }
  }
];

export default predefinedThemes;