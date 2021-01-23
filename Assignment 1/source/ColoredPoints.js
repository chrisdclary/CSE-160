// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE = 'attribute vec4 a_Position;\n' + 
'uniform float u_Size;\n' +
'void main() {\n' + 
'  gl_Position = a_Position;\n' + 
'  gl_PointSize = u_Size;\n' + 
'}\n';

// Fragment shader program
var FSHADER_SOURCE = 'precision mediump float;\n' + 'uniform vec4 u_FragColor;\n' + // uniform変数
'void main() {\n' + '  gl_FragColor = u_FragColor;\n' + '}\n';

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

let selectedSize = 5;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    // Get location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
}

rval = 1;
gval = 1;
bval = 1;

function parseUI() {
    document.getElementById("redSlider").addEventListener('mouseup', function() {rval = this.value/255; });
    document.getElementById("greenSlider").addEventListener('mouseup', function() {gval = this.value/255; });
    document.getElementById("blueSlider").addEventListener('mouseup', function() {bval = this.value/255; });

    document.getElementById("sizeSlider").addEventListener('mouseup', function() {selectedSize = this.value; });
}

function clearCanvas(){
    gl.clear(gl.COLOR_BUFFER_BIT);

    g_shapesList = [];
}

function main() {
    
    // Set up canvas and gl variable
    setupWebGL();

    // Set up GLSL shader and connect variables to GLSL
    connectVariablesToGLSL();

    // Set up UI event listeners
    parseUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;

    canvas.onmousemove = function(ev) {if (ev.buttons == 1) { click(ev) } };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];


function click(ev) {

    [x,y] = convertCoordinatesEventToGL(ev);

    let point = new Triangle();
    point.position = [x,y];
    point.color = [rval, gval, bval, 1.0];
    point.size = selectedSize;
    g_shapesList.push(point);
     
    renderAllShapes();

}

function convertCoordinatesEventToGL(ev){
    var x = ev.clientX;
    // x coordinate of a mouse pointer
    var y = ev.clientY;
    // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return ([x,y]);
}

function renderAllShapes(){
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapesList.length;
    for (var i = 0; i < len; i++) {
        var xy = g_shapesList[i].position;
        var rgba = g_shapesList[i].color;
        var size = g_shapesList[i].size;

        // Pass the position of a point to a_Position variable
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // 
        gl.uniform1f(u_Size, size);
        // Draw
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}