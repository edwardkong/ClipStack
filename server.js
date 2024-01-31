const express = require('express');
const app = express();
const port = 3000; // You can choose any available port

app.use(express.static('.')); // Serve static files from the current directory

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
