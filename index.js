// Creating App instance
const express = require('express');
const app = express();

// Main handler
app.get('/', function(request, response) {
    response.send('Bang Teti GET Handler');
});

app.post('/', function(request, response) {
    response.send('Bang Teti POST Handler');
});

// Start server
app.listen(
    3000, 
    () => console.log('Bang Teti is listening on port 3000!')
);