var 
    // wiringpi = require("wiringpi"),
    // wiringPiSetup = wiringpi.wiringPiSetup,
    // delay = wiringpi.delay,
    // shiftOut = wiringpi.shiftOut,
    // pinMode = wiringpi.pinMode,
    // digitalWrite = wiringpi.digitalWrite,
    async = require('async'),
    b = require("bonescript"),
    i2c = require("i2c-bus"),
    BUS0 = 0,
    BUS1 = 1,
    BUS2 = 2,
    i2c1,
    OledAddress = 0x3C,
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
    // DISPLAYOFF = 0xAE,
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
    SETENABLESECONDPRECHARGE = 0xD5,
    INTERNALVSL = 0x62,
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
    SETHIGHCOLUMN = 0x10
    // SETSTARTLINE = 0x40
    ;
    
function sendCommand(cmd, data, callback) {
    var buffer = new Array();
    if (arguments.length == 3) {
        buffer = data.slice(0);
        buffer.unshift(cmd);
        i2c1.i2cWrite(OledAddress, buffer.length, buffer, function(err, bytesWritten, buffer) {
            if (err) {
                console.log("I2C Error sending command: " + cmd + ", data: " + data + ", error: " + err);
                callback(err);
            } else {
                callback();
            }
        });
    } else if (arguments.length == 3) {
        buffer.push(cmd);
        i2c1.i2cWrite(OledAddress, buffer.length, buffer, function(err, bytesWritten, buffer) {
            if (err) {
                console.log("I2C Error sending command: " + cmd + ", error: " + err);
                callback(err);
            } else {
                callback();
            }
        });
    } else {
        console.log("I2C too many argumnents to sendCommand");
        callback("I2C too many argumnents to sendCommand");
    }
}

function setDisplayModeNormal(cb) {
    sendCommand(0xA4, cb);
}

function setDisplayModeAllOn(cb) {
    sendCommand(0xA5, cb);
}

function setDisplayModeAllOff(cb) {
    sendCommand(0xA6, cb);
}

function setDisplayModeInverse(cb) {
    sendCommand(0xA7, cb);
}

function setEnableScroll(on, cb) {
    if (on)
        sendCommand(0x2F, cb);
    else
        sendCommand(0x2E, cb);
}

function setEnableDisplay(on, cb) {
    if (on) 
        sendCommand(0xAF, cb);
    else
        sendCommand(0xAE, cb);    
}

function init() {
    async.series([
        function(cb) {
            i2c1 = i2c.open(BUS1, cb);
        },
        function(cb) {
            sendCommand(SETCOMMANDLOCK, cb);                        // Unlock OLED driver IC MCU interface from entering command. i.e: Accept commands
        },
        function(cb) {
            sendCommand(RESETPROTECTION, cb);
        },
        function(cb) {
            setEnableDisplay(false, cb);
        },
        function(cb) {
            sendCommand(SETMULTIPLEX, [NINTEYSIX], cb);         // set multiplex ratio
        },
        function(cb) {
            sendCommand(SETSTARTLINE, [0x00], cb);                  // set display start line
        },
        function(cb) {
            sendCommand(SETDISPLAYOFFSET, [0x60], cb);              // set display offset
        },
        function(cb) {
            sendCommand(SETREMAP, [0x46], cb);                      // set remap
        },
        function(cb) {
            sendCommand(SETVDDINTERNAL, [0x01], cb);                // set vdd internal
        },
        function(cb) {
            sendCommand(SETCONTRAST, [0x53], cb);                   // set contrast
        },
        function(cb) {
            sendCommand(SETPHASELENGTH, [0x51], cb);                // set phase length
        },
        function(cb) {
            sendCommand(SETDISPLAYCLOCKDIVIDERATIO, [0x01], cb);    // set display clock divide ratio/oscillator frequency
        },
        function(cb) {
            sendCommand(SETLINEARLUT, cb);                          // set linear gray scale
        },
        function(cb) {
            sendCommand(SETPRECHARGEVOLTAGE, [VCOMH], cb);          // set pre charge voltage to VCOMH
        },
        function(cb) {
            sendCommand(SETVCOMH, [POINT86VCC], cb);                // set VCOMh .86 x Vcc
        },
        function(cb) {
            sendCommand(SETSECONDPRECHARGE, [0x01], cb);            // set second pre charge period
        },
        function(cb) {
            sendCommand(SETENABLESECONDPRECHARGE, INTERNALVSL, cb); // enable second pre charge and internal VSL
        },
    
        function(cb) {
            setDisplayModeNormal(cb);
        },
        function(cb) {
            setEnableScroll(false, cb);
        },
        function(cb) {
            setEnableDisplay(true, cb);
        }
    ]);
}

function OLED(pins, screen) {

    // this.clk = pins.clk;
    // this.dat = pins.dat;
    // this.rst = pins.rst;
    // this.dc = pins.dc;
    // this.cs = pins.cs;

    // b.pinMode(this.clk, b.OUTPUT);
    // b.pinMode(this.dat, b.OUTPUT);
    // b.pinMode(this.rst, b.OUTPUT);
    // b.pinMode(this.dc, b.OUTPUT);
    // b.pinMode(this.cs, b.OUTPUT);

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
    init();
    console.log("reset");
}

// function write(dc, data) {
//     var count = arguments.length,
//         i;
//     b.digitalWrite(this.cs, b.HIGH);
//     b.digitalWrite(this.dc, dc ? b.LOW : b.HIGH);
//     b.digitalWrite(this.cs, b.LOW);
//     for (i = 1; i < count; i++) {
//         b.shiftOut(this.dat, this.clk, MSBFIRST, arguments[i]);
//     }
//     b.digitalWrite(this.cs, HIGH);
// }

function write(buffer) {
    i2c1.i2cWrite(OledAddress, buffer.length, buffer, function(err, bytesWritten, buffer) {
        console.log("I2C Error writing data: " + buffer + ", error: " + err);
    });
}

// function command(cmd) {
//     this.write(true, cmd);
// }

function command(cmd) {
    this.sendCommand(cmd);
}

// function data(data) {
//     this.write(false, data);
// }

function data(buffer) {
    this.write(buffer);
}

function off() {
    setEnableDisplay(false);
}

function on() {
    setEnableDisplay(true);
}

// function init() {
//     var me = this;
//     this.reset();
//     this.off();
//     [
//     //this.command(
//     SETDISPLAYCLOCKDIV, 0x80,
//     SETMULTIPLEX, 0x3F,
//     SETDISPLAYOFFSET, 0x00,
//     SETSTARTLINE | 0x00,
//     CHARGEPUMP, 0x14,
//     MEMORYMODE, 0x00,
//     SEGREMAP | 0x01,
//     COMSCANDEC,
//     SETCOMPINS, 0x12,
//     SETCONTRAST, 0xCF,
//     SETPRECHARGE, 0xF1,
//     SETVCOMDETECT, 0x40,
//     DISPLAYALLON_RESUME,
//     NORMALDISPLAY
//     //);
//     ].forEach(function(cmd) {
//         me.command(cmd);
//     });
//     setTimeout(function() {
//         me.display();
//         me.on();
//     }, 0);
// }

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
