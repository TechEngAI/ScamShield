const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');

const port = config.PORT;

app.listen(port, () => {
  logger.info(`scamshield-api listening on port ${port} in ${config.NODE_ENV} mode`);
});
