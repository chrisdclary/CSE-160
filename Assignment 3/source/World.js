// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE = `
precision mediump float;
attribute vec4 a_Position;
attribute vec2 a_UV;
attribute vec3 a_Normal;
varying vec2 v_UV;
varying vec3 v_Normal;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
void main() {
	gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
}`
// gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;

// Fragment shader program
var FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
varying vec3 v_Normal;
uniform vec4 u_FragColor;
uniform sampler2D u_Sampler0;
uniform int u_whichTexture;
void main() {

    if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor;

    } else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0);

    } else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV);

    } else {
        gl_FragColor = vec4(1, .2, .2, 1);
    }
}`



let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix = 0;
let u_Sampler0;
let u_whichTexture;

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

    gl.enable(gl.DEPTH_TEST);
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

    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
    	console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
    	console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    // Get the storage location of u_Sampler0
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return false;
    }

    // Get the storage location of u_whichTexture
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return false;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }


    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

rval = 1;
gval = 1;
bval = 1;

//Global Camera Angle
g_globalAngleY = 0;
g_globalAngleX = 0;


// scale of the scene
modelSize = .8;


// For Camera Control
startX = 0;
startY = 0;
startAngleX = 0;
startAngleY = 0;
diffX = 0;
diffY = 0;


function parseUI() {
	// No UI to parse :(
}

function initTextures() {
  
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ sendTextureToGLSL(image); };
  // Tell the browser to load an image
  image.src = 'background.jpg';

  return true;
}

function sendTextureToGLSL(image) {

  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);
  
}

function main() {
    
    // Set up canvas and gl variable
    setupWebGL();

    // Set up GLSL shader and connect variables to GLSL
    connectVariablesToGLSL();

    // Set up UI event listeners
    parseUI();

    //Initialize textures
    initTextures();

    document.onkeydown = keydown;

    // Register function (event handler) to be called on a mouse press
    //canvas.onmousedown = click;

    //canvas.onmousemove = function(ev) {if (ev.buttons == 1) { hold(ev) } };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, .8, .9, 1.0);

    //Render
    requestAnimationFrame(tick);
}

function click(ev){

	startX = ev.clientX;
	startY = ev.clientY;

	startAngleX = g_globalAngleX;
	startAngleY = g_globalAngleY;

}


function hold(ev) {

	diffX = ev.clientX - startX;
	diffY = ev.clientY - startY;

    //[x,y] = convertCoordinatesEventToGL(ev);

    var x = diffX+(canvas.width / 2);
    // x coordinate of a mouse pointer
    var y = diffY+(canvas.height / 2);
    // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    g_globalAngleX = startAngleX + (y*90);
    g_globalAngleY = startAngleY + (x*90);


    renderAllShapes();

}

var g_startTime = performance.now()/500;
var g_seconds = performance.now()/500-g_startTime;

