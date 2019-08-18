//http://www.ti.com/lit/ds/symlink/ina3221.pdf

//// Current and voltage sensor INA3221
function INA3221(i2c, options) {
 var INA3221_REG_CONFIG   = 0x00;

/** @constant
 *  @type {number}
 *  @default 0x8000
 */

var INA3221_CONFIG_RESET = 0x8000;

/** @constant
 *  @type {number}
 *  @default 0x4000
 */

var INA3221_CONFIG_ENABLE_CHAN1 = 0x4000;

/** @constant
 *  @type {number}
 *  @default 0x2000
 */

var INA3221_CONFIG_ENABLE_CHAN2 = 0x2000;

/** @constant
 *  @type {number}
 *  @default 0x1000
 */

var INA3221_CONFIG_ENABLE_CHAN3 = 0x1000;

/** @constant
 *  @type {number}
 *  @default 0x0800
 */

var INA3221_CONFIG_AVG2 = 0x0800;

/** @constant
 *  @type {number}
 *  @default 0x0400
 */

var INA3221_CONFIG_AVG1 = 0x0400;

/** @constant
 *  @type {number}
 *  @default 0x0200
 */

var INA3221_CONFIG_AVG0 = 0x0200;

/** @constant
 *  @type {number}
 *  @default 0x0100
 */

var INA3221_CONFIG_VBUS_CT2 = 0x0100;

/** @constant
 *  @type {number}
 *  @default 0x0080
 */

var INA3221_CONFIG_VBUS_CT1 = 0x0080;

/** @constant
 *  @type {number}
 *  @default 0x0040
 */
var INA3221_CONFIG_VBUS_CT0 = 0x0040;

/** @constant
 *  @type {number}
 *  @default 0x0020
 */

var INA3221_CONFIG_VSH_CT2 = 0x0020;

/** @constant
 *  @type {number}
 *  @default 0x0010
 */

var INA3221_CONFIG_VSH_CT1 = 0x0010;

/** @constant
 *  @type {number}
 *  @default 0x0008
 */

var INA3221_CONFIG_VSH_CT0 = 0x0008;

/** @constant
 *  @type {number}
 *  @default 0x0004
 */

var INA3221_CONFIG_MODE_2 = 0x0004;

/** @constant
 *  @type {number}
 *  @default 0x0002
 */

var INA3221_CONFIG_MODE_1 = 0x0002;

/** @constant
 *  @type {number}
 *  @default 0x0001
 */

var INA3221_CONFIG_MODE_0 = 0x0001;

/** @constant
 *  @type {number}
 *  @default 0x01
 */
  this.i2c = i2c;
  options = options||{};
  this.addr = options.addr||0x40; // default address if A0/A1 are GND
  this.maxCurrent = options.maxCurrent||10;
  this.currentLSB = this.maxCurrent/32768;
  this.shunt = options.shunt||0.1;
  if (this.rd(0xFE)!=0x5449) throw new Error("Invalid manufacturer ID");
  // config reg
  var config; //= 0x4127; // power on defaults
  
  //add
  config=INA3221_CONFIG_ENABLE_CHAN1 |
              INA3221_CONFIG_ENABLE_CHAN2 |
              INA3221_CONFIG_ENABLE_CHAN3 |
              INA3221_CONFIG_AVG1 |
              INA3221_CONFIG_VBUS_CT2 |
              INA3221_CONFIG_VSH_CT2 |
              INA3221_CONFIG_MODE_2 |
              INA3221_CONFIG_MODE_1 |
              INA3221_CONFIG_MODE_0;
  
  options.average = options.average||256;
  if (options.average) {
    var i = [1,4,16,64,128,256,512,1024].indexOf(options.average);
    if (i<0) throw new Error("average must be 1,4,16,64,128,256,512 or 1024");
    //config |= i<<9;
  }
    console.log("====>config:",config);
  this.wr(0x00, config);
  // calibration reg
  var cal = Math.round(0.00512 / (this.currentLSB * this.shunt));
  if (cal<0 || cal>32767) throw new Error("maxCurrent/shunt mean calibration is out of range");
  this.wr(0x05, cal);
  // alert register - pull down when data is ready
  this.wr(0x06,1<<10);
}

// read reg
INA3221.prototype.rd = function(a) {
  this.i2c.writeTo(this.addr,a);
  var d = this.i2c.readFrom(this.addr,2);
  return d[1]|d[0]<<8;
};
// write reg
INA3221.prototype.wr = function(a,d) {
  this.i2c.writeTo(this.addr,[a,d>>8,d&0xff]);
};
// read reg signed
INA3221.prototype.rds = function(a) {
  var r = this.rd(a);
  return (r&32768)?r-65536:r;
};
/* Returns an object with:
* vshunt - voltgage across shunt - -0.082 to 0.082mV
* vbus - bus voltage - 0 to 41v
* power - calculated power in watts
* current - calculated current in amps
* overflow - was there an arithmetic overflow during the averaging?
*/
INA3221.prototype.read = function(channel) {  
  // reading the mask register clears the conversion ready
  var flags = this.rd(0x06); 
  var voltage=this.readShuntVoltage_V(channel);
  var voltage_shunt=this.readShuntVoltage_mV(channel);
  var current=voltage_shunt/0.1/1000;
  return {
    vshunt : voltage_shunt,//this.rds(0x01)*0.000025, // volts
    vbus : voltage,//this.rd(0x02+(channel -1) *2)*0.00125,//this.rd(0x02)*0.00125, // volts
    power : voltage*current, // watts
    current :current,//this.rds(0x04+(channel -1) *2)*this.currentLSB, // amps
    //overflow : (flags&4)!=0
  };
};//INA3221
INA3221.prototype.readShuntVoltage_mV=function(channel){
  //console.log("readShuntVoltage_mV....");
  var raw=this.rd(0x01+(channel -1) *2);
    //console.log("readShuntVoltage_mV raw:",raw);
  if (raw > 32767) raw -= 65536;
    //console.log("readShuntVoltage_mV changed raw:",raw);
  return raw * 0.005;
};
INA3221.prototype.readShuntVoltage_V=function(channel){
  //console.log("readShuntVoltage....");
  var raw=this.rd(0x02+(channel -1) *2);
    //console.log("readShuntVoltage V raw:",raw);
  if (raw > 32767) raw -= 65536;
    //console.log("readShuntVoltage changed raw:",raw);
  return raw * 0.001;
};
module.exports=INA3221




