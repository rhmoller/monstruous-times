

/**
 * todo:
 *  prioritized
 *      hit points
 *      sword mode
 *      armour
 *      other monsters
 *      path finding
 *
 *
 * ----
 *  - ai
 *  - path finding
 *
 *  - wield weapon
 *
 *  - storyline
 *  - better tiles
 *
 *  - stats: mana, health, gold, move, xp
 *  - spells: heal, fog, stun
 *
 *  - better collision detection when moving monster
 *  - better collision detection when placing player, items and monsters
 */

var preloader = new Preloader();
preloader.add("rogue.png");
preloader.add("BBCMode1.png");
preloader.add("BBCMode1-yellow.png");
preloader.load(startGame);

var KEY_LEFT = 37,
    KEY_UP = 38,
    KEY_RIGHT = 39,
    KEY_DOWN = 40,

    KEY_ESC = 27,
    KEY_ENTER = 13,

    KEY_R = 82,
    KEY_S = 83,
    KEY_M = 77,
    KEY_A = 65,
    KEY_I = 73,
    KEY_U = 85;

var WATER_TILE = 20,
    ROCK_TILE = 23,
    BULLET_TILE = 40;

var TILE_MANA_POTION = 4;
var TILE_KEY = 5;
var TILE_HEALING_POTION = 6;
var TILE_STAMINA_POTION = 7;
var TILE_SPELL = 8;
var TILE_GOLD = 3;

var TILE_WARPIG = 2;
var TILE_DRAGON = 9;
var TIlE_SWORD = 10;

var SCALE_FACTOR = 2;

var fontImg, img;

var tileset = null;
var tilemap = null;
var visited = null;
var font = null;

var scheduledMessages = [
    { move: 0, message: "Use arrow keys to move"},
    { move: 5, message: "The valley has been invaded by monsters"},
    { move: 8, message: "It is your mission to kill them"},
    { move: 12, message: "Walk into monsters to attack"}
];

var player = {
    x: 2,
    y: 2,

    attack: 1,
    stamina: 10,
    health: 10,
    alive: true,
    score: 0,
    mana: 0,
    items: {},
    spells: [],
    itemCount: 0,
    encounteredSpells: false,
    encounteredItems: false,

    addItem: function (name, tile, amount) {
        if (!player.encounteredItems) {
            notice("Press [I] to open inventory")
            player.encounteredItems = true;
        }
        if (!amount) amount = 1;

        var item = this.items[name];
        if (!item) {
            item = { "name": name, "amount": 0, "tile": tile };
            this.items[name] = item;
            this.itemCount++;
        }

        item.amount += amount;
    },

    addSpell: function(name) {
        if (!player.encounteredItems) {
            notice("Press [S] to open spellbook")
            player.encounteredItems = true;
        }
        this.spells.push(name);
    }
};

var phase = 0;

var monsters = [];
var bullets = [];

var move = 0;

var items = [];

var tbar = [];

var mapMode = false;
var inventoryMode = false;
var spellbookMode = false;

var colors = [
    "#00f", "#0f0", "#880", "#888"
];

var inventoryLine = 0;

function paintMap() {
    var tw = 640 / tilemap.width;
    var th = 480 / tilemap.height;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 640, 480);

    for (var y = 0; y < tilemap.height; y++) {
        for (var x = 0; x < tilemap.width; x++) {
            if (visited.get(x, y) > 0) {
                ctx.fillStyle = colors[tilemap.get(x, y) - 20];
                ctx.fillRect(tw * x, th * y, tw + 1, th + 1);
            }
        }
    }

    ctx.fillStyle = "#f00";
    ctx.fillRect(tw * player.x, th * player.y, tw, th);

    font.drawCenter(ctx, "[ESC/M] Exit", 480 - 50 - 32);
}

function inLineOfSight(x, y) {
    var px = player.x;
    var py = player.y;
    visited.set(px, py, 1);

    var step = 0;
    var stepper = new LineStepper(px, py, x, y);
    while (!stepper.done) {
        visited.set(stepper.x0, stepper.y0, 1);
        if (step++ > 8) return false;
        var t = tilemap.get(stepper.x0, stepper.y0);
        if (t == ROCK_TILE) {
            return false;
        }
        stepper.step();
    }

    return true;
}

