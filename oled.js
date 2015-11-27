var wiringpi = require("wiringpi"),
    wiringPiSetup = wiringpi.wiringPiSetup,
    delay = wiringpi.delay,
    shiftOut = wiringpi.shiftOut,
    pinMode = wiringpi.pinMode,
    digitalWrite = wiringpi.digitalWrite,
    OUTPUT = wiringpi.OUTPUT,
    HIGH = wiringpi.HIGH,
    LOW = wiringpi.LOW,
    MSBFIRST = wiringpi.MSBFIRST,

    canvas = require("./canvas"),
    Canvas = canvas.Canvas,
    WRITE = canvas.WRITE,
    BLACK = canvas.BLACK,

    DISPLAYOFF = 0xAE,
    SETDISPLAYCLOCKDIV = 0xD5,
    SETMULTIPLEX = 0xA8,
    SETDISPLAYOFFSET = 0xD3,
    SETSTARTLINE = 0x40,
    CHARGEPUMP = 0x8D,
    MEMORYMODE = 0x20,
    SEGREMAP = 0xA0,
    COMSCANDEC = 0xC8,
    SETCOMPINS = 0xDA,
    SETCONTRAST = 0x81,
    SETPRECHARGE = 0xD9,
    SETVCOMDETECT = 0xDB,
    DISPLAYALLON_RESUME = 0xA4,
    NORMALDISPLAY = 0xA6,
    DISPLAYON = 0xAF,
    SETLOWCOLUMN = 0x00,
    SETHIGHCOLUMN = 0x10,
    SETSTARTLINE = 0x40;

function OLED(pins, screen) {

    this.clk = pins.clk;
    this.dat = pins.dat;
    this.rst = pins.rst;
    this.dc = pins.dc;
    this.cs = pins.cs;

    pinMode(this.clk, OUTPUT);
    pinMode(this.dat, OUTPUT);
    pinMode(this.rst, OUTPUT);
    pinMode(this.dc, OUTPUT);
    pinMode(this.cs, OUTPUT);

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
    digitalWrite(this.rst, HIGH);
    delay(1);
    digitalWrite(this.rst, LOW);
    delay(10);
    digitalWrite(this.rst, HIGH);
    //console.log("reseted");
}

function write(dc, data) {
    var count = arguments.length,
        i;
    digitalWrite(this.cs, HIGH);
    digitalWrite(this.dc, dc ? LOW : HIGH);
    digitalWrite(this.cs, LOW);
    for (i = 1; i < count; i++) {
        shiftOut(this.dat, this.clk, MSBFIRST, arguments[i]);
    }
    digitalWrite(this.cs, HIGH);
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
