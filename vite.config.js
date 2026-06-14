import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'groq-refactor-proxy',
        configureServer(server) {
          attachGroqProxy(server.middlewares, env.GROQ_API_KEY)
        },
        configurePreviewServer(server) {
          attachGroqProxy(server.middlewares, env.GROQ_API_KEY)
        },
      },
    ],
  }
})

function attachGroqProxy(middlewares, key) {
  middlewares.use('/api/groq', async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }

    if (!key) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: { message: 'GROQ_API_KEY is not set in .env.local' },
        }),
      )
      return
    }

    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString()
        const upstream = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`,
            },
            body,
          },
        )

        const text = await upstream.text()
        res.statusCode = upstream.status
        res.setHeader('Content-Type', 'application/json')
        res.end(text)
      } catch (err) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: { message: err.message } }))
      }
    })
  })
}
