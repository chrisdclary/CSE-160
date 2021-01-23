// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE = `
precision mediump float;
attribute vec4 a_Position;
attribute vec2 a_UV;
attribute vec3 a_Normal;
varying vec2 v_UV;
varying vec3 v_Normal;
varying vec4 v_VertPos;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
void main() {
	gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
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
uniform vec3 u_lightPos;
uniform vec3 u_cameraPos;
varying vec4 v_VertPos;
uniform bool u_lightOn;
void main() {

    if(u_whichTexture == -3) {
        gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    }

    else if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor;

    } else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0);

    } else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV);

    } else {
        gl_FragColor = vec4(1, .2, .2, 1);
    }
    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r=length(lightVector);
    
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    vec3 R = reflect(-L, N);

    vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

    float specular = pow(max(dot(E,R), 0.0), 90.0);

    vec3 diffuse = vec3(gl_FragColor) * nDotL *0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.3;

    if(u_lightOn) {
        gl_FragColor= vec4(specular+diffuse+ambient, 1);
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
let u_lightOn;

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

    // Get the storage location of a_Normal
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_lightPos
    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
        console.log('Failed to get the storage location of u_lightPos');
        return;
    }

    // Get the storage location of u_lightOn
    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
        console.log('Failed to get the storage location of u_lightOn');
        return;
    }

    // Get the storage location of u_cameraPos
    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
        console.log('Failed to get the storage location of u_cameraPos');
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




// For Camera Control
startX = 0;
startY = 0;
startAngleX = 0;
startAngleY = 0;
diffX = 0;
diffY = 0;

g_normals = false;
g_lightPos = [0,3.2,-2];
g_lightOn = true;


function parseUI() {
    document.getElementById('toggleNormal').onclick=function() {if(g_normals){g_normals = false;} else{g_normals = true;}};
    document.getElementById('toggleLighting').onclick=function() {if(g_lightOn){g_lightOn = false;} else{g_lightOn = true;}};
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
  image.src = 'floor.jpg';

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

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, .8, .9, 1.0);

    //Render
    requestAnimationFrame(tick);
}


var g_startTime = performance.now()/500;
var g_seconds = performance.now()/500-g_startTime;

function tick(){
	g_seconds = performance.now()/500-g_startTime;
	//console.log(performance.now());

    g_lightPos[0] = Math.cos(g_seconds/2);
    g_lightPos[1] = 2.5 + Math.cos(g_seconds/2)/2;
    g_lightPos[2] = Math.sin(g_seconds/2);

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
        v3.mul(.2);
        eyeVec.add(v3);
        atVec.add(v3);
    }
    else if (ev.keyCode == 65){ // A
        var upVec = new Vector3();
        upVec.elements[1] = 1;
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        v3.normalize();

        var moveVec = Vector3.cross(v3, upVec);

        moveVec.mul(0.2);
        eyeVec.sub(moveVec);
        atVec.sub(moveVec);
        
    }
    else if (ev.keyCode == 83){ // S
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        v3.normalize();
        v3.mul(.2);
        eyeVec.sub(v3);
        atVec.sub(v3);
    }
    else if (ev.keyCode == 68){ // D
        var upVec = new Vector3();
        upVec.elements[1] = 1;
        var v3 = new Vector3();
        v3.set(atVec);
        v3.sub(eyeVec);
        v3.normalize();

        var moveVec = Vector3.cross(v3, upVec);

        moveVec.mul(0.2);
        eyeVec.add(moveVec);
        atVec.add(moveVec);
    }
    else if (ev.keyCode == 81){ // Q
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
    else if (ev.keyCode == 69){ // E
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
    }
    else if (ev.keyCode == 32){ // Space
        atVec.elements[1]+=.2;
        eyeVec.elements[1]+=.2;
    }
    else if (ev.keyCode == 16){ // Shift
        atVec.elements[1]-=.2;
        eyeVec.elements[1]-=.2;
    }
    else if (ev.keyCode == 82){ // R
        eyeVec = new Vector3([0,1,1.9]);
        atVec = new Vector3([0,1,-1]);
    }

    renderAllShapes();
}

