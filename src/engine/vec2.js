function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

Vec2.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec2.prototype.normalize = function() {
    var len = this.length();
    this.x /= len;
    this.y /= len;
};

Vec2.prototype.add = function(v2) {
    this.x += v2.x;
    this.y += v2.y;
};

Vec2.prototype.distanceTo = function(v2) {
    var d = new Vec2(v2.x - this.x, v2.y - this.y);
    return d.length();
};