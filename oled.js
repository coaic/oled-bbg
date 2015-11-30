var 
    // wiringpi = require("wiringpi"),
    // wiringPiSetup = wiringpi.wiringPiSetup,
    // delay = wiringpi.delay,
    // shiftOut = wiringpi.shiftOut,
    // pinMode = wiringpi.pinMode,
    // digitalWrite = wiringpi.digitalWrite,
    
    b = require("bonescript"),
    i2c = require("i2c"),
    OledAddress = 0x2x,
    wire = new i2c(address, {device: '/dev/i2c-1'}),
    // OUTPUT = wiringpi.OUTPUT,
    // HIGH = wiringpi.HIGH,
    // LOW = wiringpi.LOW,
    // MSBFIRST = wiringpi.MSBFIRST,

    canvas = require("./canvas"),
    Canvas = canvas.Canvas,
    WRITE = canvas.WRITE,
    BLACK = canvas.BLACK,

    SETCOMMANDLOCK = 0xFD,
    RESETPROTECTION = 0x12,
    DISPLAYOFF = 0xAE,
    SETDISPLAYCLOCKDIV = 0xD5,
    SETMULTIPLEX = 0xA8,
    NINETYSIX = 0x5F,
    SETDISPLAYOFFSET = 0xA3,
    SETSTARTLINE = 0xA1,
    SETVDDINTERNAL = 0xAB,
    SETREMAP = 0xA0,
    SETPHASELENGTH = 0xB1,
    SETLINEARLUT = 0xB9,
    SETPRECHARGEVOLTAGE = 0xBC,
    VCOMH = 0x08,
    SETVCOMH = 0xBE,
    POINT86VCC = 0x07,
    SETSECONDPRECHARGE = 0xB6,
    CHARGEPUMP = 0x8D,
    MEMORYMODE = 0x20,
    SEGREMAP = 0xA0,
    COMSCANDEC = 0xC8,
    SETCOMPINS = 0xDA,
    SETCONTRAST = 0x81,
    SETPRECHARGE = 0xD9,
    SETVCOMDETECT = 0xDB,
    SETDISPLAYCLOCKDIVIDERATIO = 0xB3,
    DISPLAYALLON_RESUME = 0xA4,
    NORMALDISPLAY = 0xA6,
    DISPLAYON = 0xAF,
    SETLOWCOLUMN = 0x00,
    SETHIGHCOLUMN = 0x10,
    // SETSTARTLINE = 0x40
    ;
    
function sendCommand(cmd, data) {
    if (arguments.length == 2) {
        wire.writeBytes(cmd, data, function(err) {
            console.log("I2C Error sending command: " + cmd + ", data: " + data + ", error: " + err);
        });
    } else if (arguments.length == 1) {
        wire.writeBytes(cmd, null, function(err) {
            console.log("I2C Error sending command: " + cmd + ", error: " + err);
        });
    } else {
        console.log("I2C too many argumnents to sendCommand");
    }
}

function oledInit() {
    sendCommand(SETCOMMANDLOCK);                        // Unlock OLED driver IC MCU interface from entering command. i.e: Accept commands
    sendCommand(RESETPROTECTION);
    sendCommand(DISPLAYOFF);                            // Set display off
    sendCommand(SETMULTIPLEX, [NINTEYSIX]);             // set multiplex ratio
    sendCommand(SETSTARTLINE, [0x00]);                  // set display start line
    sendCommand(SETDISPLAYOFFSET, [0x60]);              // set display offset
    sendCommand(SETREMAP, [0x46]);                      // set remap
    sendCommand(SETVDDINTERNAL, [0x01]);                // set vdd internal
    sendCommand(SETCONTRAST, [0x53]);                   // set contrast
    sendCommand(SETPHASELENGTH, [0x51]);                // set phase length
    sendCommand(SETDISPLAYCLOCKDIVIDERATIO, [0x01]);    // set display clock divide ratio/oscillator frequency
    sendCommand(SETLINEARLUT);                          // set linear gray scale
    sendCommand(SETPRECHARGEVOLTAGE, [VCOMH]);          // set pre charge voltage to VCOMH
    sendCommand(SETVCOMH, [POINT86VCC]);                // set VCOMh .86 x Vcc
    sendCommand(SETSECONDPRECHARGE, [0x01]);            // set second pre charge period

    sendCommand(0xD5); // enable second precharge and enternal vsl
    sendCommand(0X62); // (0x62);
    sendCommand(0xA4); // Set Normal Display Mode
    sendCommand(0x2E); // Deactivate Scroll
    sendCommand(0xAF); // Switch on display

    
}

