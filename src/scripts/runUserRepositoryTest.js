// src/scripts/runUserRepositoryTest.js run: node src/scripts/runUserRepositoryTest.js
const { execSync } = require('child_process');

try {
  console.log('Esecuzione test UserRepository...');
  const output = execSync(
    'npx jest --config=jest.config.js src/systemTests/unit/repositories/UserRepository.test.js --no-cache --detectOpenHandles',
    { encoding: 'utf8', stdio: 'inherit' }
  );
  console.log('Test completato con successo!');
} catch (error) {
  console.error('Errore durante l\'esecuzione del test:', error.message);
}