function paintInventory() {
    ctx.fillStyle = "rgba(0, 0, 20, 0.9)";
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(640 - 100, 50);
    ctx.lineTo(640 - 100, 480 - 50);
    ctx.lineTo(100, 480 - 50);
    ctx.lineTo(100, 50);
    ctx.stroke();

    font.drawCenter(ctx, "Inventory", 50 + 16);
    font.drawCenter(ctx, "[Arrows] Select", 480 - 40 - 50);
    font.drawCenter(ctx, "[Enter/U] Use  [ESC/I] Exit", 480 - 40 - 32);

    var i = 0;
    var lineh = 32;

    for (var itemName in player.items) {
        if (i == inventoryLine) {
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(100, 50 + 38 + inventoryLine * lineh, 440, lineh);
        }

        var tx = player.items[itemName].amount < 10 ? 48 : 32;
        font.draw(ctx, player.items[itemName].amount + "x", 100 + tx, 50 + 48 + i * lineh);
        font.draw(ctx, itemName, 100 + 16 * 8, 50 + 48 + i * lineh);
        tileset.drawPx(player.items[itemName].tile, 106 + 16 * 5, 40 + 48 + i * lineh, 2);

        i++;
    }

    if (i === 0) {
        font.drawCenter(ctx, "Empty", 230);
    }
}

function paintSpellbook() {
    ctx.fillStyle = "rgba(0, 0, 20, 0.9)";
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(640 - 100, 50);
    ctx.lineTo(640 - 100, 480 - 50);
    ctx.lineTo(100, 480 - 50);
    ctx.lineTo(100, 50);
    ctx.stroke();

    font.drawCenter(ctx, "Spellbook", 50 + 16);
    font.drawCenter(ctx, "[Arrows] Select", 480 - 40 - 50);
    font.drawCenter(ctx, "[Enter/U] Use  [ESC/S] Exit", 480 - 40 - 32);

    var lineh = 32;

    for (var i = 0; i < player.spells.length; i++) {
        if (i == inventoryLine) {
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(100, 50 + 38 + inventoryLine * lineh, 440, lineh);
        }

        font.draw(ctx, player.spells[i], 100 + 16 * 8, 50 + 48 + i * lineh);
        tileset.drawPx(TILE_SPELL, 106 + 16 * 5, 40 + 48 + i * lineh, 2);
    }

    if (player.spells.length === 0) {
        font.drawCenter(ctx, "Empty", 230);
    }
}

function repaint() {
    if (mapMode) {
        paintMap();
        return;
    } else if (inventoryMode) {
        paintInventory();
        return;
    } else if (spellbookMode) {
        paintSpellbook();
        return;
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 640, 480);

    ctx.save();
    ctx.translate(320 - player.x * 32, 240 - player.y * 32);

    var tw = SCALE_FACTOR * tileset.tileWidth;

    for (var y = 0; y < tilemap.height; y++) {
        for (var x = 0; x < tilemap.width; x++) {
            var tile = tilemap.get(x, y);
            tileset.draw(tile, x, y, SCALE_FACTOR);
        }
    }

    for (var i = 0; i < items.length; i++) {
        tileset.draw(items[i].tile, items[i].x, items[i].y, SCALE_FACTOR);
    }

    var playerTile = player.alive ? 0 : 1;

    tileset.draw(playerTile, player.x, player.y, SCALE_FACTOR);
    for (var i = 0; i < monsters.length; i++) {
        var monster = monsters[i];
        if (inLineOfSight(monster.x, monster.y)) {
            tileset.draw(monster.tile, monster.x, monster.y, SCALE_FACTOR);
        }
    }

    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];
        console.log("paint bullet " + bullet.x + ", " + bullet.y);
        tileset.draw(BULLET_TILE, bullet.x, bullet.y, SCALE_FACTOR);
    }

    for (var y = 0; y < tilemap.height; y++) {
        for (var x = 0; x < tilemap.width; x++) {
            var d = new Vec2(x - player.x, y - player.y).length();
            var dark = d * 0.14;

            if (!inLineOfSight(x, y)) {
                dark += 0.7;
            }

            if (dark > 0) {
                if (dark > 1) dark = 1;
                ctx.fillStyle = "rgba(0, 0, 0, " + dark + ")";
                ctx.fillRect(x * tw, y * tw, tw, tw);
            }
        }
    }

    ctx.restore();

    font.draw(ctx, "Health: " + player.health +" of " + player.stamina, 16, 16);
    font.draw(ctx, "Mana  : " + Math.floor(player.mana), 16, 32);
    font.draw(ctx, "Score : " + player.score, 16, 48);
    font.draw(ctx, "Move  : " + move, 16, 64);

    ctx.globalAlpha = 0.5;
    font.drawCenter(ctx, "[I]nventory [S]pellbook [M]ap", 460);
    ctx.globalAlpha = 1;

    var longestline = 0;
    for (var i = 0; i < tbar.length; i++) {
        var line = tbar[i];
        var length = line.text.length;
        longestline = Math.max(length, longestline);
    }

    var ty = 400 + tbar.length * 16;

    if (tbar.length > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        var twh = longestline * 8 + 32;
        ctx.fillRect(320 - twh, ty - 20 * tbar.length - 8, twh * 2, 20 * tbar.length + 12);
    }

    for (var i = 0; i < tbar.length; i++) {
        var line = tbar[i];
        ty -= 20;

        ctx.globalAlpha = line.fade > 1 ? 1 : line.fade;
        font.draw(ctx, line.text, 320 - 8 * line.text.length, ty);
        ctx.globalAlpha = 1;
    }
}