function tick(){
	g_seconds = performance.now()/500-g_startTime;
	//console.log(performance.now());

	renderAllShapes();

	requestAnimationFrame(tick);
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

function keydown(ev) {
    if (ev.keyCode == 87){ // W
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        v3.normalize();
        v3.mul(.3);
        eyeVec.add(v3);
        atVec.add(v3);
    }
    if (ev.keyCode == 65){ // A
        var upVec = new Vector3();
        upVec.elements[1] = 1;
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        v3.normalize();

        var moveVec = Vector3.cross(v3, upVec);

        sendTextToHTML("upVec x: "+upVec.elements[0] + " y: "+upVec.elements[1]+ " z: "+upVec.elements[2], "extraInfo");

        moveVec.mul(0.3);
        eyeVec.sub(moveVec);
        atVec.sub(moveVec);
        
    }
    if (ev.keyCode == 83){ // S
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        v3.normalize();
        v3.mul(.3);
        eyeVec.sub(v3);
        atVec.sub(v3);
    }
    if (ev.keyCode == 68){ // D
        var upVec = new Vector3();
        upVec.elements[1] = 1;
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        v3.normalize();

        var moveVec = Vector3.cross(v3, upVec);

        //sendTextToHTML("upVec x: "+upVec.elements[0] + " y: "+upVec.elements[1]+ " z: "+upVec.elements[2], "extraInfo");

        moveVec.mul(0.3);
        eyeVec.add(moveVec);
        atVec.add(moveVec);
    }
    if (ev.keyCode == 81){ // Q
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        var r = Math.sqrt(Math.pow(v3.elements[0], 2) + Math.pow(v3.elements[2], 2));
        var viewAngle = Math.atan2(v3.elements[2],v3.elements[0]);
        viewAngle -= 0.05;
        v3.elements[0] = r*Math.cos(viewAngle);
        v3.elements[2] = r*Math.sin(viewAngle);

        v3.add(eyeVec);
        atVec.set(v3);
    }
    if (ev.keyCode == 69){ // E
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        var r = Math.sqrt(Math.pow(v3.elements[0], 2) + Math.pow(v3.elements[2], 2));
        var viewAngle = Math.atan2(v3.elements[2],v3.elements[0]);
        viewAngle += 0.05;
        v3.elements[0] = r*Math.cos(viewAngle);
        v3.elements[2] = r*Math.sin(viewAngle);

        v3.add(eyeVec);
        atVec.set(v3);
        //sendTextToHTML("r: "+r, "extraInfo");
    }
    if (ev.keyCode == 32){ // Space
        atVec.elements[1]+=.3;
        eyeVec.elements[1]+=.3;
    }
    if (ev.keyCode == 16){ // Shift
        atVec.elements[1]-=.3;
        eyeVec.elements[1]-=.3;
    }

    //sendTextToHTML("x: "+atVec.elements[0] + " y: "+atVec.elements[1]+ " z: "+atVec.elements[2], "atVecInfo");
    //sendTextToHTML("x: "+eyeVec.elements[0] + " y: "+eyeVec.elements[1]+ " z: "+eyeVec.elements[2], "eyeVecInfo");
    renderAllShapes();
}

var eyeVec = new Vector3([0,3,3]);
var atVec = new Vector3([0,3,-1]);

var g_map=[
[3,3,3,2,2,1,0,0,0,0,0,0,0,0,0,3],
[3,3,2,2,1,0,0,0,0,0,0,0,0,0,0,0],
[2,2,2,1,0,0,0,0,1,0,1,1,0,1,0,1],
[2,2,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
[2,1,1,0,0,0,0,0,0,1,0,1,1,0,0,0],
[2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
[1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
[1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
[0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[5,5,0,2,2,0,0,0,1,1,1,1,1,1,0,1],
[5,5,0,2,2,0,0,0,1,1,1,1,1,1,0,1],
[5,5,0,2,2,0,0,0,1,1,1,1,1,1,0,1],
];


function drawMap(){
    for (x=0;x<15;x++){
        for (y=0;y<15;y++){
            var blockHeight = g_map[x][y];
            if (blockHeight>0){
                for(z=0;z<blockHeight;z++){
                    var block = new Cube();
                    block.color = [1,1,1,1];
                    block.textureNum = -1;
                    block.matrix.translate(4*x-32, -.05+4*z, 4*y-32);
                    block.matrix.scale(4,4,4);
                    block.render();
                }
            }
        }
    }
}



function renderAllShapes(){

	var globalRotMat = new Matrix4().rotate(g_globalAngleY,0,1,0);

    //Pass the projection matrix
    var projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width/canvas.height, .1, 120);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    //Pass the view matrix
    var viewMat = new Matrix4();
    viewMat.setLookAt(eyeVec.elements[0], eyeVec.elements[1], eyeVec.elements[2], atVec.elements[0], atVec.elements[1], atVec.elements[2], 0,1,0); // eye, at, up
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

	globalRotMat.rotate(g_globalAngleX,1,0,0);
	gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


/**********************************************/
//					skybox
/**********************************************/



    //Draw the skybox
    var skybox = new Cube();
    skybox.color = [1.0,1.0,0.0,1.0];
    skybox.textureNum = 0;
    skybox.matrix.translate(modelSize*-48, modelSize*-.25, modelSize*-48);
    skybox.matrix.scale(modelSize*96, modelSize*96, modelSize*96);
    skybox.render();

    // Ground Plane
    var ground = new Cube();
    ground.color = [1,0,1,1];
    ground.matrix.translate(modelSize*-48, modelSize*0, modelSize*-48);
    ground.matrix.scale(modelSize*96, modelSize*0.01, modelSize*96);
    ground.render();

    drawMap();

}

function sendTextToHTML(text, htmlID){
	var htmlElm = document.getElementById(htmlID);
	if(!htmlElm){
		console.log("Failed to get "+ htmlID +" from HTML");
		return;
	}
	htmlElm.innerHTML = text;
}
