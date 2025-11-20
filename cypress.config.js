const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'https://sock-shop-demo.herokuapp.com',
    supportFile: false,
    setupNodeEvents(on, config) {
      return config
    },
  },
})
