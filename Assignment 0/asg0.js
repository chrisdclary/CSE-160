function main() {
	// retrieve <canvas> element
	var canvas = document.getElementById('example');
	if (!canvas){
		console.log('Failed to retrieve the <canvas> element');
		return;
	}
// Get the rendering context
	ctx = canvas.getContext('2d');
	// Draw
	ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
	ctx.fillRect(0, 0, 400, 400);

	let v1 = new Vector3([2.25, 2.25, 0]);
	drawVector(v1, "red");
	
}

function drawVector(v, color){
	ctx.beginPath();
	ctx.moveTo(200, 200);
	ctx.lineTo(200 + (20*v.elements[0]), 200 - (20*v.elements[1]));
	ctx.strokeStyle = color;
	ctx.stroke();
}

function handleDrawEvent(){
	ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
	ctx.fillRect(0, 0, 400, 400);

	var x1 = document.getElementById("xval1").value;
	var y1 = document.getElementById("yval1").value;

	var x2 = document.getElementById("xval2").value;
	var y2 = document.getElementById("yval2").value;

	let v1 = new Vector3([x1, y1, 0]);
	drawVector(v1, "red");
	let v2 = new Vector3([x2, y2, 0]);
	drawVector(v2, "blue");
}

function handleDrawOperationEvent(){
	ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
	ctx.fillRect(0, 0, 400, 400);

	var x1 = document.getElementById("xval1").value;
	var y1 = document.getElementById("yval1").value;

	var x2 = document.getElementById("xval2").value;
	var y2 = document.getElementById("yval2").value;

	var scalar = document.getElementById("scalar").value;

	let v1 = new Vector3([x1, y1, 0]);
	drawVector(v1, "red");
	let v2 = new Vector3([x2, y2, 0]);
	drawVector(v2, "blue");

	var option = document.getElementById("opselect").value;

	if (option === "add"){
		let v3 = new Vector3([x1, y1, 0]);
		v3.add(v2);
		drawVector(v3, "green");
	}
	else if (option === "sub"){
		let v3 = new Vector3([x1, y1, 0]);
		v3.sub(v2);
		drawVector(v3, "green");
	}
	else if (option === "mult"){
		let v3 = new Vector3([x1, y1, 0]);
		let v4 = new Vector3([x2, y2, 0]);
		v3.mul(scalar);
		v4.mul(scalar);
		drawVector(v3, "green");
		drawVector(v4, "green");
	}
	else if (option === "div"){
		let v3 = new Vector3([x1, y1, 0]);
		let v4 = new Vector3([x2, y2, 0]);
		v3.div(scalar);
		v4.div(scalar);
		drawVector(v3, "green");
		drawVector(v4, "green");
	}
}