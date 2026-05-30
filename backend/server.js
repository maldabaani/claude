const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const requireAuth = require('./middleware/auth');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', requireAuth, require('./routes/posts'));
app.use('/api/upload', requireAuth, require('./routes/upload'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
