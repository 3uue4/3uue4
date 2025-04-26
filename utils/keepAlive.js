const express = require('express');
const server = express();
const fetch = require('node-fetch');

server.all('/', (req, res) => {
    res.send('Bot is running!');
});

function keepAlive() {
    server.listen(process.env.PORT || 3000, () => {
        console.log('Server is ready.');
    });

    // Ping the server every 5 minutes
    setInterval(async () => {
        try {
            await fetch(`http://localhost:${process.env.PORT || 3000}`);
            console.log('Pinged server to keep it alive');
        } catch (error) {
            console.error('Error pinging server:', error);
        }
    }, 5 * 60 * 1000);
}

module.exports = keepAlive; 