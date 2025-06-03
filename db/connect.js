const { MongoClient } = require('mongodb');

let _db;

const initDb = (callback) => {
    if (_db) {
        console.log('Db is already initialized!');
        return callback(null, _db);
    }

    const options = {
        useUnifiedTopology: true
    };

    MongoClient.connect(process.env.MONGODB_URI, options)
        .then((client) => {
            _db = client;
            console.log('Connected to MongoDB successfully');
            return callback(null, _db);
        })
        .catch((err) => {
            console.error('Failed to connect to MongoDB:', err);
            return callback(err);
        });
    return null;
};
const getDb = () => {
    if (!_db) {
        throw Error('Db not initialized');
    }
    return _db;
};

module.exports = {
    initDb,
    getDb
};
