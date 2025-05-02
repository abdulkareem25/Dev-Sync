// frontend/tailwind.config.cjs
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  corePlugins: {
    // preflight: false, // Remove or comment out to enable Tailwind's base styles
  },
  theme: {
    extend: {},
  },
  plugins: [],
}