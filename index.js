// Creating App instance
const express = require('express');
const app = express();
app.set('port', (process.env.PORT || 5000));

// Main handler
app.get('/', function(request, response) {
    response.send('Bang Teti GET Handler');
});

app.post('/', function(request, response) {
    response.send('Bang Teti POST Handler');
});

// Start server
app.listen(app.get('port'), function() {
  console.log('Bang Teti is listening on port', app.get('port'));
});
