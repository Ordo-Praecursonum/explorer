import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // REST/LCD endpoint of the chain (Cosmos SDK API server, usually :1317).
  // If REST_ADDRESS is unset, derive it from the RPC address by swapping the
  // CometBFT RPC port (26657) for the LCD port (1317).
  const restTarget =
    env.REST_ADDRESS ||
    (env.RPC_ADDRESS
      ? env.RPC_ADDRESS.replace(':26657', ':1317')
      : 'http://localhost:1317')

  return {
    plugins: [
      react({
        babel: {
          plugins: ['react-dev-locator'],
        },
      }),
      tsconfigPaths(),
    ],
    define: {
      'process.env.RPC_ADDRESS': JSON.stringify(env.RPC_ADDRESS),
      'process.env.CHAIN_NAME': JSON.stringify(env.CHAIN_NAME),
      // Page code calls the relative path "/lcd/..." which is proxied below in
      // dev. Production deployments should reverse-proxy /lcd to the LCD server.
      'process.env.REST_ADDRESS': JSON.stringify(env.REST_ADDRESS || ''),
    },
    server: {
      proxy: {
        // Proxy LCD/REST calls to the chain's API server to avoid browser CORS.
        '/lcd': {
          target: restTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/lcd/, ''),
        },
      },
    },
    preview: {
      allowedHosts: ['explorer.surprotocol.org'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  }
})
