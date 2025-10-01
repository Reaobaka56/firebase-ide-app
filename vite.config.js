import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // 🔑 THE CRITICAL FIX: Set the base path to relative ('./')
    // so assets are correctly linked in the built index.html.
    base: './',
})