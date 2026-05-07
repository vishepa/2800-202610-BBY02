import 'dotenv/config'
import express from 'express'
import foodAssets from './routes/foodAssets.js'
import disseminationAreaBoundaries from './routes/disseminationAreaBoundaries.js'
import isochrones from './routes/isochrones.js'

const app = express();
app.use(express.json());


app.use('/api/food-assets', foodAssets);
app.use('/api/da-boundaries', disseminationAreaBoundaries);
app.use('/api/isochrones', isochrones);
// app.use('/api/vulnerability-scores', vulnerabilityScores);
// app.use('/api/transit-stops', transitStops);
// app.use('/api/simulation', simulation);

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
