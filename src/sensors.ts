let mcpadc: any;

try {
  mcpadc = require('mcp-spi-adc');
} catch(e) {
  console.warn('package mcp-spi-adc is not installed, no gpio?')
}

export let sensors = {

};
