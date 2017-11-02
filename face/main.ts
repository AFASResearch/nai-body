let lastTemperature = 0
let voltage = 0
let temperature = 0
let command = ""

input.onButtonPressed(Button.A, () => {
  serial.writeValue("temperature", temperature)
  basic.showNumber(temperature)
  basic.showIcon(IconNames.Asleep)
})

serial.onDataReceived(serial.delimiters(Delimiters.Comma), () => {
  command = serial.readUntil(serial.delimiters(Delimiters.Comma))
  if (command == "smile") {
    basic.showIcon(IconNames.Happy)
  } else if (command == "sad") {
    basic.showIcon(IconNames.Sad)
  } else if (command == "asleep") {
    basic.showIcon(IconNames.Asleep)
  } else if (command == "surprised") {
    basic.showIcon(IconNames.Surprised)
  } else if (command == "love") {
    basic.showIcon(IconNames.Heart)
  } else {
    basic.showString(command)
  }
})

led.setBrightness(100)
basic.showIcon(IconNames.Asleep)
while (true) {
  voltage = pins.map(
    pins.analogReadPin(AnalogPin.P2),
    0,
    1023,
    0,
    3300
  )
  temperature = (voltage - 500) / 1
  if (lastTemperature != temperature) {
    lastTemperature = temperature
    serial.writeValue("temperature", temperature)
  }
  control.waitMicros(100000)
}
