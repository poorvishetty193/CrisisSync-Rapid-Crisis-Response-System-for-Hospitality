const fs = require('fs');

fs.mkdirSync('src', { recursive: true });
if (fs.existsSync('CrisisSync.jsx')) {
  fs.renameSync('CrisisSync.jsx', 'src/App.jsx');
}

fs.writeFileSync('package.json', JSON.stringify({
  "name": "crisis-sync",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.302.0",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.17"
  }
}, null, 2));

fs.writeFileSync('vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`);

fs.writeFileSync('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CrisisSync</title>
  </head>
  <body class="bg-[#0a0c10]">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);

fs.writeFileSync('src/main.jsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

fs.writeFileSync('src/index.css', `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer utilities {\n  .custom-scrollbar::-webkit-scrollbar {\n    width: 6px;\n  }\n  .custom-scrollbar::-webkit-scrollbar-track {\n    background: transparent;\n  }\n  .custom-scrollbar::-webkit-scrollbar-thumb {\n    background-color: #1e2330;\n    border-radius: 10px;\n  }\n}`);

fs.writeFileSync('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`);

fs.writeFileSync('postcss.config.js', `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`);

fs.writeFileSync('.gitignore', `node_modules\ndist\ndist-ssr\n*.local\n.env\n.env.*\n.DS_Store`);
