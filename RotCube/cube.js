/*
    cube.js - Drawable WebGL cube object definition

    IMPORTANT NOTE:
    This scripts assumes that the initGL.js script has already been loaded,
    and that consequently a variety of global variables are already defined,
    such as: gl, drawables, X_AXIS, Y_AXIS, Z_AXIS
*/

/*
    Constructor for ColorCube objects
 */

var Cube = function (program) { this.init(program, WHITE, BLUE, ORANGE, RED, YELLOW, GREEN); }



/* Initialize properties of this color cube object. */
Cube.prototype.init = function(program, col1, col2, col3, col4, col5, col6)
{
    this.points = []; // this array will hold raw vertex positions
    this.colors = []; // this array will hold per-vertex color data
    this.transform = mat4(); // initialize object transform as identity matrix

    this.mkcube(col1, col2, col3, col4, col5, col6); // delegate to auxiliary function
	

	
    this.program = program; // Load shaders and initialize attribute buffers

    this.cBufferId = gl.createBuffer(); // reserve a buffer object
    gl.bindBuffer( gl.ARRAY_BUFFER, this.cBufferId ); // set active array buffer
    /* send vert colors to the buffer, must repeat this
       wherever we change the vert colors for this cube */
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );

    this.vBufferId = gl.createBuffer(); // reserve a buffer object
    gl.bindBuffer( gl.ARRAY_BUFFER, this.vBufferId ); // set active array buffer
    /* send vert positions to the buffer, must repeat this
       wherever we change the vert positions for this cube */
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
}

Cube.prototype.draw = function(){
    gl.useProgram( this.program ); // set the current shader programs

    var projId = gl.getUniformLocation(this.program, "projection"); 
    gl.uniformMatrix4fv(projId, false, flatten(projection));

    var xformId = gl.getUniformLocation(this.program, "modeltransform");
    gl.uniformMatrix4fv(xformId, false, flatten(this.transform));

    gl.bindBuffer( gl.ARRAY_BUFFER, this.cBufferId ); // set active array buffer
    // map buffer data to the vertex shader attribute
    var vColorId = gl.getAttribLocation( this.program, "vColor" );
    gl.vertexAttribPointer( vColorId, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColorId );

    gl.bindBuffer( gl.ARRAY_BUFFER, this.vBufferId ); // set active array buffer
    // map buffer data to the vertex shader attribute
    var vPosId = gl.getAttribLocation( this.program, "vPosition" );
    gl.vertexAttribPointer( vPosId, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosId );

    // now push buffer data through the pipeline to render this object
    gl.drawArrays( gl.TRIANGLES, 0, this.numverts() );
}

/* Returns the total count of vertices to be sent into the pipeline. */
Cube.prototype.numverts = function() {return this.points.length;};

/* Default vertex positions for unit cube centered at the origin. */
Cube.prototype.vertices = [
    [ -0.5, -0.5,  0.5, 1.0 ],
    [ -0.5,  0.5,  0.5, 1.0 ],
    [  0.5,  0.5,  0.5, 1.0 ],
    [  0.5, -0.5,  0.5, 1.0 ],
    [ -0.5, -0.5, -0.5, 1.0 ],
    [ -0.5,  0.5, -0.5, 1.0 ],
    [  0.5,  0.5, -0.5, 1.0 ],
    [  0.5, -0.5, -0.5, 1.0 ]
];

/* Default vertex colors for the color cube. */
Cube.prototype.vcolors = [
    [ 1.0, 0.5, 0.0, 1.0 ], // orange
    [ 1.0, 0.0, 0.0, 1.0 ], // red
    [ 1.0, 1.0, 0.0, 1.0 ], // yellow
    [ 0.0, 1.0, 0.0, 1.0 ], // green
    [ 0.0, 0.0, 1.0, 1.0 ], // blue
    [ 1.0, 0.0, 1.0, 1.0 ], // magenta
    [ 1.0, 1.0, 1.0, 1.0 ], // white
    [ 0.0, 1.0, 1.0, 1.0 ]  // cyan
];


/*
    Build one of the faces for this cube object.

*/
Cube.prototype.mkquad = function(a, b, c, d, e, f, g, h)
{
    this.points.push( vec4(this.vertices[a]) );
    this.colors.push( vec4(this.vcolors[e]) );

    this.points.push( vec4(this.vertices[b]) );
    this.colors.push( vec4(this.vcolors[f]) );

    this.points.push( vec4(this.vertices[c]) );
    this.colors.push( vec4(this.vcolors[g]) );

    this.points.push( vec4(this.vertices[a]) );
    this.colors.push( vec4(this.vcolors[e]) );

    this.points.push( vec4(this.vertices[c]) );
    this.colors.push( vec4(this.vcolors[g]) );

    this.points.push( vec4(this.vertices[d]) );
    this.colors.push( vec4(this.vcolors[h]) );
}

/*
    Build all faces of this cube object.

*/
Cube.prototype.mkcube = function(a, b, c, d, e, f)
{
    this.mkquad( 1, 0, 3, 2 , a, a, a, a);
    this.mkquad( 2, 3, 7, 6 , b, b, b, b);
    this.mkquad( 3, 0, 4, 7 , c, c, c, c);
    this.mkquad( 6, 5, 1, 2 , d, d, d, d);
    this.mkquad( 4, 5, 6, 7 , e, e, e, e);
    this.mkquad( 5, 4, 0, 1 , f, f, f, f);
}

/* Translate this cube along the specified canonical axis. */
Cube.prototype.move = function(dist, axis){
    var delta = [0, 0, 0];

    if (axis === undefined) axis = Y_AXIS;
    delta[axis] = dist;

    this.transform = mult(translate(delta), this.transform);
}

/* Rotate this cube around the specified canonical axis. */
Cube.prototype.turn = function(angle, axis){
    var avec = [0, 0, 0];

    if (axis === undefined) axis = Y_AXIS;
    avec[axis] = 1;

    this.transform = mult(rotate(angle, avec), this.transform);
}

//brilliantly written code that amazingly is able to make the animation smooth :]
Cube.prototype.go = function(angleleft, axis) {
	angleleft2 = angleleft;
	var _this = this;
	
	if (angleleft2 != 0)
		{		
			if (angleleft > 0){
					angleleft2-=1;
					this.turn(0.4,axis);
					angleleft2 = angleleft2.toFixed(0);
					setTimeout(function(){_this.go(angleleft2, axis);}, 1);
			}else{
					angleleft2+=1;
					this.turn(-0.4,axis);
					angleleft2 = -angleleft2;
					angleleft2 = angleleft2.toFixed(0);
					angleleft2 = -angleleft2;
					setTimeout(function(){_this.go(angleleft2, axis);}, 1);				
			}
		}else{
		done = true;
		}
}

//controls the nice smooth animation for spinning
Cube.prototype.spin = function(angle, axis)
{
	var angletotal = angle;
	var angleleft = angletotal*22.4;
	this.go(angleleft, axis, this);
	//console.log("hi");
	//done = true;
}

