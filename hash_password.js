const bcrypt = require('bcryptjs');

const generateHash = async () => {
    const password = "123456789"; // La password che vuoi hashare
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        console.log('La tua password hashata è:');
        console.log(hash);
    } catch (err) {
        console.error('Errore:', err);
    }
}

generateHash();

// per test_admin: $2a$10$BtD682olptvqjvJyqrSa9eLj6EssB3nMo5S.e8vNBOmwvbVAlqpZG