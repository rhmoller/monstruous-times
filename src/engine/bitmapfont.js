/**
 * BitmapFont
 *
 * @param image
 * @param width
 * @param height
 * @constructor
 */
function BitmapFont(image, width, height, image2) {
    this.image = image;
    this.image2 = image2;
    this.width = width;
    this.height = height;
}

BitmapFont.prototype.draw = function (ctx, text, tx, ty) {
    var hilight = false;

    for (var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i) - 33;
        var cx = 16 * (c % 32);
        var cy = 16 * Math.floor(c / 32);

        if (text.charCodeAt(i) == ']'.charCodeAt(0)) hilight = false;

        if (c != -1) {
            if (hilight) {
                ctx.drawImage(this.image2, cx, cy, 16, 16, tx, ty, 16, 16);
            } else {
                ctx.drawImage(this.image, cx, cy, 16, 16, tx, ty, 16, 16);
            }
        }

        if (text.charCodeAt(i) == '['.charCodeAt(0)) hilight = true;

        tx += 16;
    }
};

BitmapFont.prototype.drawCenter = function (ctx, text, y) {
    var tx = 320 - 8 * text.length;
    var ty = (y) ? y : 240 - 8;
    this.draw(ctx, text, tx, ty);
};
