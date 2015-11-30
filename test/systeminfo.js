var 
    // wiringpi = require("./wiringpi/build/Release/_wiringpi"),
    // wiringPiSetup = wiringpi.wiringPiSetup,

    oled = require("./oled"),
    OLED = oled.OLED,

    res = require("./res"),
    splash = res.splash,

    os = require("os"),
    fs = require("fs");

Date.prototype.format = function(fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //
        "d+": this.getDate(), //
        "h+": this.getHours(), //
        "m+": this.getMinutes(), //
        "s+": this.getSeconds(), //
        "q+": Math.floor((this.getMonth() + 3) / 3), //
        "S": this.getMilliseconds() // 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//wiringPiSetup();

var screen = new OLED({
    clk: 14,
    dat: 12,
    rst: 13,
    dc: 6,
    cs: 10
}, {
    width: 128,
    height: 64,
    canvas: res.splash,
    fps: 0
}),
    ct = screen.getContext("2d"),
    t, cpus;

// ct.fillText("Fill text", 26, 13);
// screen.display();

setTimeout(function() {

    cpus = os.cpus();

    t = setInterval(function() {
        var name, height = 8,
            y = 16 + height,
            //y = height,
            font = "04b03 " + height + "pt",
            item, item2, count, index,
            user, nice, sys, idle, irq,
            totalmem = os.totalmem(),
            freemem = os.freemem(),
            usedmem = totalmem - freemem,
            ifs = os.networkInterfaces(),
            cur = os.cpus(),
            temp = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp');
        //ct.clear();
        ct.fillRect(0, 16, 128, 48, oled.BLACK);
        ct.font = font;

        ct.fillText("TIME: " + new Date().format("yyyy.MM.dd hh:mm:ss"), 0, y);
        y += height;

        //network
        for (name in ifs) {
            addr = ifs[name];
            count = addr.length;
            while (count--) {
                if (addr[count].family === "IPv4" && !addr[count].internal) {
                    ct.fillText(name.toUpperCase() + ": " + addr[count].address, 0, y);
                    y += height;
                    break;
                }
            }
        }

        //cpus
        count = cur.length;
        for (index = 0; index < count; index++) {
            item = cur[index];
            item2 = cpus[index];

            user = item.times.user - item2.times.user;
            nice = item.times.nice - item2.times.nice;
            sys = item.times.sys - item2.times.sys;
            idle = item.times.idle - item2.times.idle;
            irq = item.times.irq - item2.times.irq;
            ct.fillText("CPU" + index + ": " + item.speed + "MHz " + ((100 - ((idle * 100) / (user + nice + sys + idle + irq))) | 0) + "%", 0, y);
            /*
            ct.fillRect(0, y + 1, 128, 6);
            ct.fillRect(1, y + 2, 126, 4, oled.BLACK);
            ct.fillRect(2, y + 3, (124 - ((idle * 124) / (user + nice + sys + idle + irq))) | 0, 2);
            y += 6;
			*/
            y += height;
        }
        cpus = cur;

        //mem
        ct.fillText("MEM: " + ((usedmem / 1024 / 1024) | 0) + "/" + ((totalmem / 1024 / 1024) | 0) + "MB " + ((usedmem * 100 / totalmem) | 0) + "%", 0, y);
        y += height;

        //temp
        temp = parseInt(temp);
        ct.fillText("TEMP: " + (temp / 1000) + " 'C", 0, y);
        y += height;


        screen.display();
    }, 1000);


}, 2000);
