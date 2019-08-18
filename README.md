# INA3221
Current and voltage sensor INA3221 for Espruino + ESP32

# Modify board for 3 independent channels [optional]
  (see images folder)
  
# Example

```js
//setup communication bus
I2C1.setup({scl:D22,sda:D21});

//create sensor
var INA3221=require("https://github.com/devalexqt/ina3221/blob/master/ina3221.js");
var ina = new INA3221(I2C1, { 
      average:1024,
      shunt:0.1, 
      maxCurrent: 10,
    });
    
//Read data from sensor
  var data={
    ch1:ina.read(1),//channel 1
    ch2:ina.read(2), // channel 2
    ch3:ina.read(3), //chanel 3
  }; 
  console.log("==>ina:",data);    

//output
==>ina3221: {
  "ch1": { "vshunt": 0, "vbus": 0, "power": 0, "current": 0 },
  "ch2": { "vshunt": 0, "vbus": 0, "power": 0, "current": 0 },
  "ch3": { "vshunt": 0, "vbus": 0, "power": 0, "current": 0 }
 }  
```
