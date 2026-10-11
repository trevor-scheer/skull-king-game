const { createServer } = require('node:http');
const { createApplication } = require('../skull-king-server/dist/index.js');

void createApplication().then(({ app, stop }) => {
  const server = createServer(app);
  server.listen(Number(process.env.PORT || 0), '127.0.0.1', () => {
    console.log(`E2E_URL=http://127.0.0.1:${server.address().port}`);
  });
  process.once('SIGTERM', () => {
    void stop().then(() => {
      server.closeAllConnections();
      server.close(() => process.exit(0));
    });
  });
}).catch(error => { console.error(error); process.exit(1); });
