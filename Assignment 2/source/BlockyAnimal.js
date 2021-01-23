// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
void main() {
	gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
}`


// Fragment shader program
var FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main() {
	gl_FragColor = u_FragColor;
}`



let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix = 0;

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
    /*
    // Get location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }*/

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

// Rotation Variables for limbs
leftLegRotation = 180;
rightLegRotation = 180;
leftLowerLegRotation = 0;
rightLowerLegRotation = 0;
leftShoulderZRotation = 175;
rightShoulderZRotation = -175;
leftShoulderXRotation = 0;
rightShoulderXRotation = 0;
leftArmRotation = 0;
rightArmRotation = 0;


// For Camera Control
startX = 0;
startY = 0;
startAngleX = 0;
startAngleY = 0;
diffX = 0;
diffY = 0;

animation = false;

animationSpeed = 500;



function parseUI() {
	document.getElementById("zoom").addEventListener('mousemove', function() {modelSize = this.value/100; renderAllShapes(); });
    document.getElementById("leftLeg").addEventListener('mousemove', function() {leftLegRotation = this.value; renderAllShapes(); });
    document.getElementById("rightLeg").addEventListener('mousemove', function() {rightLegRotation = this.value; renderAllShapes(); });
    document.getElementById("leftLowerLeg").addEventListener('mousemove', function() {leftLowerLegRotation = this.value; renderAllShapes(); });
    document.getElementById("rightLowerLeg").addEventListener('mousemove', function() {rightLowerLegRotation = this.value; renderAllShapes(); });
    document.getElementById("leftShoulderX").addEventListener('mousemove', function() {leftShoulderXRotation = this.value; renderAllShapes(); });
    document.getElementById("rightShoulderX").addEventListener('mousemove', function() {rightShoulderXRotation = this.value; renderAllShapes(); });
    document.getElementById("leftArm").addEventListener('mousemove', function() {leftArmRotation = this.value; renderAllShapes(); });
    document.getElementById("rightArm").addEventListener('mousemove', function() {rightArmRotation = this.value; renderAllShapes(); });


    //document.getElementById("animationSpeed").addEventListener('mousemove', function() {animationSpeed = 1000/(this.value/10); });
    //document.getElementById("angleSliderX").addEventListener('mousemove', function() {g_globalAngleX = - this.value; renderAllShapes(); });

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

    canvas.onmousemove = function(ev) {if (ev.buttons == 1) { hold(ev) } };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, .8, .9, 1.0);

    // Clear <canvas>
    //gl.clear(gl.COLOR_BUFFER_BIT);

    //Render
    requestAnimationFrame(tick);
}

var g_shapesList = [];

function click(ev){

	//[x,y] = convertCoordinatesEventToGL(ev);

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
    g_globalAngleY = startAngleY + (-x*90);


    renderAllShapes();

}

function setPoseDefault(){

	leftLegRotation = 180;
	rightLegRotation = 180;
	leftLowerLegRotation = 0;
	rightLowerLegRotation = 0;
	leftShoulderZRotation = 175;
	rightShoulderZRotation = -175;
	leftShoulderXRotation = 0;
	rightShoulderXRotation = 0;
	leftArmRotation = 0;
	rightArmRotation = 0;

    setSliders();

    animation = false;

	renderAllShapes();
}



//Set sliders to current values
function setSliders(){
	document.getElementById("leftLeg").value = leftLegRotation;
    document.getElementById("rightLeg").value = rightLegRotation;
    document.getElementById("leftLowerLeg").value = leftLowerLegRotation;
    document.getElementById("rightLowerLeg").value = rightLowerLegRotation;
    document.getElementById("leftShoulderX").value = leftShoulderXRotation;
    document.getElementById("rightShoulderX").value = rightShoulderXRotation;
    document.getElementById("leftArm").value = leftArmRotation;
    document.getElementById("rightArm").value = rightArmRotation;
}

var g_startTime = performance.now()/animationSpeed;
var g_seconds = performance.now()/animationSpeed-g_startTime;

function tick(){
	g_seconds = performance.now()/animationSpeed-g_startTime;
	console.log(performance.now());

	renderAllShapes();

	requestAnimationFrame(tick);
}

function toggleAnimation(){
	if(animation){
		animation = false;
		setSliders();
	}
	else
		animation = true;
}

