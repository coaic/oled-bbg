var Font = require("font").Font,

    CONTEXT_MAP = {
        "2d": Context2D
    },
    FONT_MAP = {
        "04b03": __dirname+"/font/fonts/04b03.ttf",
        "04b03b": __dirname+"/font/fonts/04b03b.ttf",
        "04b08": __dirname+"/font/fonts/04b08.ttf",
        "tomato_coffee": __dirname+"/font/fonts/tomato_coffee.ttf",
        "paskowy": __dirname+"/font/fonts/paskowy.ttf",
        "wqy-microhei": __dirname+"/font/fonts/wqy-microhei.ttc",
        "wqy-bitmapsong": __dirname+"/font/fonts/wenquanyi_9pt.pcf",
        "bmkitchen": __dirname+"/font/fonts/bmkitchen.ttf",
    },
    FONT_LOADER = {},
    DEFAULT_FONT = "wqy-bitmapsong",
    SPACING = 1,
    WRITE = 1,
    BLACK = 0;

function Canvas(width, height) {
    this.width = width;
    this.height = height;
}

function getContext(type) {
    var constructor, ret;
    if (constructor = CONTEXT_MAP[type]) {
        ret = new constructor(this);
    } else {
        ret = null;
    }
    return ret;
}

Canvas.prototype = {
    constructor: Canvas,
    getContext: getContext
};

function Context2D(canvas) {
    this.canvas = canvas;
    this.font = "";
    this._font = false;
    this._fontFile = false;
    this._fontLoader = false;
}

function fillRect(x, y, width, height, color) {
    //console.log(arguments);
    var tx, ty, canvas;
    canvas = this.canvas;
    for (ty = y; ty < y + height; ty++) {
        for (tx = x; tx < x + width; tx++) {
            canvas.drawPixel(tx, ty, color);
        }
    }
}

function clear() {
    this.fillRect(0, 0, this.canvas.width, this.canvas.height, BLACK);
}

function fillText(text, x, y, maxWidth) {
    var count, loader, canvas, endX, index, code, metrics, bitmap,
    sx, sy, tx, ty, ex, ey, pitch, row, line;

    _setFontLoader.call(this);

    count = text.length;
    loader = this._fontLoader;
    canvas = this.canvas;
    endX = ((maxWidth === undefined) ? this.canvas.width : (x + maxWidth));

    for (index = 0; index < count && x < endX; index++) {
        code = text.charCodeAt(index);
        loader.renderGlyph(code);
        metrics = loader.getMetrics();
        bitmap = loader.getBitmap();

        //console.log("bitmap:", bitmap, "\nmetrics", metrics);
        sx = x + metrics.horiBearingX;
        sy = y - metrics.horiBearingY;
        ex = sx + metrics.width;
        ey = sy + metrics.height;

        pitch = bitmap.pitch;

        ex = Math.min(endX, ex);

        for (ty = sy, row = 0; ty < ey; ty++, row++) {
            for (tx = sx, line = 0; tx < ex; tx++, line++) {
                if (bitmap.buffer[(row * pitch) + ((line / 8) | 0)] & (0x80 >> (line % 8))) {
                    canvas.drawPixel(tx, ty);
                }
            }
        }

        x += metrics.horiAdvance;
    }
}

function _setFontLoader() {
    var tmp, fileChange;
    if (this.font !== this._font) {
        this._font = this.font;
        fileChange = false;
        tmp = __getFontConfig(String(this._font));

        if (this._fontFile !== tmp.file) {
            //console.log(tmp.file);
            this._fontLoader = __getFontLoader(tmp.file);
            this._fontFile = tmp.file;
            fileChange = true;
        }

        if (fileChange || this._fontSize !== tmp.size) {
            this._fontLoader.setCharSize(tmp.size);
            this._fontSize = tmp.size;
        }
    }
}

function __argumentsToArray(args) {
    return Array.prototype.slice.call(args, 0);
}

function __wrapFastFunction(callback) {
    return function() {
        var name = callback.name,
            fn = this.canvas[name];
        if (typeof fn === "function") {
            callback = function() {
                return fn.apply(this.canvas, __argumentsToArray(arguments));
            }
        }
        this[name] = callback;
        return callback.apply(this, __argumentsToArray(arguments));
    };
}

function __getFontConfig(font) {
    var ret, matches, count, found, file;
    ret = {};
    matches = font.match(/(^|\s)(\d+)(px|pt)(\s|$)/i);
    ret.size = matches ? parseInt(matches[2]) : 12;
    matches = font.match(/[\w]+/g);
    found = false;
    if (matches) {
        count = matches.length;
        while (count--) {
            file = FONT_MAP[matches[count]];
            if (file) {
                ret.file = file;
                found = true;
                break;
            }
        }
    }
    if (!found) ret.file = FONT_MAP[DEFAULT_FONT];
    return ret;
}

function __getFontLoader(file) {
    return FONT_LOADER[file] || (FONT_LOADER[file] = new Font(file));
}

Context2D.prototype = {
    constructor: Context2D,
    fillRect: __wrapFastFunction(fillRect),
    clear: __wrapFastFunction(clear),
    fillText: __wrapFastFunction(fillText)
};

exports.Canvas = Canvas;
exports.WRITE = WRITE;
exports.BLACK = BLACK;
