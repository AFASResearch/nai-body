let lastTemperature = 0;
let voltage = 0;
let temperature = 0;
let command = "";

input.onButtonPressed(Button.A, () => {
  serial.writeValue("temperature", temperature);
  basic.showNumber(temperature);
  basic.showIcon(IconNames.Asleep);
});

serial.onDataReceived(serial.delimiters(Delimiters.Comma), () => {
  command = serial.readUntil(serial.delimiters(Delimiters.Comma));
  if (command == "smile") {
    basic.showIcon(IconNames.Happy, 0);
  } else if (command == "sad") {
    basic.showIcon(IconNames.Sad, 0);
  } else if (command == "asleep") {
    basic.showIcon(IconNames.Asleep, 0);
  } else if (command == "surprised") {
    basic.showIcon(IconNames.Surprised, 0);
  } else if (command == "love") {
    basic.showIcon(IconNames.Heart, 0);
  } else if (command == "away") {
    basic.showIcon(IconNames.No, 0);
  } else if (command == "think") {
    basic.showLeds(`
            . # . # .
            . . . . .
            . . . . .
            . # # # .
            . . . . .
            `, 0)
  } else if (command == "speak") {
    basic.showLeds(`
            . # . # .
            . . . . .
            . # # # .
            # . . . #
            . # # # .
            `, 0)
  } else {
    basic.showString(command);
  }
});

led.setBrightness(100);
basic.showIcon(IconNames.No);
while (true) {
  voltage = pins.map(
    pins.analogReadPin(AnalogPin.P2),
    0,
    1023,
    0,
    3300
  );
  temperature = (voltage - 500) / 1;
  if (lastTemperature != temperature) {
    lastTemperature = temperature;
    serial.writeValue("temperature", temperature)
  }
  control.waitMicros(100000);
}
