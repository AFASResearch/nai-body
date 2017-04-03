let mcpadc: any;

try {
  mcpadc = require('mcp-spi-adc');
} catch(e) {
  console.warn('package mcp-spi-adc is not installed, no gpio?')
}

export let sensors = {
  onTemperatureChange: (callback: (temp: number) => void) => {
    let lastTemperature = -2;
    if (mcpadc) {
      var tempSensor = mcpadc.open(5, {speedHz: 20000}, function (err: Object) {
        console.log('Temperature sensor open');
        if (err) {
          console.error('error opening temperature sensor', err);
          return;
        }

        setInterval(function () {
          tempSensor.read(function (err: Object, reading: any) {
            if (err) {
              console.log('Error reading temperature', err);
            }
            let newTemperature = (reading.value * 3.3 - 0.5) * 10;
            newTemperature = Math.round(newTemperature) * 10;
            if (newTemperature !== lastTemperature) {
              lastTemperature = newTemperature;
              console.log('New temperature', newTemperature);
              callback(newTemperature);
            }
          });
        }, 1000);
      });
    }
  }
};
