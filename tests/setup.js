process.env = {
    ...process.env,
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb+srv://RaikaSama:H9Fm51BisUke4rPK@cluster0.4nf56.mongodb.net/brainscanner_test',
    JWT_SECRET: 'test-secret',
    LOG_LEVEL: 'error',
    PORT: '5000',
    HOST: 'localhost'
};

// Mock per evitare process.exit nei test
jest.spyOn(process, 'exit').mockImplementation(() => {});