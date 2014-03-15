/**
 * Engine
 */

var canvas = document.createElement("canvas");
canvas.width = 640;
canvas.height = 480;

var wrapper = document.getElementById("game-wrapper");
wrapper.appendChild(canvas);

var ctx = canvas.getContext("2d");
ctx.fillStyle = "#000";
ctx.fillRect(0, 0, 640, 480);
ctx.mozImageSmoothingEnabled = false;

