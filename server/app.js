import 'dotenv/config'
import express from 'express'
import foodAssets from './routes/foodAssets.js'
import disseminationAreaBoundaries from './routes/disseminationAreaBoundaries.js'
import isochrones from './routes/isochrones.js'
import disseminationAreaStatistics from './routes/disseminationAreaStatistics.js'
import transitStops from './routes/transitStops.js'
import aiSummary from './routes/aiSummary.js'

import disseminationArea from './routes/disseminationArea.js'


const app = express();
app.use(express.json());


app.use('/api/food-assets', foodAssets);
app.use('/api/da-boundaries', disseminationAreaBoundaries);
app.use('/api/isochrones', isochrones);
app.use('/api/da-statistics', disseminationAreaStatistics);
app.use('/api/transit-stops', transitStops);
app.use('/api/ai/da-summary', aiSummary);
app.use('/api/dissemination-areas', disseminationArea);

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
