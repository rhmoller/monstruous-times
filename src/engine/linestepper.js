function LineStepper(x0, y0, x1, y1) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;

    this.dx = Math.abs(x1 - x0);
    this.sx = x0 < x1 ? 1 : -1;
    this.dy = Math.abs(y1 - y0);
    this.sy = y0 < y1 ? 1 : -1;
    this.err = (this.dx >this.dy ? this. dx : -this.dy) / 2;

    this.done = this.x0 === this.x1 && this.y0 === this.y1;
}

LineStepper.prototype.step = function() {
    if (!this.done) {
        var e2 = this.err;
        if (e2 > -this.dx) { this.err -= this.dy; this.x0 += this.sx; }
        if (e2 < this.dy) { this.err += this.dx; this.y0 += this.sy; }
    }

    this.done = this.x0 === this.x1 && this.y0 === this.y1;

    return {x: this.x0, y: this.y0};
};
