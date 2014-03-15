/**
 * Preloader
 *
 * @constructor
 */
function Preloader() {
    this.paths = [];
    this.assets = {};
}

Preloader.prototype.add = function(path) {
    this.paths.push(path);
    console.log("Queued " + path);
};

Preloader.prototype.load = function(callback) {
    this.todo = this.paths.length;
    var loader = this;

    function loaded() {
        console.log("Loaded " + this.src);
        loader.todo--;
        if (loader.todo === 0) {
            callback();
        }
    }

    for (var i = 0; i < this.paths.length; i++) {
        var path = this.paths[i];
        var img = document.createElement("img");

        img.onload = loaded;
        loader.assets[path] = img;

        img.src = path;
    }

};

Preloader.prototype.get = function(path) {
    return this.assets[path];
};
