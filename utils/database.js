const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        const connectionString = process.env.MONGODB_URI;
        
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        
        console.log('✅ Connected to MongoDB successfully');
        
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
            setTimeout(connectToDatabase, 5000);
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        // Retry connection after 5 seconds
        setTimeout(connectToDatabase, 5000);
    }
}

module.exports = connectToDatabase; 