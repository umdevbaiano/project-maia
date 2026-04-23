/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Tipografia Serifada para Elegância (Autoridade/Clássica)
        serif: ['Playfair Display', 'Merriweather', 'serif'],
        // Tipografia Sans Geométrica para UI e Data/Legibilidade
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      colors: {
        themis: {
          bg: '#050B14',          // Fundo Azul Marinho Profundo (Quase infinito)
          surface: '#0F1A2A',     // Cards Cinza Grafite Frio
          elevated: '#17253D',    // Modais e Hover Cards
          gold: '#D4AF37',        // Dourado Metálico clássico jurídico
          snow: '#FAFAFD',        // Branco neve para contraste alto
          muted: '#8A9DB0',       // Textos secundários (Não chama atenção, mas não some)
          border: '#1E3048',      // Separadores sutis
          danger: '#E11D48',      // Vermelho Sóbrio (Rose)
          success: '#10B981',     // Emerald Green
        }
      },
      boxShadow: {
        'soft': '0 4px 40px -2px rgba(0, 0, 0, 0.25)', // Sombra espalhada Themis
        'glow': '0 0 15px rgba(212, 175, 55, 0.4)',    // Dourado suave para estados de foco
      }
    },
  },
  plugins: [],
}
