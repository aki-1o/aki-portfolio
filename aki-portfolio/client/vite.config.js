import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is the sub-path on GitHub Pages, e.g. "/aki-portfolio/".
// Leave it unset for a user site (username.github.io) or a custom domain.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
