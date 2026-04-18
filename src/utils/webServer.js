const express = require('express');

function startWebServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/', (req, res) => {
    res.send('🤖 Statistic Bot đang hoạt động!');
  });

  app.get('/ping', (req, res) => {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      message: '✅ Bot Statistic đang hoạt động!'
    });
  });

  app.listen(PORT, () => {
    console.log(`🌐 Web server đang chạy trên port ${PORT}`);
  });
}

module.exports = startWebServer;