function OLED(pins, screen) {

    this.clk = pins.clk;
    this.dat = pins.dat;
    this.rst = pins.rst;
    this.dc = pins.dc;
    this.cs = pins.cs;

    b.pinMode(this.clk, b.OUTPUT);
    b.pinMode(this.dat, b.OUTPUT);
    b.pinMode(this.rst, b.OUTPUT);
    b.pinMode(this.dc, b.OUTPUT);
    b.pinMode(this.cs, b.OUTPUT);

    this.super(screen.width, screen.height);
    this.delay = 1000 / (screen.fps || 20);

    if (screen.canvas instanceof Buffer) {
        this.canvas = screen.canvas;
    } else if (screen.canvas instanceof Array) {
        this.canvas = new Buffer(screen.canvas);
    } else {
        this.canvas = new Buffer((this.width * this.height / 8) | 0);
        this.canvas.fill(screen.canvas ? 0xff : 0x00);
    }

    this.intervalId = 0;
    this.running = false;
    this.init();
    if (screen.fps) {
        this.start();
    }
}

function reset() {
    b.digitalWrite(this.rst, b.HIGH);
    delay(1);
    b.digitalWrite(this.rst, b.LOW);
    delay(10);
    b.digitalWrite(this.rst, b.HIGH);
    console.log("reset");
}

function write(dc, data) {
    var count = arguments.length,
        i;
    b.digitalWrite(this.cs, b.HIGH);
    b.digitalWrite(this.dc, dc ? b.LOW : b.HIGH);
    b.digitalWrite(this.cs, b.LOW);
    for (i = 1; i < count; i++) {
        b.shiftOut(this.dat, this.clk, MSBFIRST, arguments[i]);
    }
    b.digitalWrite(this.cs, HIGH);
}

function command(cmd) {
    this.write(true, cmd);
}

function data(data) {
    this.write(false, data);
}

function off(){
    var running = this.running;
    this.command(DISPLAYOFF);
    if(running){
        this.stop();
        this.running = running;
    }
}

function on(){
    this.command(DISPLAYON);
    if(this.running){
        this.start();
    }
}

function init() {
    var me = this;
    this.reset();
    this.off();
    [
    //this.command(
    SETDISPLAYCLOCKDIV, 0x80,
    SETMULTIPLEX, 0x3F,
    SETDISPLAYOFFSET, 0x00,
    SETSTARTLINE | 0x00,
    CHARGEPUMP, 0x14,
    MEMORYMODE, 0x00,
    SEGREMAP | 0x01,
    COMSCANDEC,
    SETCOMPINS, 0x12,
    SETCONTRAST, 0xCF,
    SETPRECHARGE, 0xF1,
    SETVCOMDETECT, 0x40,
    DISPLAYALLON_RESUME,
    NORMALDISPLAY
    //);
    ].forEach(function(cmd) {
        me.command(cmd);
    });
    setTimeout(function() {
        me.display();
        me.on();
    }, 0);
}

function display() {
    var me = this,
        index,
        buffer;
    this.command(new Buffer([
    SETLOWCOLUMN | 0x00,
    SETHIGHCOLUMN | 0x00,
    SETSTARTLINE | 0x00]));

    this.data(this.canvas);
}

function start() {
    var me = this,
        startTime = 0,
        counter = 0;
    
    this.intervalId = setInterval(function() {
        me.display();
        counter++;
    }, this.delay);

    this.running = true;

    /*
	   setInterval(function() {
	   var endTime = +new Date;
	   if (startTime) {
	   console.log("FPS:" + (counter * 1000 / (endTime - startTime)));
	   }
	   startTime = endTime;
	   counter = 0;
	   }, 1000);
	   */
}

function clear() {
    this.canvas.fill(0);
}

function stop() {
    clearInterval(this.intervalId);
    this.running = false;
}


function drawPixel(x, y, color) {
    var i, m;
    x |= 0;
    y |= 0;
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        i = x + ((y / 8) | 0) * this.width;
        m = 1 << (y % 8);
        if (color === BLACK) {
            this.canvas[i] &= ~m;
        } else {
            this.canvas[i] |= m;
        }
    }
}

function extend(sub, base, prototype) {
    var _base;
    anonymous.prototype = base.prototype;
    _base = new anonymous();

    for (var i in prototype) {
        if (prototype.hasOwnProperty(i)) {
            _base[i] = prototype[i];
        }
    }

    _base.super = base;
    _base.constructor = sub;
    sub.prototype = _base;

    function anonymous() {};
}

extend(OLED, Canvas, {
    constructor: OLED,
    on:on,
    off:off,
    reset: reset,
    write: write,
    command: command,
    data: data,
    init: init,
    display: display,
    start: start,
    clear: clear,
    stop: stop,
    drawPixel: drawPixel
});

exports.OLED = OLED;
exports.WRITE = WRITE;
exports.BLACK = BLACK;