function isWalkableTile(creature, dx, dy) {
    if (creature.x + dx < 0 ||
        creature.y + dy < 0 ||
        creature.x + dx >= tilemap.width ||
        creature.y + dy >= tilemap.height) {
        return false;
    }

    var tile = tilemap.get(creature.x + dx, creature.y + dy);
    return tile != WATER_TILE && tile != ROCK_TILE;
}

function updateMonster() {
    for (var i = 0; i < monsters.length; i++) {
        var monster = monsters[i];

        if (monster.tile == TILE_WARPIG) {
            if (i % 2 === move % 2) continue;
        } else {
            if (i % 3 === move % 3) continue;
        }

        var dx = (player.x > monster.x) ? 1 : -1;
        var dy = (player.y > monster.y) ? 1 : -1;

        if (player.x == monster.x) dx = 0;
        if (player.y == monster.y) dy = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            dy = 0;
        } else if (Math.abs(dx) == Math.abs(dy)) {
            if (Math.random() > 0.5) {
                dx = 0;
            } else {
                dy = 0;
            }
        } else {
            dx = 0;
        }

        if (monster.x + dx == player.x &&
            monster.y + dy == player.y) {

            var name = (monster.tile == TILE_WARPIG) ? "warpig" : "dragon";

            attackPlayer(name, monster.damage);
        } else {
            if (isWalkableTile(monster, dx, 0)) {
                monster.x += dx;
            }

            if (isWalkableTile(monster, 0, dy)) {
                monster.y += dy;
            }
        }

    }
}

function collideWithMonsters(bullet) {
    for (var j = 0; j < monsters.length; j++) {
        var monster = monsters[j];
        if (distance(bullet, monster) < 1) {
            console.log("Hit!");
            return j;
        }
    }

    return -1;
}

function outOfBounds(entity) {
    return (entity.x < 0 || entity.x >= tilemap.width || entity.y < 0 || entity.y >= tilemap.height);
}

function updateBullets() {
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];
        var collision = -1;

        collision = Math.max(collideWithMonsters(bullet), collision);
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (outOfBounds(bullet) || tilemap.get(bullet.x, bullet.y) === ROCK_TILE) {
            bullets.splice(i, 1);
            i--;
            continue;
        }

        collision = Math.max(collideWithMonsters(bullet), collision);

        if (collision >= 0) {
            bullets.splice(i, 1);
            i--;

            var name = (monsters[collision].tile == TILE_WARPIG) ? "warpig" : "dragon";
            var value = (monsters[collision].tile == TILE_WARPIG) ? 100 : 250;
            monsters.splice(collision, 1);
            notice("You killed a " + name);
            player.score += value;
        }
    }
}

