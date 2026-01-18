module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'skills/*/templates/scripts/**/*.js',
    'src/**/*.js',
    '!**/*.test.js',
    '!src/__tests__/**',
  ],
  testMatch: ['**/src/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
