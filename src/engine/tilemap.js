function TileMap(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = [];
}

TileMap.prototype.get = function (x, y) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    return this.tiles[fx + fy * this.width];
};

TileMap.prototype.set = function (x, y, v) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    this.tiles[fx + fy * this.width] = v;
};