window.setstate = function(solstring)
{
	//process the solution string
	var s = solstring;
	var patt = new RegExp('.{1,'+2+'}', 'g');
	var a = s.match(patt);
	a = a.reverse();
	var num = 0;
	//console.log(a);
	
	//check how many times to turn
	for (i=0;i<a.length;i++)
	{	
		
		if (a[i].substring(1,2) == 1)
		{
			num = 3;
		}else if (a[i].substring(1,2) == 3)
		{
			num = 1;
		}else if (a[i].substring(1,2) == 2)
		{
			num = 2;
		}
		
		//super bulky code that processes the reversed solution string
		//and instantly does the solution backwards to reach initial state
		if (num == 1)
		{
			if (a[i].substring(0,1) == "R")
			{
			console.log(a[i]);
			drawables[5].turn(90,Y_AXIS);
			drawables[15].turn(90,Y_AXIS);
			drawables[10].turn(90,Y_AXIS);			
			drawables[17].turn(90,Y_AXIS);
			drawables[6].turn(90,Y_AXIS);
			drawables[26].turn(90,Y_AXIS);
			drawables[21].turn(90,Y_AXIS);
			drawables[25].turn(90,Y_AXIS);
			
			temp[0] = drawables[5];
			temp[1] = drawables[15];
			temp[2] = drawables[10];
			temp[3] = drawables[17];
			temp[4] = drawables[6];
			temp[5] = drawables[26];
			temp[6] = drawables[21];
			temp[7] = drawables[25];
			
			drawables[10] = temp[0];
			drawables[17] = temp[1];
			drawables[6] = temp[2];
			drawables[26] = temp[3];
			drawables[21] = temp[4];
			drawables[25] = temp[5];
			drawables[5] = temp[6];
			drawables[15] = temp[7];
				
			}else if (a[i].substring(0,1) == "W")
			{
			
			drawables[23].turn(90,Z_AXIS);
			drawables[25].turn(90,Z_AXIS);
			drawables[21].turn(90,Z_AXIS);
			drawables[26].turn(90,Z_AXIS);
			drawables[24].turn(90,Z_AXIS);	
			drawables[28].turn(90,Z_AXIS);
			drawables[22].turn(90,Z_AXIS);
			drawables[29].turn(90,Z_AXIS);
			
			temp[0] = drawables[23];
			temp[1] = drawables[25];
			temp[2] = drawables[21];
			temp[3] = drawables[26];
			temp[4] = drawables[24];
			temp[5] = drawables[28];
			temp[6] = drawables[22];
			temp[7] = drawables[29];
			
			drawables[21] = temp[0];
			drawables[26] = temp[1];
			drawables[24] = temp[2];
			drawables[28] = temp[3];
			drawables[22] = temp[4];
			drawables[29] = temp[5];
			drawables[23] = temp[6];
			drawables[25] = temp[7];
			
			}else if (a[i].substring(0,1) == "G")
			{
			
			drawables[18].turn(-90,X_AXIS);
			drawables[8].turn(-90,X_AXIS);
			drawables[28].turn(-90,X_AXIS);			
			drawables[24].turn(-90,X_AXIS);
			drawables[26].turn(-90,X_AXIS);
			drawables[6].turn(-90,X_AXIS);
			drawables[17].turn(-90,X_AXIS);	
			drawables[14].turn(-90,X_AXIS);
			
			temp[0] = drawables[18];
			temp[1] = drawables[8];
			temp[2] = drawables[28];
			temp[3] = drawables[24];
			temp[4] = drawables[26];
			temp[5] = drawables[6];
			temp[6] = drawables[17];
			temp[7] = drawables[14];
			
			drawables[28] = temp[0];
			drawables[24] = temp[1];
			drawables[26] = temp[2];
			drawables[6] = temp[3];
			drawables[17] = temp[4];
			drawables[14] = temp[5];
			drawables[18] = temp[6];
			drawables[8] = temp[7];
			
			}else if (a[i].substring(0,1) == "O")
			{
				drawables[19].turn(-90,Y_AXIS);
				drawables[9].turn(-90,Y_AXIS);
				drawables[29].turn(-90,Y_AXIS);
				drawables[22].turn(-90,Y_AXIS);
				drawables[28].turn(-90,Y_AXIS);
				drawables[8].turn(-90,Y_AXIS);
				drawables[18].turn(-90,Y_AXIS);
				drawables[12].turn(-90,Y_AXIS);
				
				temp[0] = drawables[19];
			temp[1] = drawables[9];
			temp[2] = drawables[29];
			temp[3] = drawables[22];
			temp[4] = drawables[28];
			temp[5] = drawables[8];
			temp[6] = drawables[18];
			temp[7] = drawables[12];
			
			drawables[29] = temp[0];
			drawables[22] = temp[1];
			drawables[28] = temp[2];
			drawables[8] = temp[3];
			drawables[18] = temp[4];
			drawables[12] = temp[5];
			drawables[19] = temp[6];
			drawables[9] = temp[7];
			
			}else if (a[i].substring(0,1) == "B")
			{
			drawables[15].turn(90,X_AXIS);	
			drawables[5].turn(90,X_AXIS);
			drawables[25].turn(90,X_AXIS);
			drawables[23].turn(90,X_AXIS);
			drawables[29].turn(90,X_AXIS);
			drawables[9].turn(90,X_AXIS);
			drawables[19].turn(90,X_AXIS);	
			drawables[13].turn(90,X_AXIS);	
			
			temp[0] = drawables[15];
			temp[1] = drawables[5];
			temp[2] = drawables[25];
			temp[3] = drawables[23];
			temp[4] = drawables[29];
			temp[5] = drawables[9];
			temp[6] = drawables[19];
			temp[7] = drawables[13];
			
			drawables[25] = temp[0];
			drawables[23] = temp[1];
			drawables[29] = temp[2];
			drawables[9] = temp[3];
			drawables[19] = temp[4];
			drawables[13] = temp[5];
			drawables[15] = temp[6];
			drawables[5] = temp[7];
			
			}else if (a[i].substring(0,1) == "Y")
			{
			drawables[19].turn(-90,Z_AXIS);
			drawables[12].turn(-90,Z_AXIS);
			drawables[18].turn(-90,Z_AXIS);
			drawables[14].turn(-90,Z_AXIS);
			drawables[17].turn(-90,Z_AXIS);
			drawables[10].turn(-90,Z_AXIS);
			drawables[15].turn(-90,Z_AXIS);	
			drawables[13].turn(-90,Z_AXIS);
			
			temp[0] = drawables[19];
			temp[1] = drawables[12];
			temp[2] = drawables[18];
			temp[3] = drawables[14];
			temp[4] = drawables[17];
			temp[5] = drawables[10];
			temp[6] = drawables[15];
			temp[7] = drawables[13];
			
			drawables[18] = temp[0];
			drawables[14] = temp[1];
			drawables[17] = temp[2];
			drawables[10] = temp[3];
			drawables[15] = temp[4];
			drawables[13] = temp[5];
			drawables[19] = temp[6];
			drawables[12] = temp[7];
			
			}
		
			
		}else if (num == 2)
		{
		
			if (a[i].substring(0,1) == "R")
			{
			drawables[5].turn(90,Y_AXIS);
			drawables[15].turn(90,Y_AXIS);
			drawables[10].turn(90,Y_AXIS);			
			drawables[17].turn(90,Y_AXIS);
			drawables[6].turn(90,Y_AXIS);
			drawables[26].turn(90,Y_AXIS);
			drawables[21].turn(90,Y_AXIS);
			drawables[25].turn(90,Y_AXIS);
			
			temp[0] = drawables[5];
			temp[1] = drawables[15];
			temp[2] = drawables[10];
			temp[3] = drawables[17];
			temp[4] = drawables[6];
			temp[5] = drawables[26];
			temp[6] = drawables[21];
			temp[7] = drawables[25];
			
			drawables[10] = temp[0];
			drawables[17] = temp[1];
			drawables[6] = temp[2];
			drawables[26] = temp[3];
			drawables[21] = temp[4];
			drawables[25] = temp[5];
			drawables[5] = temp[6];
			drawables[15] = temp[7];
			
			drawables[5].turn(90,Y_AXIS);
			drawables[15].turn(90,Y_AXIS);
			drawables[10].turn(90,Y_AXIS);			
			drawables[17].turn(90,Y_AXIS);
			drawables[6].turn(90,Y_AXIS);
			drawables[26].turn(90,Y_AXIS);
			drawables[21].turn(90,Y_AXIS);
			drawables[25].turn(90,Y_AXIS);
			
			temp[0] = drawables[5];
			temp[1] = drawables[15];
			temp[2] = drawables[10];
			temp[3] = drawables[17];
			temp[4] = drawables[6];
			temp[5] = drawables[26];
			temp[6] = drawables[21];
			temp[7] = drawables[25];
			
			drawables[10] = temp[0];
			drawables[17] = temp[1];
			drawables[6] = temp[2];
			drawables[26] = temp[3];
			drawables[21] = temp[4];
			drawables[25] = temp[5];
			drawables[5] = temp[6];
			drawables[15] = temp[7];
			
			}else if (a[i].substring(0,1) == "W")
			{
			
			drawables[23].turn(90,Z_AXIS);
			drawables[25].turn(90,Z_AXIS);
			drawables[21].turn(90,Z_AXIS);
			drawables[26].turn(90,Z_AXIS);
			drawables[24].turn(90,Z_AXIS);	
			drawables[28].turn(90,Z_AXIS);
			drawables[22].turn(90,Z_AXIS);
			drawables[29].turn(90,Z_AXIS);
			
			temp[0] = drawables[23];
			temp[1] = drawables[25];
			temp[2] = drawables[21];
			temp[3] = drawables[26];
			temp[4] = drawables[24];
			temp[5] = drawables[28];
			temp[6] = drawables[22];
			temp[7] = drawables[29];
			
			drawables[21] = temp[0];
			drawables[26] = temp[1];
			drawables[24] = temp[2];
			drawables[28] = temp[3];
			drawables[22] = temp[4];
			drawables[29] = temp[5];
			drawables[23] = temp[6];
			drawables[25] = temp[7];
			
			drawables[23].turn(90,Z_AXIS);
			drawables[25].turn(90,Z_AXIS);
			drawables[21].turn(90,Z_AXIS);
			drawables[26].turn(90,Z_AXIS);
			drawables[24].turn(90,Z_AXIS);	
			drawables[28].turn(90,Z_AXIS);
			drawables[22].turn(90,Z_AXIS);
			drawables[29].turn(90,Z_AXIS);
			
			temp[0] = drawables[23];
			temp[1] = drawables[25];
			temp[2] = drawables[21];
			temp[3] = drawables[26];
			temp[4] = drawables[24];
			temp[5] = drawables[28];
			temp[6] = drawables[22];
			temp[7] = drawables[29];
			
			drawables[21] = temp[0];
			drawables[26] = temp[1];
			drawables[24] = temp[2];
			drawables[28] = temp[3];
			drawables[22] = temp[4];
			drawables[29] = temp[5];
			drawables[23] = temp[6];
			drawables[25] = temp[7];
			
			}else if (a[i].substring(0,1) == "G")
			{
			drawables[18].turn(-90,X_AXIS);
			drawables[8].turn(-90,X_AXIS);
			drawables[28].turn(-90,X_AXIS);			
			drawables[24].turn(-90,X_AXIS);
			drawables[26].turn(-90,X_AXIS);
			drawables[6].turn(-90,X_AXIS);
			drawables[17].turn(-90,X_AXIS);	
			drawables[14].turn(-90,X_AXIS);
			
			temp[0] = drawables[18];
			temp[1] = drawables[8];
			temp[2] = drawables[28];
			temp[3] = drawables[24];
			temp[4] = drawables[26];
			temp[5] = drawables[6];
			temp[6] = drawables[17];
			temp[7] = drawables[14];
			
			drawables[28] = temp[0];
			drawables[24] = temp[1];
			drawables[26] = temp[2];
			drawables[6] = temp[3];
			drawables[17] = temp[4];
			drawables[14] = temp[5];
			drawables[18] = temp[6];
			drawables[8] = temp[7];
			
			drawables[18].turn(-90,X_AXIS);
			drawables[8].turn(-90,X_AXIS);
			drawables[28].turn(-90,X_AXIS);			
			drawables[24].turn(-90,X_AXIS);
			drawables[26].turn(-90,X_AXIS);
			drawables[6].turn(-90,X_AXIS);
			drawables[17].turn(-90,X_AXIS);	
			drawables[14].turn(-90,X_AXIS);
			
			temp[0] = drawables[18];
			temp[1] = drawables[8];
			temp[2] = drawables[28];
			temp[3] = drawables[24];
			temp[4] = drawables[26];
			temp[5] = drawables[6];
			temp[6] = drawables[17];
			temp[7] = drawables[14];
			
			drawables[28] = temp[0];
			drawables[24] = temp[1];
			drawables[26] = temp[2];
			drawables[6] = temp[3];
			drawables[17] = temp[4];
			drawables[14] = temp[5];
			drawables[18] = temp[6];
			drawables[8] = temp[7];
			
			
			
			}else if (a[i].substring(0,1) == "O")
			{
				drawables[19].turn(-90,Y_AXIS);
				drawables[9].turn(-90,Y_AXIS);
				drawables[29].turn(-90,Y_AXIS);
				drawables[22].turn(-90,Y_AXIS);
				drawables[28].turn(-90,Y_AXIS);
				drawables[8].turn(-90,Y_AXIS);
				drawables[18].turn(-90,Y_AXIS);
				drawables[12].turn(-90,Y_AXIS);
				
				temp[0] = drawables[19];
			temp[1] = drawables[9];
			temp[2] = drawables[29];
			temp[3] = drawables[22];
			temp[4] = drawables[28];
			temp[5] = drawables[8];
			temp[6] = drawables[18];
			temp[7] = drawables[12];
			
			drawables[29] = temp[0];
			drawables[22] = temp[1];
			drawables[28] = temp[2];
			drawables[8] = temp[3];
			drawables[18] = temp[4];
			drawables[12] = temp[5];
			drawables[19] = temp[6];
			drawables[9] = temp[7];
				
				drawables[19].turn(-90,Y_AXIS);
				drawables[9].turn(-90,Y_AXIS);
				drawables[29].turn(-90,Y_AXIS);
				drawables[22].turn(-90,Y_AXIS);
				drawables[28].turn(-90,Y_AXIS);
				drawables[8].turn(-90,Y_AXIS);
				drawables[18].turn(-90,Y_AXIS);
				drawables[12].turn(-90,Y_AXIS);
				
				temp[0] = drawables[19];
			temp[1] = drawables[9];
			temp[2] = drawables[29];
			temp[3] = drawables[22];
			temp[4] = drawables[28];
			temp[5] = drawables[8];
			temp[6] = drawables[18];
			temp[7] = drawables[12];
			
			drawables[29] = temp[0];
			drawables[22] = temp[1];
			drawables[28] = temp[2];
			drawables[8] = temp[3];
			drawables[18] = temp[4];
			drawables[12] = temp[5];
			drawables[19] = temp[6];
			drawables[9] = temp[7];
				
			
			}else if (a[i].substring(0,1) == "B")
			{
			drawables[15].turn(90,X_AXIS);	
			drawables[5].turn(90,X_AXIS);
			drawables[25].turn(90,X_AXIS);
			drawables[23].turn(90,X_AXIS);
			drawables[29].turn(90,X_AXIS);
			drawables[9].turn(90,X_AXIS);
			drawables[19].turn(90,X_AXIS);	
			drawables[13].turn(90,X_AXIS);
			
			temp[0] = drawables[15];
			temp[1] = drawables[5];
			temp[2] = drawables[25];
			temp[3] = drawables[23];
			temp[4] = drawables[29];
			temp[5] = drawables[9];
			temp[6] = drawables[19];
			temp[7] = drawables[13];
			
			drawables[25] = temp[0];
			drawables[23] = temp[1];
			drawables[29] = temp[2];
			drawables[9] = temp[3];
			drawables[19] = temp[4];
			drawables[13] = temp[5];
			drawables[15] = temp[6];
			drawables[5] = temp[7];

			
			
			drawables[15].turn(90,X_AXIS);	
			drawables[5].turn(90,X_AXIS);
			drawables[25].turn(90,X_AXIS);
			drawables[23].turn(90,X_AXIS);
			drawables[29].turn(90,X_AXIS);
			drawables[9].turn(90,X_AXIS);
			drawables[19].turn(90,X_AXIS);	
			drawables[13].turn(90,X_AXIS);	
			
			temp[0] = drawables[15];
			temp[1] = drawables[5];
			temp[2] = drawables[25];
			temp[3] = drawables[23];
			temp[4] = drawables[29];
			temp[5] = drawables[9];
			temp[6] = drawables[19];
			temp[7] = drawables[13];
			
			drawables[25] = temp[0];
			drawables[23] = temp[1];
			drawables[29] = temp[2];
			drawables[9] = temp[3];
			drawables[19] = temp[4];
			drawables[13] = temp[5];
			drawables[15] = temp[6];
			drawables[5] = temp[7];
			
			}else if (a[i].substring(0,1) == "Y")
			{
			drawables[19].turn(-90,Z_AXIS);
			drawables[12].turn(-90,Z_AXIS);
			drawables[18].turn(-90,Z_AXIS);
			drawables[14].turn(-90,Z_AXIS);
			drawables[17].turn(-90,Z_AXIS);
			drawables[10].turn(-90,Z_AXIS);
			drawables[15].turn(-90,Z_AXIS);	
			drawables[13].turn(-90,Z_AXIS);
			
			temp[0] = drawables[19];
			temp[1] = drawables[12];
			temp[2] = drawables[18];
			temp[3] = drawables[14];
			temp[4] = drawables[17];
			temp[5] = drawables[10];
			temp[6] = drawables[15];
			temp[7] = drawables[13];
			
			drawables[18] = temp[0];
			drawables[14] = temp[1];
			drawables[17] = temp[2];
			drawables[10] = temp[3];
			drawables[15] = temp[4];
			drawables[13] = temp[5];
			drawables[19] = temp[6];
			drawables[12] = temp[7];
			
			drawables[19].turn(-90,Z_AXIS);
			drawables[12].turn(-90,Z_AXIS);
			drawables[18].turn(-90,Z_AXIS);
			drawables[14].turn(-90,Z_AXIS);
			drawables[17].turn(-90,Z_AXIS);
			drawables[10].turn(-90,Z_AXIS);
			drawables[15].turn(-90,Z_AXIS);	
			drawables[13].turn(-90,Z_AXIS);
			
			temp[0] = drawables[19];
			temp[1] = drawables[12];
			temp[2] = drawables[18];
			temp[3] = drawables[14];
			temp[4] = drawables[17];
			temp[5] = drawables[10];
			temp[6] = drawables[15];
			temp[7] = drawables[13];
			
			drawables[18] = temp[0];
			drawables[14] = temp[1];
			drawables[17] = temp[2];
			drawables[10] = temp[3];
			drawables[15] = temp[4];
			drawables[13] = temp[5];
			drawables[19] = temp[6];
			drawables[12] = temp[7];
			
			}
		
		}else if (num == 3)
		{
		
			if (a[i].substring(0,1) == "R")
			{
			drawables[5].turn(90,Y_AXIS);
			drawables[15].turn(90,Y_AXIS);
			drawables[10].turn(90,Y_AXIS);			
			drawables[17].turn(90,Y_AXIS);
			drawables[6].turn(90,Y_AXIS);
			drawables[26].turn(90,Y_AXIS);
			drawables[21].turn(90,Y_AXIS);
			drawables[25].turn(90,Y_AXIS);
			
			temp[0] = drawables[5];
			temp[1] = drawables[15];
			temp[2] = drawables[10];
			temp[3] = drawables[17];
			temp[4] = drawables[6];
			temp[5] = drawables[26];
			temp[6] = drawables[21];
			temp[7] = drawables[25];
			
			drawables[10] = temp[0];
			drawables[17] = temp[1];
			drawables[6] = temp[2];
			drawables[26] = temp[3];
			drawables[21] = temp[4];
			drawables[25] = temp[5];
			drawables[5] = temp[6];
			drawables[15] = temp[7];
			
			drawables[5].turn(90,Y_AXIS);
			drawables[15].turn(90,Y_AXIS);
			drawables[10].turn(90,Y_AXIS);			
			drawables[17].turn(90,Y_AXIS);
			drawables[6].turn(90,Y_AXIS);
			drawables[26].turn(90,Y_AXIS);
			drawables[21].turn(90,Y_AXIS);
			drawables[25].turn(90,Y_AXIS);
			
			temp[0] = drawables[5];
			temp[1] = drawables[15];
			temp[2] = drawables[10];
			temp[3] = drawables[17];
			temp[4] = drawables[6];
			temp[5] = drawables[26];
			temp[6] = drawables[21];
			temp[7] = drawables[25];
			
			drawables[10] = temp[0];
			drawables[17] = temp[1];
			drawables[6] = temp[2];
			drawables[26] = temp[3];
			drawables[21] = temp[4];
			drawables[25] = temp[5];
			drawables[5] = temp[6];
			drawables[15] = temp[7];
			
			drawables[5].turn(90,Y_AXIS);
			drawables[15].turn(90,Y_AXIS);
			drawables[10].turn(90,Y_AXIS);			
			drawables[17].turn(90,Y_AXIS);
			drawables[6].turn(90,Y_AXIS);
			drawables[26].turn(90,Y_AXIS);
			drawables[21].turn(90,Y_AXIS);
			drawables[25].turn(90,Y_AXIS);
			
			temp[0] = drawables[5];
			temp[1] = drawables[15];
			temp[2] = drawables[10];
			temp[3] = drawables[17];
			temp[4] = drawables[6];
			temp[5] = drawables[26];
			temp[6] = drawables[21];
			temp[7] = drawables[25];
			
			drawables[10] = temp[0];
			drawables[17] = temp[1];
			drawables[6] = temp[2];
			drawables[26] = temp[3];
			drawables[21] = temp[4];
			drawables[25] = temp[5];
			drawables[5] = temp[6];
			drawables[15] = temp[7];
			
			}else if (a[i].substring(0,1) == "W")
			{
			drawables[23].turn(90,Z_AXIS);
			drawables[25].turn(90,Z_AXIS);
			drawables[21].turn(90,Z_AXIS);
			drawables[26].turn(90,Z_AXIS);
			drawables[24].turn(90,Z_AXIS);	
			drawables[28].turn(90,Z_AXIS);
			drawables[22].turn(90,Z_AXIS);
			drawables[29].turn(90,Z_AXIS);
			
			temp[0] = drawables[23];
			temp[1] = drawables[25];
			temp[2] = drawables[21];
			temp[3] = drawables[26];
			temp[4] = drawables[24];
			temp[5] = drawables[28];
			temp[6] = drawables[22];
			temp[7] = drawables[29];
			
			drawables[21] = temp[0];
			drawables[26] = temp[1];
			drawables[24] = temp[2];
			drawables[28] = temp[3];
			drawables[22] = temp[4];
			drawables[29] = temp[5];
			drawables[23] = temp[6];
			drawables[25] = temp[7];
			
			drawables[23].turn(90,Z_AXIS);
			drawables[25].turn(90,Z_AXIS);
			drawables[21].turn(90,Z_AXIS);
			drawables[26].turn(90,Z_AXIS);
			drawables[24].turn(90,Z_AXIS);	
			drawables[28].turn(90,Z_AXIS);
			drawables[22].turn(90,Z_AXIS);
			drawables[29].turn(90,Z_AXIS);
			
			temp[0] = drawables[23];
			temp[1] = drawables[25];
			temp[2] = drawables[21];
			temp[3] = drawables[26];
			temp[4] = drawables[24];
			temp[5] = drawables[28];
			temp[6] = drawables[22];
			temp[7] = drawables[29];
			
			drawables[21] = temp[0];
			drawables[26] = temp[1];
			drawables[24] = temp[2];
			drawables[28] = temp[3];
			drawables[22] = temp[4];
			drawables[29] = temp[5];
			drawables[23] = temp[6];
			drawables[25] = temp[7];
			
			drawables[23].turn(90,Z_AXIS);
			drawables[25].turn(90,Z_AXIS);
			drawables[21].turn(90,Z_AXIS);
			drawables[26].turn(90,Z_AXIS);
			drawables[24].turn(90,Z_AXIS);	
			drawables[28].turn(90,Z_AXIS);
			drawables[22].turn(90,Z_AXIS);
			drawables[29].turn(90,Z_AXIS);
			
			temp[0] = drawables[23];
			temp[1] = drawables[25];
			temp[2] = drawables[21];
			temp[3] = drawables[26];
			temp[4] = drawables[24];
			temp[5] = drawables[28];
			temp[6] = drawables[22];
			temp[7] = drawables[29];
			
			drawables[21] = temp[0];
			drawables[26] = temp[1];
			drawables[24] = temp[2];
			drawables[28] = temp[3];
			drawables[22] = temp[4];
			drawables[29] = temp[5];
			drawables[23] = temp[6];
			drawables[25] = temp[7];
			
			}else if (a[i].substring(0,1) == "G")
			{
			
			drawables[18].turn(-90,X_AXIS);
			drawables[8].turn(-90,X_AXIS);
			drawables[28].turn(-90,X_AXIS);			
			drawables[24].turn(-90,X_AXIS);
			drawables[26].turn(-90,X_AXIS);
			drawables[6].turn(-90,X_AXIS);
			drawables[17].turn(-90,X_AXIS);	
			drawables[14].turn(-90,X_AXIS);
			
			temp[0] = drawables[18];
			temp[1] = drawables[8];
			temp[2] = drawables[28];
			temp[3] = drawables[24];
			temp[4] = drawables[26];
			temp[5] = drawables[6];
			temp[6] = drawables[17];
			temp[7] = drawables[14];
			
			drawables[28] = temp[0];
			drawables[24] = temp[1];
			drawables[26] = temp[2];
			drawables[6] = temp[3];
			drawables[17] = temp[4];
			drawables[14] = temp[5];
			drawables[18] = temp[6];
			drawables[8] = temp[7];
			
			drawables[18].turn(-90,X_AXIS);
			drawables[8].turn(-90,X_AXIS);
			drawables[28].turn(-90,X_AXIS);			
			drawables[24].turn(-90,X_AXIS);
			drawables[26].turn(-90,X_AXIS);
			drawables[6].turn(-90,X_AXIS);
			drawables[17].turn(-90,X_AXIS);	
			drawables[14].turn(-90,X_AXIS);
			
			temp[0] = drawables[18];
			temp[1] = drawables[8];
			temp[2] = drawables[28];
			temp[3] = drawables[24];
			temp[4] = drawables[26];
			temp[5] = drawables[6];
			temp[6] = drawables[17];
			temp[7] = drawables[14];
			
			drawables[28] = temp[0];
			drawables[24] = temp[1];
			drawables[26] = temp[2];
			drawables[6] = temp[3];
			drawables[17] = temp[4];
			drawables[14] = temp[5];
			drawables[18] = temp[6];
			drawables[8] = temp[7];
			
			drawables[18].turn(-90,X_AXIS);
			drawables[8].turn(-90,X_AXIS);
			drawables[28].turn(-90,X_AXIS);			
			drawables[24].turn(-90,X_AXIS);
			drawables[26].turn(-90,X_AXIS);
			drawables[6].turn(-90,X_AXIS);
			drawables[17].turn(-90,X_AXIS);	
			drawables[14].turn(-90,X_AXIS);
			
			temp[0] = drawables[18];
			temp[1] = drawables[8];
			temp[2] = drawables[28];
			temp[3] = drawables[24];
			temp[4] = drawables[26];
			temp[5] = drawables[6];
			temp[6] = drawables[17];
			temp[7] = drawables[14];
			
			drawables[28] = temp[0];
			drawables[24] = temp[1];
			drawables[26] = temp[2];
			drawables[6] = temp[3];
			drawables[17] = temp[4];
			drawables[14] = temp[5];
			drawables[18] = temp[6];
			drawables[8] = temp[7];
			
			}else if (a[i].substring(0,1) == "O")
			{
				drawables[19].turn(-90,Y_AXIS);
				drawables[9].turn(-90,Y_AXIS);
				drawables[29].turn(-90,Y_AXIS);
				drawables[22].turn(-90,Y_AXIS);
				drawables[28].turn(-90,Y_AXIS);
				drawables[8].turn(-90,Y_AXIS);
				drawables[18].turn(-90,Y_AXIS);
				drawables[12].turn(-90,Y_AXIS);
				
				temp[0] = drawables[19];
			temp[1] = drawables[9];
			temp[2] = drawables[29];
			temp[3] = drawables[22];
			temp[4] = drawables[28];
			temp[5] = drawables[8];
			temp[6] = drawables[18];
			temp[7] = drawables[12];
			
			drawables[29] = temp[0];
			drawables[22] = temp[1];
			drawables[28] = temp[2];
			drawables[8] = temp[3];
			drawables[18] = temp[4];
			drawables[12] = temp[5];
			drawables[19] = temp[6];
			drawables[9] = temp[7];
				
				drawables[19].turn(-90,Y_AXIS);
				drawables[9].turn(-90,Y_AXIS);
				drawables[29].turn(-90,Y_AXIS);
				drawables[22].turn(-90,Y_AXIS);
				drawables[28].turn(-90,Y_AXIS);
				drawables[8].turn(-90,Y_AXIS);
				drawables[18].turn(-90,Y_AXIS);
				drawables[12].turn(-90,Y_AXIS);
				
				temp[0] = drawables[19];
			temp[1] = drawables[9];
			temp[2] = drawables[29];
			temp[3] = drawables[22];
			temp[4] = drawables[28];
			temp[5] = drawables[8];
			temp[6] = drawables[18];
			temp[7] = drawables[12];
			
			drawables[29] = temp[0];
			drawables[22] = temp[1];
			drawables[28] = temp[2];
			drawables[8] = temp[3];
			drawables[18] = temp[4];
			drawables[12] = temp[5];
			drawables[19] = temp[6];
			drawables[9] = temp[7];
				
				drawables[19].turn(-90,Y_AXIS);
				drawables[9].turn(-90,Y_AXIS);
				drawables[29].turn(-90,Y_AXIS);
				drawables[22].turn(-90,Y_AXIS);
				drawables[28].turn(-90,Y_AXIS);
				drawables[8].turn(-90,Y_AXIS);
				drawables[18].turn(-90,Y_AXIS);
				drawables[12].turn(-90,Y_AXIS);
				
				temp[0] = drawables[19];
			temp[1] = drawables[9];
			temp[2] = drawables[29];
			temp[3] = drawables[22];
			temp[4] = drawables[28];
			temp[5] = drawables[8];
			temp[6] = drawables[18];
			temp[7] = drawables[12];
			
			drawables[29] = temp[0];
			drawables[22] = temp[1];
			drawables[28] = temp[2];
			drawables[8] = temp[3];
			drawables[18] = temp[4];
			drawables[12] = temp[5];
			drawables[19] = temp[6];
			drawables[9] = temp[7];
			
			}else if (a[i].substring(0,1) == "B")
			{
			
			drawables[15].turn(90,X_AXIS);	
			drawables[5].turn(90,X_AXIS);
			drawables[25].turn(90,X_AXIS);
			drawables[23].turn(90,X_AXIS);
			drawables[29].turn(90,X_AXIS);
			drawables[9].turn(90,X_AXIS);
			drawables[19].turn(90,X_AXIS);	
			drawables[13].turn(90,X_AXIS);	
			
			temp[0] = drawables[15];
			temp[1] = drawables[5];
			temp[2] = drawables[25];
			temp[3] = drawables[23];
			temp[4] = drawables[29];
			temp[5] = drawables[9];
			temp[6] = drawables[19];
			temp[7] = drawables[13];
			
			drawables[25] = temp[0];
			drawables[23] = temp[1];
			drawables[29] = temp[2];
			drawables[9] = temp[3];
			drawables[19] = temp[4];
			drawables[13] = temp[5];
			drawables[15] = temp[6];
			drawables[5] = temp[7];
			
			drawables[15].turn(90,X_AXIS);	
			drawables[5].turn(90,X_AXIS);
			drawables[25].turn(90,X_AXIS);
			drawables[23].turn(90,X_AXIS);
			drawables[29].turn(90,X_AXIS);
			drawables[9].turn(90,X_AXIS);
			drawables[19].turn(90,X_AXIS);	
			drawables[13].turn(90,X_AXIS);	
			
			temp[0] = drawables[15];
			temp[1] = drawables[5];
			temp[2] = drawables[25];
			temp[3] = drawables[23];
			temp[4] = drawables[29];
			temp[5] = drawables[9];
			temp[6] = drawables[19];
			temp[7] = drawables[13];
			
			drawables[25] = temp[0];
			drawables[23] = temp[1];
			drawables[29] = temp[2];
			drawables[9] = temp[3];
			drawables[19] = temp[4];
			drawables[13] = temp[5];
			drawables[15] = temp[6];
			drawables[5] = temp[7];
			
			drawables[15].turn(90,X_AXIS);	
			drawables[5].turn(90,X_AXIS);
			drawables[25].turn(90,X_AXIS);
			drawables[23].turn(90,X_AXIS);
			drawables[29].turn(90,X_AXIS);
			drawables[9].turn(90,X_AXIS);
			drawables[19].turn(90,X_AXIS);	
			drawables[13].turn(90,X_AXIS);	
			
			temp[0] = drawables[15];
			temp[1] = drawables[5];
			temp[2] = drawables[25];
			temp[3] = drawables[23];
			temp[4] = drawables[29];
			temp[5] = drawables[9];
			temp[6] = drawables[19];
			temp[7] = drawables[13];
			
			drawables[25] = temp[0];
			drawables[23] = temp[1];
			drawables[29] = temp[2];
			drawables[9] = temp[3];
			drawables[19] = temp[4];
			drawables[13] = temp[5];
			drawables[15] = temp[6];
			drawables[5] = temp[7];
			
			}else if (a[i].substring(0,1) == "Y")
			{
			
			drawables[19].turn(-90,Z_AXIS);
			drawables[12].turn(-90,Z_AXIS);
			drawables[18].turn(-90,Z_AXIS);
			drawables[14].turn(-90,Z_AXIS);
			drawables[17].turn(-90,Z_AXIS);
			drawables[10].turn(-90,Z_AXIS);
			drawables[15].turn(-90,Z_AXIS);	
			drawables[13].turn(-90,Z_AXIS);
			
			temp[0] = drawables[19];
			temp[1] = drawables[12];
			temp[2] = drawables[18];
			temp[3] = drawables[14];
			temp[4] = drawables[17];
			temp[5] = drawables[10];
			temp[6] = drawables[15];
			temp[7] = drawables[13];
			
			drawables[18] = temp[0];
			drawables[14] = temp[1];
			drawables[17] = temp[2];
			drawables[10] = temp[3];
			drawables[15] = temp[4];
			drawables[13] = temp[5];
			drawables[19] = temp[6];
			drawables[12] = temp[7];
			
			drawables[19].turn(-90,Z_AXIS);
			drawables[12].turn(-90,Z_AXIS);
			drawables[18].turn(-90,Z_AXIS);
			drawables[14].turn(-90,Z_AXIS);
			drawables[17].turn(-90,Z_AXIS);
			drawables[10].turn(-90,Z_AXIS);
			drawables[15].turn(-90,Z_AXIS);	
			drawables[13].turn(-90,Z_AXIS);
			
			temp[0] = drawables[19];
			temp[1] = drawables[12];
			temp[2] = drawables[18];
			temp[3] = drawables[14];
			temp[4] = drawables[17];
			temp[5] = drawables[10];
			temp[6] = drawables[15];
			temp[7] = drawables[13];
			
			drawables[18] = temp[0];
			drawables[14] = temp[1];
			drawables[17] = temp[2];
			drawables[10] = temp[3];
			drawables[15] = temp[4];
			drawables[13] = temp[5];
			drawables[19] = temp[6];
			drawables[12] = temp[7];
			
			drawables[19].turn(-90,Z_AXIS);
			drawables[12].turn(-90,Z_AXIS);
			drawables[18].turn(-90,Z_AXIS);
			drawables[14].turn(-90,Z_AXIS);
			drawables[17].turn(-90,Z_AXIS);
			drawables[10].turn(-90,Z_AXIS);
			drawables[15].turn(-90,Z_AXIS);	
			drawables[13].turn(-90,Z_AXIS);
			
			temp[0] = drawables[19];
			temp[1] = drawables[12];
			temp[2] = drawables[18];
			temp[3] = drawables[14];
			temp[4] = drawables[17];
			temp[5] = drawables[10];
			temp[6] = drawables[15];
			temp[7] = drawables[13];
			
			drawables[18] = temp[0];
			drawables[14] = temp[1];
			drawables[17] = temp[2];
			drawables[10] = temp[3];
			drawables[15] = temp[4];
			drawables[13] = temp[5];
			drawables[19] = temp[6];
			drawables[12] = temp[7];
			
			}
		
		}
	}
	

}