function update() {
    for (var i = 0; i < tbar.length; i++) {
        var line = tbar[i];
        line.fade -= 0.25;
        if (line.fade <= 0) {
            tbar.splice(i, 1);
            i--;
        }
    }

    for (var m = 0; m < scheduledMessages.length; m++) {
        var msg = scheduledMessages[m];
        if (msg.move == move) {
            notice(msg.message);
        } else if (msg.move > move) {
            break;
        }
    }


    move++;
    phase = 1;

    updateBullets();
    updateMonster();

    var tileUnderPlayer = tilemap.get(player.x, player.y);
    if (tileUnderPlayer == WATER_TILE) {
        player.alive = false;
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (player.x == item.x && player.y == item.y) {
            switch (item.tile) {
                case TILE_GOLD:
                    player.score += item.value;
                    notice("You found a treasure worth " + item.value);
                    player.addItem("Gold", 3, item.value);
                    break;
                case TIlE_SWORD:
                    player.attack++;
                    notice("You found a mightier sword");
                    break;
                case TILE_MANA_POTION:
                    player.score += item.value;
                    player.addItem("Mana potion", TILE_MANA_POTION);
                    notice("You found a mana potion");
                    break;
                case TILE_KEY:
                    player.score += item.value;
                    player.addItem("Key", TILE_KEY);
                    notice("You found a key");
                    break;
                case TILE_HEALING_POTION:
                    player.score += item.value;
                    player.addItem("Healing potion", TILE_HEALING_POTION);
                    notice("You found a healing potion");
                    break;
                case TILE_STAMINA_POTION:
                    player.score += item.value;
                    player.addItem("Stamina potion", TILE_STAMINA_POTION);
                    notice("You found a stamina potion");
                    break;
                case TILE_SPELL:
                    if (Math.random() < 0.75) {
                        player.score += item.value;
                        player.addSpell("Fireball");
                        notice("You found a fireball spell");

                    } else {
                        player.score += item.value;
                        player.addSpell("Energizer");
                        notice("You found an energizer spell");
                    }
                    break;
            }
            items.splice(i, 1);
            i--;
        }
    }

    player.mana += 0.3;

    if (!player.alive) {
        ctx.globalAlpha = 1;
        clearNotices();
        notice("[R]estart?");
        notice("You died!");
    }

    if (monsters.length == 0) {
        ctx.globalAlpha = 1;
        clearNotices();
        notice("[R]estart?");
        notice("Yeah, you killed all monsters!");
        player.alive = false;
    }

    setTimeout(function () {
        if (phase == 0) return;
        phase = 0;
        updateBullets();
        repaint();
    }, 1000);
}

function flushQueue() {
    if (phase == 0) return;
    phase = 0;
    updateBullets();
    repaint();
}

function generateMap() {
    var tilemap = new TileMap(64, 64);
    visited = new TileMap(64, 64);
    visited.set(player.x, player.y, 1);

    var generator = new DungeonGenerator(tilemap);
    generator.generateDungeon();

    return tilemap;
}

function spreadGold() {

    for (var i = 0; i < 75; i++) {
        var x = Math.floor(tilemap.width * Math.random());
        var y = Math.floor(tilemap.height * Math.random());
        var t = 3 + Math.floor(Math.random() * 7);

        if (t== TILE_DRAGON) {
            if (Math.random() < 0.5) {
                t = TIlE_SWORD;
            } else {
                t = TILE_GOLD;
            }
        }

        if (t == TILE_SPELL) {
            // less spells and more mana
            if (Math.random() > 0.5) {
                t == TILE_MANA_POTION;
            }
        }

        var item = {x: x, y: y, tile: t, value: Math.floor(Math.random() * 30)};

        if (distance(player, item) < 15) {
            continue;
        }

        tilemap.set(x, y, WATER_TILE + 1);

        items.push(item);
    }
}

function spreadMonsters() {
    for (var i = 0; monsters.length < 50; i++) {
        var x = Math.floor(Math.random() * tilemap.width);
        var y = Math.floor(Math.random() * tilemap.height);

        if (x == player.x && y == player.y) continue;

        var tile = Math.random() > 0.9 ? TILE_DRAGON : TILE_WARPIG;
        var health = tile == TILE_DRAGON ? 7 : 3;
        var damage = tile == TILE_DRAGON ? 3 : 1;

        var monster = {"x": x, "y": y, "health": health, "tile": tile, "damage": damage};
        if (distance(player, monster) < 15) {
            continue;
        }

        monsters.push(monster);
        tilemap.set(monster.x, monster.y, 21);
    }
}

