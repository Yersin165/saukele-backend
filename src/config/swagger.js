const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

const file = fs.readFileSync(path.join(__dirname, '../../openapi.yaml'), 'utf8');
const swaggerDocument = YAML.parse(file);

module.exports = { swaggerUi, swaggerDocument };