/* Set up event callback to start the application */
window.onload = function() {
    
	initGL(); // basic WebGL setup for the scene 

    // load and compile our shaders into a program object
    var shaders = initShaders( gl, "vertex-shader", "fragment-shader" );
 
	// middle
    for(var i = 0; i<=9; i++)
	{
    	left = drawables.push(new Cube(shaders));
   	}
   	drawables[1].move(1.01,Y_AXIS);
   	drawables[2].move(-1.01,Y_AXIS);
   	drawables[3].move(1.01,X_AXIS);
   	drawables[4].move(-1.01,X_AXIS);
   	drawables[5].move(1.01,X_AXIS);
   	drawables[5].move(1.01,Y_AXIS);
   	drawables[6].move(-1.01,X_AXIS);
   	drawables[6].move(1.01,Y_AXIS);
   	drawables[8].move(-1.01,X_AXIS);
   	drawables[8].move(-1.01,Y_AXIS);
  	drawables[9].move(1.01,X_AXIS);
   	drawables[9].move(-1.01,Y_AXIS);
   	
	//front
   	for(var i = 10; i<=19; i++)
	{
		drawables.push(new Cube(shaders));
    	left = drawables[i].move(-1.01,Z_AXIS);
   	}
   	drawables[10].move(1.01,Y_AXIS);
   	drawables[12].move(-1.01,Y_AXIS);
   	drawables[13].move(1.01,X_AXIS);
   	drawables[14].move(-1.01,X_AXIS);
   	drawables[15].move(1.01,X_AXIS);
   	drawables[15].move(1.01,Y_AXIS);
   	drawables[16].move(1.01,Z_AXIS);
   	drawables[17].move(1.01,Y_AXIS);
   	drawables[17].move(-1.01,X_AXIS);
   	drawables[18].move(-1.01,X_AXIS);
   	drawables[18].move(-1.01,Y_AXIS);
   	drawables[19].move(1.01,X_AXIS);
   	drawables[19].move(-1.01,Y_AXIS);
   	
   	//back
	for(var i = 20; i<=29; i++)
	{
		drawables.push(new Cube(shaders));
    	left = drawables[i].move(1.01,Z_AXIS);
   	}
    drawables[21].move(1.01,Y_AXIS);
   	drawables[22].move(-1.01,Y_AXIS);
   	drawables[23].move(1.01,X_AXIS);
   	drawables[24].move(-1.01,X_AXIS);
   	drawables[25].move(1.01,X_AXIS);
   	drawables[25].move(1.01,Y_AXIS);
   	drawables[26].move(-1.01,X_AXIS);
   	drawables[26].move(1.01,Y_AXIS);
   	drawables[27].move(-1.01,Z_AXIS);
   	drawables[28].move(-1.01,X_AXIS);
   	drawables[28].move(-1.01,Y_AXIS);
   	drawables[29].move(1.01,X_AXIS);
   	drawables[29].move(-1.01,Y_AXIS);
	
    renderScene(); // begin render loop
    
	//solve button pressed, call solve function adequately named blah
   var x = document.getElementById("Btn_SOLVE");
    x.addEventListener("click",
    function(){
	blah();
	},
        false
    );
	
	
function blah() 
{	
	//process the solution string
	var sa = solstring;
	var patt = new RegExp('.{1,'+2+'}', 'g');
	//var patt2 = new RegExp('.{1,'+1+'}', 'g');
	var a = sa.match(patt);
	
	for (var j=0;j<a.length;j++)
	{
		if (a[j].substring(1,2) == 1)
		{
			bz.push(a[j].substring(0,1));
			
		}else if( a[j].substring(1,2) == 2)
		{
			bz.push(a[j].substring(0,1));
			bz.push(a[j].substring(0,1));
			
		}else if( a[j].substring(1,2) == 3)
		{
			bz.push(a[j].substring(0,1));
			bz.push(a[j].substring(0,1));
			bz.push(a[j].substring(0,1));
		}
	}
	
	index = 0;
	
	loadSlow();
	
	function loadSlow()
	{
	
	if (index < bz.length)
	{
		//check if the previous turn is done
		if (done == true)
		{
			//Based on color, turns a different face
			if (bz[index] == "R")
			{
			document.getElementById("Btn_TR").click();
			done = false;
				
			}else if (bz[index] == "W")
			{
			
			document.getElementById("Btn_LR").click();
			done = false;
			
			}else if (bz[index] == "G")
			{
			
			document.getElementById("Btn_FR").click();
			
			done = false;

			}else if (bz[index] == "O")
			{
			document.getElementById("Btn_BL").click();
			done = false;
	
			}else if (bz[index] == "B")
			{
			document.getElementById("Btn_BR").click();
			done = false;

			}else if (bz[index] == "Y")
			{
			document.getElementById("Btn_RR").click();
			done = false;

			}
			
			index++;
			loadSlow();
	
		}else{setTimeout(function(){loadSlow();}, 500);}
	
	}
	
	}
	}
	
	//spins the top RED face
   var a = document.getElementById("Btn_TR");
   a.hidden = true;
    a.addEventListener("click",
        function(){
            drawables[1].spin(90,Y_AXIS); //middle of top
			//RED FACE
			//outside of top
			drawables[5].spin(90,Y_AXIS);
			drawables[15].spin(90,Y_AXIS);
			drawables[10].spin(90,Y_AXIS);			
			drawables[17].spin(90,Y_AXIS);
			drawables[6].spin(90,Y_AXIS);
			drawables[26].spin(90,Y_AXIS);
			drawables[21].spin(90,Y_AXIS);
			drawables[25].spin(90,Y_AXIS);

			temp[0] = drawables[5];
			temp[1] = drawables[15];
			temp[2] = drawables[10];
			temp[3] = drawables[17];
			temp[4] = drawables[6];
			temp[5] = drawables[26];
			temp[6] = drawables[21];
			temp[7] = drawables[25];
			
			drawables[10] = temp[0];
			drawables[17] = temp[1];
			drawables[6] = temp[2];
			drawables[26] = temp[3];
			drawables[21] = temp[4];
			drawables[25] = temp[5];
			drawables[5] = temp[6];
			drawables[15] = temp[7];
			
				
        },
        false
    );

	
	    // spins the bottom ORANGE face
   var b = document.getElementById("Btn_BL");
   b.hidden = true;
    b.addEventListener("click",
        function(){
			drawables[2].spin(-90,Y_AXIS); //middle of bot
			//ORANGE FACE
			//outside of bot
			drawables[19].spin(-90,Y_AXIS);
			drawables[9].spin(-90,Y_AXIS);
			drawables[29].spin(-90,Y_AXIS);
			drawables[22].spin(-90,Y_AXIS);
			drawables[28].spin(-90,Y_AXIS);
			drawables[8].spin(-90,Y_AXIS);
			drawables[18].spin(-90,Y_AXIS);
			drawables[12].spin(-90,Y_AXIS);
			
			
			
			temp[0] = drawables[19];
			temp[1] = drawables[9];
			temp[2] = drawables[29];
			temp[3] = drawables[22];
			temp[4] = drawables[28];
			temp[5] = drawables[8];
			temp[6] = drawables[18];
			temp[7] = drawables[12];
			
			drawables[29] = temp[0];
			drawables[22] = temp[1];
			drawables[28] = temp[2];
			drawables[8] = temp[3];
			drawables[18] = temp[4];
			drawables[12] = temp[5];
			drawables[19] = temp[6];
			drawables[9] = temp[7];
			
        },
        false
    );
	
	//spins the left WHITE face
		var c = document.getElementById("Btn_LR");
		c.hidden = true;
    c.addEventListener("click",
        function(){
            drawables[20].spin(90,Z_AXIS); //middle of left
			//outside of left
			//WHITE FACE
			drawables[23].spin(90,Z_AXIS);
			drawables[25].spin(90,Z_AXIS);
			drawables[21].spin(90,Z_AXIS);
			drawables[26].spin(90,Z_AXIS);
			drawables[24].spin(90,Z_AXIS);	
			drawables[28].spin(90,Z_AXIS);
			drawables[22].spin(90,Z_AXIS);
			drawables[29].spin(90,Z_AXIS);

			
			temp[0] = drawables[23];
			temp[1] = drawables[25];
			temp[2] = drawables[21];
			temp[3] = drawables[26];
			temp[4] = drawables[24];
			temp[5] = drawables[28];
			temp[6] = drawables[22];
			temp[7] = drawables[29];
			
			drawables[21] = temp[0];
			drawables[26] = temp[1];
			drawables[24] = temp[2];
			drawables[28] = temp[3];
			drawables[22] = temp[4];
			drawables[29] = temp[5];
			drawables[23] = temp[6];
			drawables[25] = temp[7];
        },
        false
    );
	
	//spins the right YELLOW face
	var d = document.getElementById("Btn_RR");
	d.hidden = true;
    d.addEventListener("click",
        function(){
            drawables[11].spin(-90,Z_AXIS); //middle of right
			//outside of right
			//YELLOW FACE
			drawables[19].spin(-90,Z_AXIS);
			drawables[12].spin(-90,Z_AXIS);
			drawables[18].spin(-90,Z_AXIS);
			drawables[14].spin(-90,Z_AXIS);
			drawables[17].spin(-90,Z_AXIS);
			drawables[10].spin(-90,Z_AXIS);
			drawables[15].spin(-90,Z_AXIS);	
			drawables[13].spin(-90,Z_AXIS);

			
			temp[0] = drawables[19];
			temp[1] = drawables[12];
			temp[2] = drawables[18];
			temp[3] = drawables[14];
			temp[4] = drawables[17];
			temp[5] = drawables[10];
			temp[6] = drawables[15];
			temp[7] = drawables[13];
			
			drawables[18] = temp[0];
			drawables[14] = temp[1];
			drawables[17] = temp[2];
			drawables[10] = temp[3];
			drawables[15] = temp[4];
			drawables[13] = temp[5];
			drawables[19] = temp[6];
			drawables[12] = temp[7];
        },
        false
    );
	
	//spins the front GREEN face
	var e = document.getElementById("Btn_FR");
	e.hidden = true;
    e.addEventListener("click",
        function(){
            drawables[4].spin(-90,X_AXIS); //middle of front
			//outside of front
			//GREEN FACE
			drawables[18].spin(-90,X_AXIS);
			drawables[8].spin(-90,X_AXIS);
			drawables[28].spin(-90,X_AXIS);			
			drawables[24].spin(-90,X_AXIS);
			drawables[26].spin(-90,X_AXIS);
			drawables[6].spin(-90,X_AXIS);
			drawables[17].spin(-90,X_AXIS);	
			drawables[14].spin(-90,X_AXIS);

			
			temp[0] = drawables[18];
			temp[1] = drawables[8];
			temp[2] = drawables[28];
			temp[3] = drawables[24];
			temp[4] = drawables[26];
			temp[5] = drawables[6];
			temp[6] = drawables[17];
			temp[7] = drawables[14];
			
			drawables[28] = temp[0];
			drawables[24] = temp[1];
			drawables[26] = temp[2];
			drawables[6] = temp[3];
			drawables[17] = temp[4];
			drawables[14] = temp[5];
			drawables[18] = temp[6];
			drawables[8] = temp[7];
        },
        false
    );
	
	//spins the back BLUE face
	var f = document.getElementById("Btn_BR");
	f.hidden = true;
    f.addEventListener("click",
        function(){
            drawables[3].spin(90,X_AXIS); //middle of back
			//outside of back
			//BLUE FACE
			drawables[15].spin(90,X_AXIS);	
			drawables[5].spin(90,X_AXIS);
			drawables[25].spin(90,X_AXIS);
			drawables[23].spin(90,X_AXIS);
			drawables[29].spin(90,X_AXIS);
			drawables[9].spin(90,X_AXIS);
			drawables[19].spin(90,X_AXIS);	
			drawables[13].spin(90,X_AXIS);	

			
			temp[0] = drawables[15];
			temp[1] = drawables[5];
			temp[2] = drawables[25];
			temp[3] = drawables[23];
			temp[4] = drawables[29];
			temp[5] = drawables[9];
			temp[6] = drawables[19];
			temp[7] = drawables[13];
			
			drawables[25] = temp[0];
			drawables[23] = temp[1];
			drawables[29] = temp[2];
			drawables[9] = temp[3];
			drawables[19] = temp[4];
			drawables[13] = temp[5];
			drawables[15] = temp[6];
			drawables[5] = temp[7];
        },
        false
    );
	
	//loads the program
	var g = document.getElementById("Btn_LOAD");
    g.addEventListener("click",
        function(){
			strang = document.getElementById("inputbox").value;
			//console.log(strang);
			solstring = strang;
			setstate(solstring);
        },
        false
    );
	
	//spins the orthographic projection around by 20 degrees. My favorite.
	var h = document.getElementById("Btn_SPIN");
    h.addEventListener("click",
        function(){
				spinnum+=20;
				
				projection = ortho(3, -3, -3, 3, -100, 100);
				projection = mult(projection, rotate(spinnum, [0.1, 1, 0.12]));
        },
        false
    );

		//makes an orthographic projection
	    var c = document.getElementById("Btn_OP");
    c.addEventListener("click",
        function(){
			projection = ortho(-3, 3, -3, 3, -100, 100);
			projection = mult(projection, rotate(30, [0.5, 1, 0.12]));
        },
        false
    );
	
	//makes a bad perspective projection
	   var d = document.getElementById("Btn_PP");
    d.addEventListener("click",
        function(){
			    projection = perspective(160, 1, .5, 100);
        },
        false
    );

}


