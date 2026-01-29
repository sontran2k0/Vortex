import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  
  const env = loadEnv(mode, '.', '')

  return {
    server: {
      port: 3000,
      host: '0.0.0.0'
    },
    
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react', 'react-dom'],
        icons: ['lucide-react']
      }
    }
  }
},
workbox: {
 runtimeCaching: [
  {
   urlPattern: /api/,
   handler: 'NetworkFirst',
   options: {
     cacheName: 'api-cache',
     expiration: { maxEntries: 50 }
   }
  }
 ]
},

    plugins: [
      react(),

      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico'],
        manifest: {
          name: 'Vortex Cards',
          short_name: 'Vortex Cards',
          description: 'Vortex Cards',
          theme_color: '#0f124088',
          background_color: '#09082eac',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/logo-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/logo-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    }
    
  }
})

function tailwind(): import("vite").PluginOption {
  throw new Error('Function not implemented.')
}

