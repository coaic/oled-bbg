var wiringpi = require("./wiringpi/build/Release/_wiringpi"),
    wiringPiSetup = wiringpi.wiringPiSetup,

    res = require("./res"),
    oled = require("./oled"),
    OLED = oled.OLED;

Date.prototype.format = function(fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


wiringPiSetup();
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
    ct = screen.getContext("2d");



setInterval(function() {
//setTimeout(function() {
	var now = new Date;
    ct.clear();
	ct.font = "04b03 16pt",
    ct.fillText(now.format("yyyy-MM-dd"), 0, 40);
	ct.font = "04b03b 24pt",
	//ct.font = "bmkitchen 20pt",
    //ct.fillText(now.format("hh:mm:ss"), 0, 64);
    //ct.fillText("00:00:00", 0, 64);
    //ct.fillText("00:00", 0, 64);
	//ct.font = "04b03b 64pt",
    ct.fillText(now.format("hh:mm:ss"), 0, 64, 128);
    screen.display();
}, 1000);






['exit', 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'].forEach(function(element, index, array) {
    process.on(element, function() {
        screen.off();
        process.exit(1);
    });
});