var eyeVec = new Vector3([0,1,1.9]);
var atVec = new Vector3([0,1,-1]);


function renderAllShapes(){

	var globalRotMat = new Matrix4().rotate(g_globalAngleY,0,1,0);

    //Pass the projection matrix
    var projMat = new Matrix4();
    projMat.setPerspective(80, canvas.width/canvas.height, .1, 120);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    //Pass the view matrix
    var viewMat = new Matrix4();
    viewMat.setLookAt(eyeVec.elements[0], eyeVec.elements[1], eyeVec.elements[2], atVec.elements[0], atVec.elements[1], atVec.elements[2], 0,1,0); // eye, at, up
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

	globalRotMat.rotate(g_globalAngleX,1,0,0);
	gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Pass variables for lighting
    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    gl.uniform3f(u_cameraPos, eyeVec.elements[0], eyeVec.elements[1], eyeVec.elements[2]);
    gl.uniform1i(u_lightOn, g_lightOn);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


/**********************************************/
//					skybox
/**********************************************/



    //Draw the skybox
    var skybox = new Cube();
    skybox.color = [.87,.776,.157,1.0];
    if(g_normals)
        skybox.textureNum = -3;
    skybox.matrix.scale(-4, -4, -4);
    skybox.matrix.translate(-.5, -1, -.5);
    skybox.render();

    // Ground Plane
    var ground = new Cube();
    ground.color = [1,0,1,1];
    ground.textureNum = 0;
    ground.matrix.scale(4, 0.01, 4);
    ground.matrix.translate(-.5, 0, -.5);
    ground.render();

    //Test Cube
    var testcube = new Cube();
    testcube.color = [0,0.5,1,1];
    if(g_normals)
        testcube.textureNum = -3;
    testcube.matrix.scale(.5, .5, .5);
    testcube.matrix.translate(.5, 4, -3);
    testcube.render();

    //Test Sphere
    var testsphere = new Sphere();
    testsphere.color = [1,0,1,1];
    if(g_normals)
        testsphere.textureNum = -3;
    testsphere.matrix.scale(.5, .5, .5);
    testsphere.matrix.translate(-2, 1, -2);
    testsphere.render();

    //Light
    if(g_lightOn){
        var light = new Cube();
        light.color= [2,2,0,1];
        light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
        light.matrix.scale(.1,.1,.1);
        light.render();
    }


    // Draw Spongebob
/**********************************************/
//                  Body
/**********************************************/



    //Draw the body
    var body = new Cube();
    body.color = [1.0,1.0,0.0,1.0];
    body.matrix.translate(1, .6, 0);
    //body.matrix.rotate(180,0,1,0);
    body.matrix.scale(.5,.5,.5);
    var bodyCoordinateMat = new Matrix4(body.matrix);
    body.matrix.scale(1, .9, .3);
    body.render();

    //Nose
    var nose = new Cube();
    nose.color = [1.0,1.0,0.0,1.0];
    nose.matrix = new Matrix4(bodyCoordinateMat);
    nose.matrix.translate(.45, .35, 0.28);
    nose.matrix.scale(.1, .1, .3);
    nose.render();

    //Upper Pants
    var upperPants = new Cube();
    upperPants.matrix = new Matrix4(bodyCoordinateMat);
    upperPants.color = [1,1,1,1.0];
    upperPants.matrix.translate(0, -.12, 0.0);
    var upperPantsMat = new Matrix4(upperPants.matrix);
    upperPants.matrix.scale(1, .12, .3);
    upperPants.render();

    //Lower Pants
    var lowerPants = new Cube();
    lowerPants.color = [0.65,0.33,0.0,1.0];
    lowerPants.matrix = new Matrix4(bodyCoordinateMat);
    lowerPants.matrix.translate(0, -.30, 0.0);
    var lowerPantsMat = new Matrix4(lowerPants.matrix);
    lowerPants.matrix.scale(1, .18, .3);
    lowerPants.render();


    // Tie
    var tie = new Cube();
    tie.color = [1,0,0,1.0];
    tie.matrix = new Matrix4(upperPantsMat);
    tie.matrix.translate(0.5, 0.1, .3);
    tie.matrix.rotate(225,0,0,1);
    tie.matrix.scale(0.17, .17, .01);
    tie.render();



/**********************************************/
//                  Left Arm
/**********************************************/

    //Left Shoulder
    var leftShoulder = new Cube();
    leftShoulder.color = [1,1,1,1];
    leftShoulder.matrix = new Matrix4(bodyCoordinateMat);
    leftShoulder.matrix.translate(0.98, 0.1, 0.08);
    // leftShoulder.matrix.rotate(180, 1, 0, 0);
    

    //save location and rotation
    var leftShoulderCoordinateMat = new Matrix4(leftShoulder.matrix);
    leftShoulder.matrix.scale(0.13, .13, .13);
    leftShoulder.render();


    //Upper Left Arm
    var leftUpperArm = new Cube();
    leftUpperArm.color = [1,1,0,1];
    leftUpperArm.matrix = new Matrix4(leftShoulderCoordinateMat);
    leftUpperArm.matrix.translate(.01,-.3,.01);

    //save the location and rotation
    var leftUpperArmCoordinateMat = new Matrix4(leftUpperArm.matrix);
    leftUpperArm.matrix.scale(.1, .3, .1);
    leftUpperArm.render();


    //Lower Left Arm
    var leftLowerArm = new Cube();
    leftLowerArm.color = [1,1,0,1];
    leftLowerArm.matrix = new Matrix4(leftUpperArmCoordinateMat);
    leftLowerArm.matrix.translate(0,-.3,0);
    leftLowerArm.matrix.scale(.1, .3, .1);
    leftLowerArm.render();


/**********************************************/
//                  right Arm
/**********************************************/

    //right Shoulder
    var rightShoulder = new Cube();
    rightShoulder.color = [1,1,1,1];
    rightShoulder.matrix = new Matrix4(bodyCoordinateMat);
    rightShoulder.matrix.translate(-.10, 0.1, 0.08);

    //save location and rotation
    var rightShoulderCoordinateMat = new Matrix4(rightShoulder.matrix);
    rightShoulder.matrix.scale(0.13, .13, .13);
    rightShoulder.render();


    //Upper right Arm
    var rightUpperArm = new Cube();
    rightUpperArm.color = [1,1,0,1];
    rightUpperArm.matrix = new Matrix4(rightShoulderCoordinateMat);
    rightUpperArm.matrix.translate(.01,-.3,.01);

    //save the location and rotation
    var rightUpperArmCoordinateMat = new Matrix4(rightUpperArm.matrix);
    rightUpperArm.matrix.scale(.1, .3, .1);
    rightUpperArm.render();


    //Lower right Arm
    var rightLowerArm = new Cube();
    rightLowerArm.color = [1,1,0,1];
    rightLowerArm.matrix = new Matrix4(rightUpperArmCoordinateMat);
    rightLowerArm.matrix.translate(0,-.3,0);
    rightLowerArm.matrix.scale(.1, .3, .1);
    rightLowerArm.render();



/**********************************************/
//                  Left Leg
/**********************************************/


    //Left Leg
    var leftLeg = new Cube();
    leftLeg.color = [.6, .3, 0, 1];
    leftLeg.matrix = new Matrix4(lowerPantsMat);
    leftLeg.matrix.translate(.73,-.18,.08);
    //leftLeg.matrix.rotate(180,1,0,0);

    var leftLegCoordinateMat = new Matrix4(leftLeg.matrix);
    
    leftLeg.matrix.scale(.15,.25,.15);
    leftLeg.render();



    //Upper Left Leg
    var leftUpperLeg = new Cube();
    leftUpperLeg.color = [1,1,0,1];
    leftUpperLeg.matrix = new Matrix4(leftLegCoordinateMat);
    leftUpperLeg.matrix.translate(0.025,-.25,.025);

    var leftUpperLegCoordinateMat = new Matrix4(leftUpperLeg.matrix);
    leftUpperLeg.matrix.scale(0.1,0.45, .1);
    leftUpperLeg.render();

    //Lower Left Leg
    var leftLowerLeg = new Cube();
    leftLowerLeg.color = [1,1,0,1];
    leftLowerLeg.matrix = new Matrix4(leftUpperLegCoordinateMat);
    leftLowerLeg.matrix.translate(0,-.35,0);
    var leftLowerLegCoordinateMat = new Matrix4(leftLowerLeg.matrix);

    leftLowerLeg.matrix.scale(0.1,0.35,.1);
    leftLowerLeg.render();

    //Left Sock 
    var leftSock = new Cube();
    leftSock.color = [1,1,1,1];
    leftSock.matrix = new Matrix4(leftLowerLegCoordinateMat);
    leftSock.matrix.translate(-0.002,0,-0.002);
    leftSock.matrix.scale(0.104,0.3, .104);
    leftSock.render();


    //Left Shoe
    var leftShoe = new Cube();
    leftShoe.color = [0.1,0.1,0.1,1];
    leftShoe.matrix = new Matrix4(leftLowerLegCoordinateMat);
    leftShoe.matrix.translate(-0.02,0,-0.02);
    leftShoe.matrix.scale(0.15,0.15, .3);
    leftShoe.render();


/**********************************************/
//                  right Leg
/**********************************************/


    //right Leg
    var rightLeg = new Cube();
    rightLeg.color = [.6, .3, 0, 1];
    rightLeg.matrix = new Matrix4(lowerPantsMat);
    rightLeg.matrix.translate(.12,-.18,.08);

    var rightLegCoordinateMat = new Matrix4(rightLeg.matrix);
    
    rightLeg.matrix.scale(.15,.25,.15);
    rightLeg.render();



    //Upper right Leg
    var rightUpperLeg = new Cube();
    rightUpperLeg.color = [1,1,0,1];
    rightUpperLeg.matrix = new Matrix4(rightLegCoordinateMat);
    rightUpperLeg.matrix.translate(0.025,-0.25,.025);

    var rightUpperLegCoordinateMat = new Matrix4(rightUpperLeg.matrix);
    rightUpperLeg.matrix.scale(0.1,0.45, .1);
    rightUpperLeg.render();

    //Lower right Leg
    var rightLowerLeg = new Cube();
    rightLowerLeg.color = [1,1,0,1];
    rightLowerLeg.matrix = new Matrix4(rightUpperLegCoordinateMat);
    rightLowerLeg.matrix.translate(0,-.35,0);

    var rightLowerLegCoordinateMat = new Matrix4(rightLowerLeg.matrix);

    rightLowerLeg.matrix.scale(0.1,0.35,.1);
    rightLowerLeg.render();

    //right Sock 
    var rightSock = new Cube();
    rightSock.color = [1,1,1,1];
    rightSock.matrix = new Matrix4(rightLowerLegCoordinateMat);
    rightSock.matrix.translate(-0.002,0,-0.002);
    rightSock.matrix.scale(0.104,0.3, .104);
    rightSock.render();

    //right Shoe
    var rightShoe = new Cube();
    rightShoe.color = [0.1,0.1,0.1,1];
    rightShoe.matrix = new Matrix4(rightLowerLegCoordinateMat);
    rightShoe.matrix.translate(-0.02,0,-.02);
    rightShoe.matrix.scale(0.15,0.15, .3);
    rightShoe.render();

}

function sendTextToHTML(text, htmlID){
	var htmlElm = document.getElementById(htmlID);
	if(!htmlElm){
		console.log("Failed to get "+ htmlID +" from HTML");
		return;
	}
	htmlElm.innerHTML = text;
}
