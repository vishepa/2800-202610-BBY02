require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
