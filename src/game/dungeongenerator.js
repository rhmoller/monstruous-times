
function DungeonGenerator(map) {
    this.map = map;
}

function drawBlob(map, x, y, sz, tile) {
    var x1 = x - (sz / 2);
    var y1 = y - (sz / 2);

    var p = new Vec2(x, y);

    var r = (sz - 1) / 2;

    for (var by = 0; by < sz; by++) {
        for (var bx = 0; bx < sz; bx++) {
            if (p.distanceTo({"x": x1 + bx, "y": y1 + by}) < r) {
                map.set(x1 + bx, y1 + by, tile);
            }
        }
    }
}


DungeonGenerator.prototype.generateDungeon = function () {
    var map = this.map;

    for (var y = 0; y < map.height; y++) {
        for (var x = 0; x < map.width; x++) {
            map.set(x, y, 23);
        }
    }

    var blobs = [];
    for (var i = 0; i < 100; i++) {
        var x = Math.random() * map.width;
        var y = Math.random() * map.height;
        var r = 3 + Math.random() * 7;
        blobs.push({"x": x, "y": y, "r": r});
    }

    blobs.push({"x": player.x, "y": player.y, "r": 3});

    for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        drawBlob(map, b.x, b.y, b.r, 21);
    }

    var blob = blobs.splice(0, 1)[0];

    while (blobs.length > 0) {
        var nearest = { dist: 1000 };

        for (var j = 0; j < blobs.length; j++) {
            var b2 = blobs[j];

            var d = new Vec2(b2.x - blob.x, b2.y - blob.y);
            var len = d.length();

            if (len > nearest.dist) continue;

            nearest.dist = len;
            nearest.blob = b2;
            nearest.d = d;
            nearest.idx = j;
        }

        var p = new Vec2(blob.x, blob.y);
        nearest.d.normalize();

        for (var k = 0; k < nearest.dist; k++) {
            drawBlob(map, p.x, p.y, 3, 22);
            p.add(nearest.d);
        }

        blob = blobs.splice(nearest.idx, 1)[0];
    }

};