function notice(text) {
    tbar.push({ "text": text, "fade": 1});
}

function clearNotices() {
    tbar.length = 0;
}

function restart() {
    tbar.length = 0;
    items.length = 0;
    monsters.length = 0;
    player.alive = true;
    player.attack = 1;
    player.health = 10;
    player.stamina = 10;
    player.score = 0;
    player.mana = 0;
    player.items = {};
    player.spells = [];
    player.itemCount = 0;
    player.encounteredItems = false;
    player.encounteredSpells = false;
    move = 0;
    bullets.length = 0;

    tilemap = generateMap();
    spreadGold();
    spreadMonsters();

    tilemap.set(player.x, player.y, 21);

//    notice("Walk into monsters to attack");
//    notice("Use arrow keys to move");
}

function toggleMap() {
    mapMode = !mapMode;
}

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function sign(value) {
    if (value === 0) return value;
    return (value > 0) ? 1 : -1;
}

function shoot() {
    var closestEnemy = { dist: 1000 };

    console.log("Begin attack");
    for (var i = 0; i < monsters.length; i++) {
        var m = monsters[i];
        var d = distance(player, m);
        if (d < closestEnemy.dist) {
            closestEnemy.dist = d;
            closestEnemy.enemy = m;
        }
    }

    var enemy = closestEnemy.enemy;
    console.log("Closest enemy " + enemy.x + ", " + enemy.y);

    var dx = enemy.x - player.x;
    var dy = enemy.y - player.y;

    var bullet = {};

    if (Math.abs(dx) > Math.abs(dy)) {
        bullet.dx = sign(dx);
        bullet.dy = 0;
    } else {
        bullet.dx = 0;
        bullet.dy = sign(dy);
    }

    bullet.x = player.x;
    bullet.y = player.y;
    console.log("fire bullet: " + bullet.x + ", " + bullet.y);

    bullets.push(bullet);
}

function attack(enemy) {
    var damage = player.attack;
    enemy.health -= damage;

    var name = (enemy.tile == TILE_WARPIG) ? "warpig" : "dragon";

    if (enemy.health <= 0) {
        var idx = monsters.indexOf(enemy);
        monsters.splice(idx, 1);

        var value = (enemy.tile == TILE_WARPIG) ? 100 : 250;

        player.score += value;
        notice("You killed the " + name);
    } else {
        notice("You cause " + damage + " damage to the " + name);
    }
}

function getMonsterAt(x, y) {
    for (var i = 0; i < monsters.length; i++) {
        var monster = monsters[i];
        if (monster.x === x && monster.y === y) return monster;
    }
    return null;
}

function attackPlayer(name, damage) {
    player.health -= damage;

    if (player.health <= 0){
        player.alive = false;
    }

    notice("The " + name + " causes " + damage + " damage to you");
}

function toggleInventory() {
    inventoryMode = !inventoryMode;
    if (inventoryMode) {
        inventoryLine = 0;
    }
}

function toggleSpellbook() {
    spellbookMode = !spellbookMode;
    if (spellbookMode) {
        inventoryLine = 0;
    }
}

function useItem() {
    var i = 0;

    for (var key in player.items) {
        if (i == inventoryLine) {
            var line = player.items[key];

            var used = false;

            switch (line.tile) {
                case TILE_GOLD:
                    notice("You cannot spend gold here");
                    break;

                case TILE_HEALING_POTION:
                    notice("You feel a warm sensation");
                    notice("Used healing potion");
                    player.health += 3;
                    used = true;
                    if (player.health > player.stamina) {
                        player.health = player.stamina;
                    }
                    break;

                case TILE_KEY:
                    notice("I cannot see any locks")
                    break;

                case TILE_STAMINA_POTION:
                    notice("You feel much stronger");
                    player.stamina += 3;
                    player.health += 3;
                    if (player.health > player.stamina) {
                        player.health = player.stamina;
                    }
                    break;

                case TILE_MANA_POTION:
                    player.mana += 7;
                    notice("You increase your mana");
                    used = true;
                    break;
            }

            if (used) {
                line.amount--;
                if (line.amount == 0) {
                    delete player.items[key];
                }
            }

            inventoryMode = false;
            break;
        }
        i++;
    }
}