function updateAnimationAngles(){
	if(animation){
		leftLegRotation = 200+(-50*Math.sin(g_seconds));
		rightLegRotation = 200+(50*Math.sin(g_seconds));
		leftLowerLegRotation = 89;
		rightLowerLegRotation = 89;
		leftShoulderXRotation = 70*Math.sin(g_seconds);
		rightShoulderXRotation = -70*Math.sin(g_seconds);
		leftArmRotation = 89;
		rightArmRotation = 89;
	}
}

function setAnimSlow(){
	animationSpeed = 1000
}
function setAnimNorm(){
	animationSpeed = 500
}
function setAnimFast(){
	animationSpeed = 200
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

	var globalRotMat = new Matrix4().rotate(g_globalAngleY,0,1,0);
	globalRotMat.rotate(g_globalAngleX,1,0,0);
	gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateAnimationAngles();


// Draw Spongebob
/**********************************************/
//					Body
/**********************************************/



    //Draw the body
    var body = new Cube();
    body.color = [1.0,1.0,0.0,1.0];
    body.matrix.translate(modelSize*-.5, modelSize*-.05, modelSize*0.0);
    var bodyCoordinateMat = new Matrix4(body.matrix);
    body.matrix.scale(modelSize*1, modelSize*.9, modelSize*.3);
    body.render();

    //Nose
    var nose = new Cube();
    nose.color = [1.0,1.0,0.0,1.0];
    nose.matrix = new Matrix4(bodyCoordinateMat);
    nose.matrix.translate(modelSize*.45, modelSize*.35, modelSize*-0.3);
    nose.matrix.scale(modelSize*.1, modelSize*.1, modelSize*.3);
    nose.render();

    //Upper Pants
    var upperPants = new Cube();
    upperPants.matrix = new Matrix4(bodyCoordinateMat);
    upperPants.color = [1,1,1,1.0];
    upperPants.matrix.translate(modelSize*0, modelSize*-.12, modelSize*0.0);
    var upperPantsMat = new Matrix4(upperPants.matrix);
    upperPants.matrix.scale(modelSize*1, modelSize*.12, modelSize*.3);
    upperPants.render();

    //Lower Pants
    var lowerPants = new Cube();
    lowerPants.color = [0.65,0.33,0.0,1.0];
    lowerPants.matrix = new Matrix4(bodyCoordinateMat);
    lowerPants.matrix.translate(modelSize*0, modelSize*-.30, modelSize*0.0);
    var lowerPantsMat = new Matrix4(lowerPants.matrix);
    lowerPants.matrix.scale(modelSize*1, modelSize*.18, modelSize*.3);
    lowerPants.render();

    // Belt Pieces
    var belt1 = new Cube();
    belt1.color = [0,0,0,1.0];
    belt1.matrix = new Matrix4(lowerPantsMat);
    belt1.matrix.translate(modelSize*.07, modelSize*.095, modelSize*-0.002);
    belt1.matrix.scale(modelSize*.17, modelSize*.05, modelSize*.304);
    belt1.render();

    var belt2 = new Cube();
    belt2.color = [0,0,0,1.0];
    belt2.matrix = new Matrix4(lowerPantsMat);
    belt2.matrix.translate(modelSize*.3, modelSize*.095, modelSize*-0.002);
    belt2.matrix.scale(modelSize*.17, modelSize*.05, modelSize*.304);
    belt2.render();

    var belt3 = new Cube();
    belt3.color = [0,0,0,1.0];
    belt3.matrix = new Matrix4(lowerPantsMat);
    belt3.matrix.translate(modelSize*.53, modelSize*.095, modelSize*-0.002);
    belt3.matrix.scale(modelSize*.17, modelSize*.05, modelSize*.304);
    belt3.render();

    var belt4 = new Cube();
    belt4.color = [0,0,0,1.0];
    belt4.matrix = new Matrix4(lowerPantsMat);
    belt4.matrix.translate(modelSize*.76, modelSize*.095, modelSize*-0.002);
    belt4.matrix.scale(modelSize*.17, modelSize*.05, modelSize*.304);
    belt4.render();

    var belt5 = new Cube();
    belt5.color = [0,0,0,1.0];
    belt5.matrix = new Matrix4(lowerPantsMat);
    belt5.matrix.translate(modelSize*-0.002, modelSize*.095, modelSize*0.06);
    belt5.matrix.scale(modelSize*1.004, modelSize*.05, modelSize*.17);
    belt5.render();


    // Tie
    var tie = new Cube();
    tie.color = [1,0,0,1.0];
    tie.matrix = new Matrix4(upperPantsMat);
    tie.matrix.translate(modelSize*0.5, modelSize*0.1, modelSize*-0.004);
    tie.matrix.rotate(225,0,0,1);
    tie.matrix.scale(modelSize*0.17, modelSize*.17, modelSize*.01);
    tie.render();



/**********************************************/
//					Left Arm
/**********************************************/

    //Left Shoulder
    var leftShoulder = new Cube();
    leftShoulder.color = [1,1,1,1];
    leftShoulder.matrix = new Matrix4(bodyCoordinateMat);
    leftShoulder.matrix.translate(modelSize*0.98, modelSize*0.2, modelSize*0.2);
    leftShoulder.matrix.rotate(180, 0, 1, 0);
    leftShoulder.matrix.rotate(leftShoulderZRotation, 0, 0, 1);
    if(animation)
    	leftShoulder.matrix.rotate(70*Math.sin(g_seconds),1,0,0);
    else
    	leftShoulder.matrix.rotate(leftShoulderXRotation, 1, 0, 0);
    

    //save location and rotation
    var leftShoulderCoordinateMat = new Matrix4(leftShoulder.matrix);
    leftShoulder.matrix.scale(modelSize*0.13, modelSize*.13, modelSize*.13);
    leftShoulder.render();


    //Upper Left Arm
    var leftUpperArm = new Cube();
    leftUpperArm.color = [1,1,0,1];
    leftUpperArm.matrix = new Matrix4(leftShoulderCoordinateMat);
    leftUpperArm.matrix.translate(modelSize*.01,modelSize*.01,modelSize*.01);

    //save the location and rotation
    var leftUpperArmCoordinateMat = new Matrix4(leftUpperArm.matrix);
    leftUpperArm.matrix.scale(modelSize*.1, modelSize*.3, modelSize*.1);
    leftUpperArm.render();


    //Lower Left Arm
    var leftLowerArm = new Cube();
    leftLowerArm.color = [1,1,0,1];
    leftLowerArm.matrix = new Matrix4(leftUpperArmCoordinateMat);
    leftLowerArm.matrix.translate(modelSize*0,modelSize*.3,modelSize*0);
    leftLowerArm.matrix.rotate(leftArmRotation, 1, 0, 0);

    //save the location and rotation
    var leftLowerArmCoordinateMat = new Matrix4(leftLowerArm.matrix);
    leftLowerArm.matrix.scale(modelSize*.1, modelSize*.3, modelSize*.1);
    leftLowerArm.render();


/**********************************************/
//					right Arm
/**********************************************/

    //right Shoulder
    var rightShoulder = new Cube();
    rightShoulder.color = [1,1,1,1];
    rightShoulder.matrix = new Matrix4(bodyCoordinateMat);
    rightShoulder.matrix.translate(modelSize*-.10, modelSize*0.2, modelSize*0.2);
    rightShoulder.matrix.rotate(180, 0, 1, 0);
    rightShoulder.matrix.rotate(rightShoulderZRotation, 0, 0, 1);
    if(animation)
    	rightShoulder.matrix.rotate(-70*Math.sin(g_seconds),1,0,0);
    else
    	rightShoulder.matrix.rotate(rightShoulderXRotation, 1, 0, 0);

    //save location and rotation
    var rightShoulderCoordinateMat = new Matrix4(rightShoulder.matrix);
    rightShoulder.matrix.scale(modelSize*0.13, modelSize*.13, modelSize*.13);
    rightShoulder.render();


    //Upper right Arm
    var rightUpperArm = new Cube();
    rightUpperArm.color = [1,1,0,1];
    rightUpperArm.matrix = new Matrix4(rightShoulderCoordinateMat);
    rightUpperArm.matrix.translate(modelSize*.01,modelSize*.01,modelSize*.01);

    //save the location and rotation
    var rightUpperArmCoordinateMat = new Matrix4(rightUpperArm.matrix);
    rightUpperArm.matrix.scale(modelSize*.1, modelSize*.3, modelSize*.1);
    rightUpperArm.render();


    //Lower right Arm
    var rightLowerArm = new Cube();
    rightLowerArm.color = [1,1,0,1];
    rightLowerArm.matrix = new Matrix4(rightUpperArmCoordinateMat);
    rightLowerArm.matrix.translate(modelSize*0,modelSize*.3,modelSize*0);
    rightLowerArm.matrix.rotate(rightArmRotation, 1, 0, 0);

    //save the location and rotation
    var rightLowerArmCoordinateMat = new Matrix4(rightLowerArm.matrix);
    rightLowerArm.matrix.scale(modelSize*.1, modelSize*.3, modelSize*.1);
    rightLowerArm.render();



/**********************************************/
//					Left Leg
/**********************************************/


    //Left Leg
    var leftLeg = new Cube();
    leftLeg.color = [.6, .3, 0, 1];
    leftLeg.matrix = new Matrix4(lowerPantsMat);
    leftLeg.matrix.translate(modelSize*.73,modelSize*0.07,modelSize*.23);
	leftLeg.matrix.rotate(leftLegRotation,1,0,0);

    var leftLegCoordinateMat = new Matrix4(leftLeg.matrix);
    
    leftLeg.matrix.scale(modelSize*.15,modelSize*.25,modelSize*.15);
    leftLeg.render();



    //Upper Left Leg
    var leftUpperLeg = new Cube();
    leftUpperLeg.color = [1,1,0,1];
    leftUpperLeg.matrix = new Matrix4(leftLegCoordinateMat);
    leftUpperLeg.matrix.translate(modelSize*0.025,modelSize*0.02,modelSize*.025);

    var leftUpperLegCoordinateMat = new Matrix4(leftUpperLeg.matrix);
    leftUpperLeg.matrix.scale(modelSize*0.1,modelSize*0.45, modelSize*.1);
    leftUpperLeg.render();

    //Lower Left Leg
    var leftLowerLeg = new Cube();
    leftLowerLeg.color = [1,1,0,1];
    leftLowerLeg.matrix = new Matrix4(leftUpperLegCoordinateMat);
    leftLowerLeg.matrix.translate(modelSize*0.1,modelSize*.45,modelSize*0.1);
    leftLowerLeg.matrix.rotate(180, 0, 1, 0);

    leftLowerLeg.matrix.rotate(leftLowerLegRotation, 1, 0, 0);

    var leftLowerLegCoordinateMat = new Matrix4(leftLowerLeg.matrix);

    leftLowerLeg.matrix.scale(modelSize*0.1,modelSize*0.35,modelSize*.1);
    leftLowerLeg.render();

    //Left Sock 
    var leftSock = new Cube();
    leftSock.color = [1,1,1,1];
    leftSock.matrix = new Matrix4(leftLowerLegCoordinateMat);
    leftSock.matrix.translate(modelSize*-0.002,modelSize*.06,modelSize*-0.002);

    var leftSockCoordinateMat = new Matrix4(leftSock.matrix);
    leftSock.matrix.scale(modelSize*0.104,modelSize*0.3, modelSize*.104);
    leftSock.render();

    //Left Sock Detail
    var leftSockBlue = new Cube();
    leftSockBlue.color = [0,0,1,1];
    leftSockBlue.matrix = new Matrix4(leftSockCoordinateMat);
    leftSockBlue.matrix.translate(modelSize*-0.002,modelSize*.06,modelSize*-0.002);

    leftSockBlue.matrix.scale(modelSize*0.108,modelSize*0.02, modelSize*.108);
    leftSockBlue.render();


    var leftSockRed = new Cube();
    leftSockRed.color = [1,0,0,1];
    leftSockRed.matrix = new Matrix4(leftSockCoordinateMat);
    leftSockRed.matrix.translate(modelSize*-0.002,modelSize*.12,modelSize*-0.002);

    leftSockRed.matrix.scale(modelSize*0.108,modelSize*0.02, modelSize*.108);
    leftSockRed.render();


    //Left Shoe
    var leftShoe = new Cube();
    leftShoe.color = [0.1,0.1,0.1,1];
    leftShoe.matrix = new Matrix4(leftLowerLegCoordinateMat);
    leftShoe.matrix.translate(modelSize*0.125,modelSize*.3,modelSize*0.13);
    leftShoe.matrix.rotate(180,0,1,0);

    var leftShoeCoordinateMat = new Matrix4(leftShoe.matrix);
    leftShoe.matrix.scale(modelSize*0.15,modelSize*0.15, modelSize*.3);
    leftShoe.render();


/**********************************************/
//					right Leg
/**********************************************/


    //right Leg
    var rightLeg = new Cube();
    rightLeg.color = [.6, .3, 0, 1];
    rightLeg.matrix = new Matrix4(lowerPantsMat);
    rightLeg.matrix.translate(modelSize*.12,modelSize*0.07,modelSize*.23);
	rightLeg.matrix.rotate(rightLegRotation,1,0,0);

    var rightLegCoordinateMat = new Matrix4(rightLeg.matrix);
    
    rightLeg.matrix.scale(modelSize*.15,modelSize*.25,modelSize*.15);
    rightLeg.render();



    //Upper right Leg
    var rightUpperLeg = new Cube();
    rightUpperLeg.color = [1,1,0,1];
    rightUpperLeg.matrix = new Matrix4(rightLegCoordinateMat);
    rightUpperLeg.matrix.translate(modelSize*0.025,modelSize*0.02,modelSize*.025);

    var rightUpperLegCoordinateMat = new Matrix4(rightUpperLeg.matrix);
    rightUpperLeg.matrix.scale(modelSize*0.1,modelSize*0.45, modelSize*.1);
    rightUpperLeg.render();

    //Lower right Leg
    var rightLowerLeg = new Cube();
    rightLowerLeg.color = [1,1,0,1];
    rightLowerLeg.matrix = new Matrix4(rightUpperLegCoordinateMat);
    rightLowerLeg.matrix.translate(modelSize*0.1,modelSize*.45,modelSize*0.1);
    rightLowerLeg.matrix.rotate(180, 0, 1, 0);

    rightLowerLeg.matrix.rotate(rightLowerLegRotation, 1, 0, 0);

    var rightLowerLegCoordinateMat = new Matrix4(rightLowerLeg.matrix);

    rightLowerLeg.matrix.scale(modelSize*0.1,modelSize*0.35,modelSize*.1);
    rightLowerLeg.render();

    //right Sock 
    var rightSock = new Cube();
    rightSock.color = [1,1,1,1];
    rightSock.matrix = new Matrix4(rightLowerLegCoordinateMat);
    rightSock.matrix.translate(modelSize*-0.002,modelSize*.06,modelSize*-0.002);

    var rightSockCoordinateMat = new Matrix4(rightSock.matrix);
    rightSock.matrix.scale(modelSize*0.104,modelSize*0.3, modelSize*.104);
    rightSock.render();

    //right Sock Detail
    var rightSockBlue = new Cube();
    rightSockBlue.color = [0,0,1,1];
    rightSockBlue.matrix = new Matrix4(rightSockCoordinateMat);
    rightSockBlue.matrix.translate(modelSize*-0.002,modelSize*.06,modelSize*-0.002);

    rightSockBlue.matrix.scale(modelSize*0.108,modelSize*0.02, modelSize*.108);
    rightSockBlue.render();


    var rightSockRed = new Cube();
    rightSockRed.color = [1,0,0,1];
    rightSockRed.matrix = new Matrix4(rightSockCoordinateMat);
    rightSockRed.matrix.translate(modelSize*-0.002,modelSize*.12,modelSize*-0.002);

    rightSockRed.matrix.scale(modelSize*0.108,modelSize*0.02, modelSize*.108);
    rightSockRed.render();


    //right Shoe
    var rightShoe = new Cube();
    rightShoe.color = [0.1,0.1,0.1,1];
    rightShoe.matrix = new Matrix4(rightLowerLegCoordinateMat);
    rightShoe.matrix.translate(modelSize*0.125,modelSize*.3,modelSize*0.13);
    rightShoe.matrix.rotate(180,0,1,0);

    var rightShoeCoordinateMat = new Matrix4(rightShoe.matrix);
    rightShoe.matrix.scale(modelSize*0.15,modelSize*0.15, modelSize*.3);
    rightShoe.render();




    //sendTextToHTML("Animation Speed: "+animationSpeed,"info");

}

function sendTextToHTML(text, htmlID){
	var htmlElm = document.getElementById(htmlID);
	if(!htmlElm){
		console.log("Failed to get "+ htmlID +" from HTML");
		return;
	}
	htmlElm.innerHTML = text;
}



let vertices = new Float32Array([0,0,0]);

let a_Position = gl.getAttribLocation(gl.program, "a_Position");
gl.vertexAttribPointer(a_Position, 0,0,0, gl.FLOAT, false, 1,1,0, 1,0,0 );
gl.enableVertexAttribArray(a_Position);

let a_Color = gl.getAttribLocation(gl.program, "a_Color");
gl.vertexAttribPointer(a_Color, 0,0,0, gl.FLOAT, false, 0,0,1, 0,0,1 );
gl.enableVertexAttribArray(a_Color);

gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.drawArrays(gl.TRIANGLES, 0, 0,0,0 );