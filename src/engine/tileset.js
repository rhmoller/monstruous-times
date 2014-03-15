/**
 * TileSet
 *
 * @param image
 * @param tileWidth
 * @param tileHeight
 * @constructor
 */
function TileSet(image, tileWidth, tileHeight) {
    this.img = image;
    this.tilesPerLine = image.width / tileWidth;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
}

TileSet.prototype.draw = function(tile, x, y, scaleFactor) {
    var tileX = this.tileWidth * Math.floor(tile % this.tilesPerLine);
    var tileY = this.tileHeight * Math.floor(tile / this.tilesPerLine);

    var w = this.tileWidth * scaleFactor;
    var h = this.tileHeight * scaleFactor;

    ctx.drawImage(this.img, tileX, tileY, this.tileWidth, this.tileHeight, x * w, y * h, w, h);
};

TileSet.prototype.drawPx = function(tile, x, y, scaleFactor) {
    var tileX = this.tileWidth * Math.floor(tile % this.tilesPerLine);
    var tileY = this.tileHeight * Math.floor(tile / this.tilesPerLine);

    var w = this.tileWidth * scaleFactor;
    var h = this.tileHeight * scaleFactor;

    ctx.drawImage(this.img, tileX, tileY, this.tileWidth, this.tileHeight, x, y, w, h);
};