function castSpell(idx) {
    if (player.spells.length === 0) return;

    var spell = player.spells[idx];

    var enoughMana = true;
    var required = 0;

    if ("Energizer" == spell.name) {
        required = 30;

        enoughMana = player.mana >= required;
        if (enoughMana) {
            notice("You feel refreshed");
            player.health = player.stamina;
            player.mana -= required;
        }

    } else {
        required = 10;

        enoughMana = player.mana >= required;
        if (enoughMana) {
            notice("You materialize a fireball");
            shoot();
            player.mana -= required;
        }
    }

    if (!enoughMana) {
        notice("Spell requires " + required + " mana");
    }

    spellbookMode = false;
}

function startGame() {
    img = preloader.get("rogue.png");
    fontImg = preloader.get("BBCMode1.png");
    var fontImg2 = preloader.get("BBCMode1-yellow.png");

    tileset = new TileSet(img, 16, 16);
    font = new BitmapFont(fontImg, 16, 16, fontImg2);

    restart();
    update();
    repaint();

    window.addEventListener("keyup", function (e) {

        switch (e.keyCode) {
            case 114:
            case KEY_R:
                restart();
                update();
                break;
            case KEY_M:
                toggleMap();
                break;
            case KEY_I:
                toggleInventory();
                break;
            case KEY_S:
                toggleSpellbook();
                break;

            case KEY_ESC:
                inventoryMode = false;
                mapMode = false;
                break;
        }

        if (!player.alive) return;

        if (inventoryMode) {
            switch (e.keyCode) {
                case KEY_UP:
                    if (inventoryLine > 0) {
                        inventoryLine--;
                    }

                    break;
                case KEY_DOWN:
                    if (inventoryLine < player.itemCount - 1) {
                        inventoryLine++;
                    }

                    break;
                case KEY_U:
                case KEY_ENTER:
                    useItem(inventoryLine);

                    break;
            }
        } else if (spellbookMode) {
            switch (e.keyCode) {
                case KEY_UP:
                    if (inventoryLine > 0) {
                        inventoryLine--;
                    }

                    break;
                case KEY_DOWN:
                    if (inventoryLine < player.spells.length - 1) {
                        inventoryLine++;
                    }

                    break;

                case KEY_U:
                case KEY_ENTER:
                    castSpell(inventoryLine);
                    break;
            }
        } else {
            flushQueue();

            switch (e.keyCode) {
                case KEY_LEFT:
                    if (isWalkableTile(player, -1, 0)) {
                        var creature = getMonsterAt(player.x -1, player.y);
                        if (creature) {
                            attack(creature);
                        } else {
                            player.x -= 1;
                        }
                    } else {
                        notice("A wall blocks the way");
                    }
                    update();
                    break;
                case KEY_RIGHT:
                    if (isWalkableTile(player, 1, 0)) {
                        var creature = getMonsterAt(player.x + 1, player.y);
                        if (creature) {
                            attack(creature);
                        } else {
                            player.x += 1;
                        }
                    } else {
                        notice("A wall blocks the way");
                    }
                    update();
                    break;
                case KEY_UP:
                    if (isWalkableTile(player, 0, -1)) {
                        var creature = getMonsterAt(player.x, player.y - 1);
                        if (creature) {
                            attack(creature);
                        } else {
                            player.y -= 1;
                        }
                    } else {
                        notice("A wall blocks the way");
                    }
                    update();
                    break;
                case KEY_DOWN:
                    if (isWalkableTile(player, 0, 1)) {
                        var creature = getMonsterAt(player.x, player.y + 1);
                        if (creature) {
                            attack(creature);
                        } else {
                            player.y += 1;
                        }
                    } else {
                        notice("A wall blocks the way");
                    }
                    update();
                    break;
//                case KEY_A:
//                    shoot();
//                    update();
//                    break;
            }

        }

        repaint();
    }, false);
}


