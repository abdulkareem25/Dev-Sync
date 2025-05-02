// frontend/postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-import': {
      filter: (path) => !path.includes('node_modules/tailwindcss')
    },
    tailwindcss: {},
    autoprefixer: {},
  }
}