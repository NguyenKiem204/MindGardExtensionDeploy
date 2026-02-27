import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  
  console.log('🔧 Vite config debug:');
  console.log('- mode:', mode);
  console.log('- process.cwd():', process.cwd());
  console.log('- env.VITE_PEXELS_API_KEY:', env.VITE_PEXELS_API_KEY);
  console.log('- env.VITE_PEXELS_VIDEO_IDS:', env.VITE_PEXELS_VIDEO_IDS);
  console.log('- process.env.VITE_PEXELS_API_KEY:', process.env.VITE_PEXELS_API_KEY);
  console.log('- process.env.VITE_PEXELS_VIDEO_IDS:', process.env.VITE_PEXELS_VIDEO_IDS);
  console.log('- All env keys:', Object.keys(env));

  return {
    plugins: [react()],
    define: {
      "process.env.REACT_APP_UNSPLASH_ACCESS_KEY": JSON.stringify(
        env.REACT_APP_UNSPLASH_ACCESS_KEY
      ),
      "process.env.REACT_APP_OPENWEATHER_API_KEY": JSON.stringify(
        env.REACT_APP_OPENWEATHER_API_KEY
      ),
      // Expose Vite env vars
      "import.meta.env.VITE_PEXELS_API_KEY": JSON.stringify(process.env.VITE_PEXELS_API_KEY),
      "import.meta.env.VITE_PEXELS_VIDEO_IDS": JSON.stringify(process.env.VITE_PEXELS_VIDEO_IDS),
    },
    build: {
      rollupOptions: {
        input: {
          main: "index.html",
          options: "options.html",
          minitimer: "minitimer.html",
        },
      },
    },
  };
});
