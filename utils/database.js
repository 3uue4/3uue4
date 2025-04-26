const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        // Remove duplicate w option from connection string if present
        const connectionString = process.env.MONGODB_URI.replace(/[?&]w=[^&]+/g, '');
        
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to MongoDB successfully');
        
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
            connectToDatabase();
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        // Retry connection after 5 seconds
        setTimeout(connectToDatabase, 5000);
    }
}

module.exports = connectToDatabase; 