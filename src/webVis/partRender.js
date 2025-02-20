;





/**
*
* Returns a normal material for meshes if the global variable "standard" is false. If "standard"
* is set to true, returns a chromadepth material instead.
*
* @method getStdMaterial
* @for renderGlobal
* @return {Object}
*
*/
function getStdMaterial(){

	if(standard === true){

		return new THREE.ShaderMaterial({
					vertexShader: document.querySelector('#chroma-vert').textContent.trim(),
					fragmentShader: document.querySelector('#chroma-frag').textContent.trim(),
					uniforms: {
						cameraNear: { value: camera.near },
						cameraFar:  { value: camera.far }
					}
				});

	}
	else{

		return new THREE.MeshNormalMaterial({transparent: true} );

	}

}


function getGridMaterial(){

	return new THREE.ShaderMaterial({
		vertexShader: document.querySelector('#grid-vert').textContent.trim(),
		fragmentShader: document.querySelector('#grid-frag').textContent.trim()
	});

}



/**
*
* Returns a normal material for lines if the global variable "standard" is false. If "standard"
* is set to true, returns a chromadepth material instead.
*
* @method getStdMaterial
* @for renderGlobal
* @return {Object}
*
*/
function getStdLine(){

	if(standard === true){

		return new THREE.ShaderMaterial({
					vertexShader: document.querySelector('#chroma-vert').textContent.trim(),
					fragmentShader: document.querySelector('#chroma-frag').textContent.trim(),
					uniforms: {
						cameraNear: { value: camera.near },
						cameraFar:  { value: camera.far }
					}
				});

	}
	else{

		return new THREE.LineDashedMaterial({
					color: 0x333333,
					dashSize: 50,
					gapSize:50

				})

	}



}

/**
*
* Accepts an array of objects containing a string property called "Name" and returns
* the first index where any two "Name" properties in the array have different characters.
*
*
* @method getPartNameCutoff
* @for renderGlobal
* @param {Object Array} partFrames An array of objects, each of which should containin
* a property called "Name" with a non-null string.
* @return {Int} The first index where any two "Name" properties in the array are different.
*
*/
function getPartNameCutoff(partFrames){

	var pos=1;
	var lim=partFrames.length;
	var checkPos;
	var checkLim=partFrames[0].Name.length;
	while(pos<lim){
		checkPos=0;
		while(checkPos<checkLim){
			if(partFrames[pos].Name[checkPos]!=partFrames[0].Name[checkPos]){
				checkLim=checkPos;
			}
			checkPos++;
		}
		pos++;
	}

	return checkLim;

}


/**
*
* Accepts an array of objects containing a string property called "Name" removes
* the first N characters in each string, where N is the first index where any two
* "Name" properties in the array have different characters.
*
*
* @method cutoffPartNames
* @for renderGlobal
* @param {Object Array} partFrames An array of objects, each of which should containin
* a property called "Name" with a non-null string.
* @return {Void}
*
*/
function cutoffPartNames(partFrames){

	var cut=getPartNameCutoff(partFrames);

	var pos=0;
	var lim=partFrames.length;
	while(pos<lim){
		partFrames[pos].Name=partFrames[pos].Name.substr(cut,partFrames[pos].Name.length-(cut+4));
		pos++;
	}

}


/**
*
* Finds the average position of all the vertices in a given threeJS Geometry model.
*
* @method centerGeometry
* @for renderGlobal
* @param {threeJS Geometry Object} theGeo
* @return {threeJS Vector3 Object} A 3d coordinate, with each component being the unweighted
* average of the corresponding component in each vector in the provided geometry object. If nodeName
* vertices are present in the object, a zeroed vector is returned.
*
*/
function centerGeometry(theGeo){

	var verts=theGeo.vertices;
	var pos=0;
	var lim=verts.length;
	var avgX=0;
	var avgY=0;
	var avgZ=0;
	if(lim==0){
		return new THREE.Vector3(avgX,avgY,avgZ);
	}
	while(pos<lim){
		avgX+=verts[pos].x;
		avgY+=verts[pos].y;
		avgZ+=verts[pos].z;
		pos++;
	}



	avgX/=lim;
	avgY/=lim;
	avgZ/=lim;
	pos=0;
	while(pos<lim){
		verts[pos].x-=avgX;
		verts[pos].y-=avgY;
		verts[pos].z-=avgZ;
		pos++;
	}

	return new THREE.Vector3(avgX,avgY,avgZ);

}




/**
*
* Accepts a list of binary stl buffer objects and returns a corresponding list
* of ThreeJS objects.
*
* @method getGeometries
* @for renderGlobal
* @param {Buffer Object List} theSTLs
* @return {ThreeJS Object List}
*
*/
function getGeometries(theSTLs){

	var result=[];
	var pos=0;
	var lim=theSTLs.length;
	while(pos<lim){
		result.push(parseStlBinary(theSTLs[pos]));
		pos++;
	}
	return result;

}




/**
*
* Combines a given array of objects (each associating an array of keyframes to name) with a
* given array of objects (each associating a threeJS mesh with a name), creating an array
* of objects with keyFrame arrays and threeJS meshes associated with the same name
*
* @method bindPartsToKeyFrames
* @for renderGlobal
* @param {Array} theKeyFrameLists An array of objects, each containing an array of keyframe objects
* called "Frames" and a string property called "Name")
* @param {Array} theParts An array of objects, each containing a threeJS mesh object called "Mesh" and
* a string property called "Name"
* @return {Array}
*
*/
function bindPartsToKeyFrames(theKeyFrameLists, theParts){

	//console.log(theKeyFrameLists);
	//console.log (theParts);

	var pos=0;
	var searchPos;
	var lim=theKeyFrameLists.length;
	var searchLim=theParts.length;
	var result=[];



	while(pos<lim){
		searchPos=0;
		while(searchPos<searchLim){
			//console.log(theKeyFrameLists[pos].Name+" -- "+theParts[searchPos].Name);
			if(theKeyFrameLists[pos].Name===theParts[searchPos].Name ||
			   theKeyFrameLists[pos].Name+".STL"===theParts[searchPos].Name ||
			   theKeyFrameLists[pos].Name===theParts[searchPos].Name+".STL"){
				   //console.log("===========");
				break;
			}
			searchPos++;
		}
		if(searchPos==searchLim){
			pos++;
			continue;
		}
		theParts[searchPos].Mesh.material.transparent = true;
		console.log(theParts[searchPos].Mesh);
		result.push({
			Name: theKeyFrameLists[pos].Name,
			Frames: theKeyFrameLists[pos].Frames,
			Mesh: theParts[searchPos].Mesh
		});
		/*console.log({
			Name: theKeyFrameLists[pos].Name,
			Frames: theKeyFrameLists[pos].Frames,
			Mesh: theParts[searchPos].Mesh
		});*/
		pos++;
	}

	flipTheTimes(result);

	return result;

}



/**
*
* Combines a jagged array of objects, each object at least possessing a numeric
* property called "Time", returns the value of the greatest "Time" property
*
* @method longestTimeFromFrames
* @for renderGlobal
* @param {Array} partFrames The jagged array
* @return {Int} The greatest "Time" value in the jagged array
*
*/
function longestTimeFromFrames(partFrames){

	var x=0;
	var y;
	var xLim=partFrames.length;
	var yLim;
	var best=0;
	while(x<xLim){
		y=0;
		yLim=partFrames[x].Frames.length;
		while(y<yLim){
			best=Math.max(best,partFrames[x].Frames[y].Time);
			y++;
		}
		x++;
	}
	//console.log(best);
	return best;

}


/**
*
* Given a jagged array of objects, each object at least possessing a numeric
* property called "Time", sets each Time property to the greatest Time value in
* the jagged array minus the origional value, thus effectively reversing the
* temporal order of each object
*
* @method flipTheTimes
* @for renderGlobal
* @param {Array} partFrames The jagged array
* @return {Int} The greatest "Time" value in the jagged array
*
*/
function flipTheTimes(partFrames){

	var x=0;
	var y;
	var xLim=partFrames.length;
	var yLim;
	var tFlip=longestTimeFromFrames(partFrames);
	while(x<xLim){
		y=0;
		yLim=partFrames[x].Frames.length;
		while(y<yLim){
			partFrames[x].Frames[y].Time=tFlip-partFrames[x].Frames[y].Time;
			y++;
		}
		partFrames[x].Frames.reverse();
		x++;
	}
	return;

}


/**
*
* Logs the contents of the given jagged array of keyFrame objects, each containing numeric properties "X",
* "Y", "Z", and "Time", to the console as a string.
*
* @method showFrames
* @for renderGlobal
* @param {Array} partFrames A jagged array of keyframe objects
* @return {Void}
*
*/
function showFrames(partFrames){

	var x=0;
	var y;
	var xLim=partFrames.length;
	var yLim;
	var tFlip=longestTimeFromFrames(partFrames);
	var timeList;
	var listList=[];
	while(x<xLim){
		timeList=[];
		y=0;
		yLim=partFrames[x].Frames.length;
		while(y<yLim){
			theFrame=partFrames[x].Frames[y];
			timeList.push("X: "+theFrame.Position.x+" Y: "+theFrame.Position.y+" Z: "+theFrame.Position.z+" Time: "+theFrame.Time);
			y++;
		}
		listList.push(timeList);
		x++;
	}

	return;

}


/**
*
* Logs the contents of a given keyFrame object, containing numeric properties "X",
* "Y", "Z", and "Time", to the console as a string.
*
* @method showFrame
* @for renderGlobal
* @param {Array} theFrame the keyFrame object to be logged
* @return {Void}
*
*/
function sayFrame(theFrame){

	console.log("X: "+theFrame.Position.x+" Y: "+theFrame.Position.y+" Z: "+theFrame.Position.z+" Time: "+theFrame.Time);

}


/**
*
* Returns true if any position component of the given keyframe object is NaN
*
* @method hasNaN
* @for renderGlobal
* @param {Object} theFrame A keyFrame object
* @return {Boolean}
*
*/
function hasNaN(theFrame){

	return (isNaN(theFrame.Position.x) || isNaN(theFrame.Position.y) || isNaN(theFrame.Position.z));

}


/**
*
* Returns a copy of the provided keyframe object
*
* @method copyFrame
* @for renderGlobal
* @param {Object} theFrame A keyFrame object
* @return {Object} The copy
*
*/
function copyFrame(theFrame){
	var result={
		Quat: new THREE.Quaternion(0,0,0,0),
		Position: null,
		TreePosition: null,
		Time: null,
		Alpha: 1.0
	}

	//console.log(theFrame);

	result.Quat.copy(theFrame.Quat);
	result.Position=theFrame.Position.clone();
	result.TreePosition=theFrame.TreePosition.clone();
	result.Time=theFrame.Time;
	result.Alpha = theFrame.Alpha;

	return result;
}


/**
*
* Returns a copy of the provided array of keyframe objects
*
* @method copyFrameList
* @for renderGlobal
* @param {Array} partFrames A keyFrame object array
* @return {Array} The copy
*
*/
function copyFrameList (theFrameList){

	var pos=0;
	var lim=theFrameList.length;
	var result=[];
	while(pos<lim){
		result.push(copyFrame(theFrameList[pos]));
		pos++;
	}

	return result;

}





/**
*
* Creates a keyframe list for the given fastener object and adds it to currentFrameList
*
* @method makeFastenerKeyFrames
* @for renderGlobal
* @param {Object} theFst The object representation of the fastener being keyframed
* @param {Object List} runningList The current running list of keyframes
* @param {Object List} currentFrameList The list of part-keyframe list objects
* @return {Void}
*
*/
function makeFastenerKeyFrames(theFst,runningList,currentFrameList){

	var newQuat= new THREE.Quaternion();
	newQuat.setFromEuler(new THREE.Euler(0,0,0,'XYZ'));

	var presentFrame={
						Quat: newQuat,
						Position: new THREE.Vector3(theFst.X,theFst.Y,theFst.Z),
						TreePosition: theFst.TreePosition,
						Time: theFst.Time,
						Alpha: 1
					};


	runningList.push(presentFrame);

	var copiedList= copyFrameList(runningList);
	//console.log("-----------");
	if(copiedList.length===1){
		copiedList.length = 2;
		copiedList[1] = copiedList[0];
		copiedList[0] = {
						Quat: newQuat,
						Position: new THREE.Vector3(0.0,0.0,0.0),
						TreePosition: new THREE.Vector3(0.0,0.0,0.0),
						Time: 0.00,
						Alpha: 1
					};
	}
	currentFrameList.push({Name: theFst.Name, Frames: copiedList});

	console.log({Name: theFst.Name, Frames: copiedList});
	runningList.pop();

	return;

}


/**
*
* Given a tree representation of the assembly process through nested javascript objects, returns an array
* of keyframe array objects, with each keyframe array object being a representation of the movement of each part
* in the tree representation throughout the assembly proceess, with a list of keyframe objects and a given part name
*
* @method makeKeyFrames
* @for renderGlobal
* @param {Object} theTree Tree representation of the assembly process through nested javascript objects
* @param {Array} runningList Internally used variable. Should be an empty array for outside use.
* @param {Array} currentFrameList Internally used variable. Should be an empty array for outside use.
* @return {Array} The jagged array of keyFrame objects
*
*/
function makeKeyFrames(theTree, runningList, currentFrameList){

	var isRoot=0;
	if(runningList.length==0){
		isRoot=1;
		console.log("ROOT");
		console.log(theTree);
	}

	//console.log(theTree);

	var newQuat= new THREE.Quaternion();
	newQuat.setFromEuler(new THREE.Euler(0,0,0,'XYZ'));



	var presentFrame = {
						Quat: newQuat,
						Position: new THREE.Vector3(theTree.X,theTree.Y,theTree.Z),
						TreePosition: theTree.TreePosition.clone(),
						Time: theTree.Time,
						Alpha: 1.0
					};


	runningList.push(presentFrame);

	if(theTree.Ref === null){
		var copiedList= copyFrameList(runningList);
		//console.log("-----------");
		currentFrameList.push({Name: theTree.Name, Frames: copiedList});
		runningList.pop();
	}
	else{
		makeKeyFrames(theTree.Ref,runningList,currentFrameList);
		makeKeyFrames(theTree.Mov,runningList,currentFrameList);
		runningList.pop();
	}

	var pos = 0;
	var lim = theTree.Fst.length;
	while(pos<lim){
		makeFastenerKeyFrames(theTree.Fst[pos],runningList,currentFrameList);
		pos++;
	}


	if(isRoot===1){
		//console.log(currentFrameList);
		return currentFrameList;
	}
	return;

}



/**
*
* Given two keyFrames and a normalized float "proportion", returns an interpolation
* between the two keyframes with a weight towards the second keyframe proportional
* to "proportion"
*
* @method interpolate
* @for renderGlobal
* @param {Object} keyFrame1 The earlier keyFrame
* @param {Object} keyFrame2 The later keyFrame
* @param {Float} proportion A normalized value representing what proportion of the path of
* interpolation is between the result and the earlier keyFrame
* @return {Object} The jagged array of keyFrame objects
*
*/
function interpolate(keyFrame1, keyFrame2, proportion){

	var result={ Quat: new THREE.Quaternion(), Position: new THREE.Vector3(0,0,0), Time: null, Alpha: 1.0 };

	THREE.Quaternion.slerp (keyFrame1.Quat, keyFrame2.Quat, result.Quat, proportion);
	//result.Position.lerp(keyFrame1.Position,keyFrame2.Position,proportion);
	result.Position.x=keyFrame1.Position.x*(1-proportion)+keyFrame2.Position.x*proportion;
	result.Position.y=keyFrame1.Position.y*(1-proportion)+keyFrame2.Position.y*proportion;
	result.Position.z=keyFrame1.Position.z*(1-proportion)+keyFrame2.Position.z*proportion;
	result.TreePosition = keyFrame1.TreePosition.clone().lerp(keyFrame2.TreePosition.clone(),proportion),
	result.Time=keyFrame1.Time*(1-proportion)+keyFrame2.Time*proportion;
	result.Alpha=keyFrame1.Alpha*(1-proportion)+keyFrame2.Alpha*proportion;
	/*
	if(hasNaN(result)){
		console.log("vvvvvvvvvvvv");
		console.log("Prop: "+proportion);
		sayFrame(keyFrame1);
		sayFrame(keyFrame2);
		sayFrame(result);
		console.log("^^^^^^^^^^^^");
	}
	*/
	return result;

}



/**
*
* Given a list of keyframes and a time quantity, returns a keyframe object interpolating
* between the two temporally closest keyframes. In cases where the provide time is beyond the
* range of times represented by the list, returns the closest keyframe
*
* @method grabInterp
* @for renderGlobal
* @param {Array} frameList A list of keyframes. Must be organized from least time value to greatest time value
* @param {Float} time Floating-point representation of what time in the keyframe progression the interpolation
* should occur
* @return {Object} The interpolated keyframe
*
*/
function grabInterp(frameList, time){


	var pos=0;
	var lim=frameList.length;
	//var timeReport="";
	while((pos<lim) && (time>frameList[pos].Time)){
		//timeReport=timeReport+" -> "+frameList[pos].Time.toString();
		pos++;
	}


	/*if(pos<lim){
		timeReport=timeReport+" -> "+time+" <- "+frameList[pos].Time.toString();
	}
	else{
		timeReport=timeReport+" -> "+frameList[lim-1].Time.toString()+" -> "+time;
	}
	console.log(timeReport);*/

	if(pos==0){
		//console.log(time.toString()+"<"+frameList[0].Time.toString());
		var theResult= copyFrame(frameList[0]);

	}
	else if(pos==lim){
		//console.log(time.toString()+">"+frameList[lim-1].Time.toString());
		var theResult= copyFrame(frameList[lim-1]);
	}
	else{

		var prop=(time-frameList[pos-1].Time)/(frameList[pos].Time-frameList[pos-1].Time);
		var theResult=interpolate(frameList[pos-1],frameList[pos],prop);
	}

	//sayFrame(theResult);
	return theResult;

}



/**
*
* Given an array of objects (each containing a threeJS mesh object and an array of
* keyFrame objects), and two floating points "time" and "timeWarp", will animate each
* mesh in the array along the keyframes in their associate objects according to the
* given "time" and returns the new time as given by the standard time step multiplied
* by "timeWarp"
*
* @method animate
* @for renderGlobal
* @param {Array} partFrames List of objects relating threeJS mesh objects with their
* respective keyframe arrays
* @param {Float} time The time to be used when interpolating keyFrames for the models
* @param {Float} timeWarp The coefficeint to be applied to the timestep in the
* animation
* @return {Float} The new value of time in the animation
*
*/
function animate(partFrames, time, timeWarp, treeActive){

	var pos=0;
	var lim=partFrames.length;
	var interp;
	var eul= new THREE.Euler();
	var delt=new THREE.Vector3();
	while(pos<lim){

		interp=grabInterp(partFrames[pos].Frames,time,partFrames[pos].Mesh.position);

		eul.setFromQuaternion(interp.Quat);
		partFrames[pos].Mesh.rotation.x=eul.x;
		partFrames[pos].Mesh.rotation.y=eul.y;
		partFrames[pos].Mesh.rotation.z=eul.z;
		if(treeActive){
			partFrames[pos].Mesh.position.copy(interp.TreePosition)
		}
		else{
			partFrames[pos].Mesh.position.copy(interp.Position);
		}
		partFrames[pos].Mesh.material.opacity = interp.Alpha;

		pos++;
	}


	showFrames(partFrames);

	var timeStep=timeWarp/60;
	time+=timeStep;
	return time;

}




/**
*
* Given two threeJS boundingBox objects, returns the smallest bounding box
* encompassing the two
*
* @method combineBounds
* @for renderGlobal
* @param {Object} a The first bounding box
* @param {Object} b The second bounding box
* @return {Object} The combined bounds
*
*/
function combineBounds(a,b){

	var r={};
	r.min= new THREE.Vector3();
	r.max= new THREE.Vector3();
	r.min.x = Math.min(a.min.x,b.min.x);
	r.max.x= Math.max(a.max.x,b.max.x);
	r.min.y = Math.min(a.min.y,b.min.y);
	r.max.y= Math.max(a.max.y,b.max.y);
	r.min.z = Math.min(a.min.z,b.min.z);
	r.max.z= Math.max(a.max.z,b.max.z);
	return r;

}



/**
*
* Given two threeJS boundingBox objects, returns the smallest bounding box
* encompassing the two
*
* @method getGlobBounds
* @for renderGlobal
* @param {Object} a The first bounding box
* @param {Object} b The second bounding box
* @return {Object} The combined bounds
*
*/
function getGlobBounds(partFrames){


	partFrames[0].Mesh.geometry.computeBoundingBox();
	var runningBound=partFrames[0].Mesh.geometry.boundingBox;

	var pos=1;
	var lim=partFrames.length;
	while(pos<lim){
		partFrames[pos].Mesh.geometry.computeBoundingBox();
		runningBound=combineBounds(runningBound,partFrames[pos].Mesh.geometry.boundingBox);
		pos++;
	}

	return runningBound;

}





/**
*
* Given an object, containing a threeJS mesh object as "Mesh", will
* return the center of the mesh's bounding box
*
* @method getPartCenter
* @for renderGlobal
* @param {Object} a The object containing the threeJS mesh object
* @return {Object} The center of the mesh's bounding box, represented as
* a threeJS Vector3 object
*
*/
function getPartCenter(part){

	part.Mesh.geometry.computeBoundingBox();
	var bound=part.Mesh.geometry.boundingBox;
	var center= new THREE.Vector3((bound.min.x+bound.max.x)/2,(bound.min.y+bound.max.y)/2,(bound.min.z+bound.max.z)/2);
	center.x+=part.Mesh.position.x;
	center.y+=part.Mesh.position.y;
	center.z+=part.Mesh.position.z;

	return center;

}




/**
*
* Aligns the camera to look at the point at the average of the centers of all the parts bounding boxes
* @method alignAssemblyCenter
* @for renderGlobal
* @return {Void}
*
*/
function alignAssemblyCenter(){

	var pos = 0;
	var lim = partFrames.length;
	var result = new THREE.Vector3(0,0,0);
	while(pos<lim){
		result.add(getPartCenter(partFrames[pos]));
		pos++;
	}
	result.divideScalar(partFrames.length);
	result.sub(camera.position);
	result.normalize();
	camYaw = Math.atan2(result.x,result.z) - Math.PI;
	camPitch = Math.atan2(Math.pow(result.x*result.x+result.z*result.z,0.5),result.y);

}



/**
*
* Given a threeJS scene object, a threeJS camera object, and an array of objects containing
* threeJS mesh objects, finds the first mesh in the scene which is intersected the ray extending
* through the center of the camera's field of vision. If this mesh is in the provided array of
* objects, then that object is returned, otherwise null is returned instead
*
* @method getFirstIntersect
* @for renderGlobal
* @param {Object} theScene The threeJS scene object in which intersections should
* be tested
* @param {Object} theCamera The threeJS camera object to be used to test for
* ray intersections
* @param {Array} partFrames An array containing a series of objects, each of which
* contain a threeJS mesh object (under the property "Mesh") to be tested for intersections
* @return {Object} The intersecting mesh (or null in case of no valid intersection)
*
*/
function getFirstIntersect(theScene, theCamera, partFrames){

	var caster= new THREE.Raycaster();
	var mousePos= new THREE.Vector2(0,0);

	caster.setFromCamera(mousePos,theCamera);

	var intersectList=caster.intersectObjects(theScene.children);

	if(intersectList.length===0){
		return null;
	}
	else{
		var pos=0;
		var lim=partFrames.length;
		var part=intersectList[0].object;
		while(pos<lim){
			if(part===partFrames[pos].Mesh){
				return partFrames[pos];
			}
			pos++;
		}
		return null;
	}

}






/**
*
* Given an tree representation of the movement of parts in an assembly sequence, the
* parent node of that node, and a threeJS scene object, inserts a line for each subassembly
* path along the path of movement
*
* @method addLines
* @for renderGlobal
* @param {Object} movTree Tree of nested objects representing the movement of each subassembly
* in it's assembly sequence
* @param {Object} parentNode Used for internal use. Null should be applied for external use.
* @param {Object} theScene the threeJS scene to which the line representations will be added
* @return {Void}
*
*/
function addLines(movTree,parentNode,theScene,isMov){

	if(movTree==null){
		return;
	}
	else{
		if(parentNode!=null){
			var theGeo=new THREE.Geometry();
			var startP=new THREE.Vector3(movTree.X,movTree.Y,movTree.Z);
			var endP=new THREE.Vector3(parentNode.X,parentNode.Y,parentNode.Z);
			theGeo.vertices=[startP,endP];
			movTree.Line= new THREE.LineSegments(
				theGeo,
				getStdLine()
			);
			theScene.add(movTree.Line);

			var treeGeo=new THREE.Geometry();
			var treeStartP= movTree.TreePosition.clone();
			var treeEndP= parentNode.TreePosition.clone();
			treeGeo.vertices=[treeStartP,treeEndP];
			movTree.TreeLine= new THREE.LineSegments(
				treeGeo,
				getStdLine()
			);
			theScene.add(movTree.TreeLine);

		}
		else{
			movTree.Line= null;
			movTree.TreeLine = null;
		}
		addLines(movTree.Ref,movTree,theScene,false);
		addLines(movTree.Mov,movTree,theScene,true);
		var pos = 0;
		var lim = movTree.Fst.length;
		while(pos<lim){
			if(isMov || parentNode != null){
				addLines(movTree.Fst[pos],parentNode,theScene,false);
			}
			else{
				addLines(movTree.Fst[pos],movTree,theScene,false);
			}
			pos++;
		}

		return;
	}

}




/**
*
* Given an tree representation of the movement of parts in an assembly sequence, an
* array of Objects each associating a list of keyframes with a threeJS mesh object and aLinkcolor
* string, and the index of the keyframe associated with the tree's root node, displaces the movement
* line points associated with that particular part of the assembly to match the displacement of the
* model
*
* @method addDisplacement
* @for renderGlobal
* @param {Object} movTree Tree of nested objects representing the movement of each subassembly
* in it's assembly sequence
* @param {Array} partFrames An array of Objects each associating a list of keyframes with a threeJS
* mesh object and a string
* @param {Object} it The index of the keyframe associated with the root node of movTree. Used internally.
* For external use, apply 0.
* @return {Void}
*
*/
function addDisplacement(movTree, partFrames, it){

	if(movTree==null){
		return;
	}
	else{
		var ref=addDisplacement(movTree.Ref,partFrames,it);
		if(ref!=null){
			var mov=addDisplacement(movTree.Mov, partFrames, ref);
			var pos = 0;
			var lim = movTree.Fst.length;
			while(pos<lim){
				mov = addDisplacement(movTree.Fst[pos], partFrames, mov);
				pos++;
			}
			it=mov;
		}

		if(mov==null || ref==null){
			movTree.Disp=getPartCenter(partFrames[it]);
			it++;
		}
		else{
			movTree.Disp=new THREE.Vector3(0,0,0);
			movTree.Disp.lerpVectors(movTree.Ref.Disp,movTree.Mov.Disp,0.5);
		}
		if(movTree.Line!=null){
			movTree.Line.geometry.vertices[0].addVectors(movTree.Line.geometry.vertices[0],movTree.Disp);
			movTree.Line.geometry.vertices[1].addVectors(movTree.Line.geometry.vertices[1],movTree.Disp);
		}

		return it;
	}
}


/**
*
* Given an tree representation of the movement of parts in an assembly sequence, the
* parent node of that node, and the current time in the animation, updates the ends of the
* movement lines such that the portion of lines which have already been traversed are not shown
*
* @method updateLines
* @for renderGlobal
* @param {Object} movTree Tree of nested objects representing the movement of each subassembly
* in it's assembly sequence
* @param {Object} parentNode Used for internal use. Null should be applied for external use.
* @param {Object} theTime the threeeJS scene to which the line representations will be added
* @return {Void}
*
*/
function updateLines(movTree,parentNode,theTime, isMov, treeActive){

	if(movTree==null){
		return;
	}
	else{
		if(movTree.Line!=null && parentNode!=null){
			if(theTime<=parentNode.Time){
				if(theTime>=movTree.Time){
					var normTime=(parentNode.Time-theTime)/(parentNode.Time-movTree.Time);
					if(treeActive){
						movTree.TreeLine.geometry.vertices.add(movTree.Disp)[0] = movTree.TreePosition.clone()
						                                                        .lerp(parentNode.TreePosition,1-normTime);
						movTree.Line.geometry.vertices[0]=movTree.Line.geometry.vertices[1].clone();
					}
					else{
						movTree.Line.geometry.vertices[0].x= (movTree.X+movTree.Disp.x)*(normTime)+(parentNode.X+movTree.Disp.x)*(1-normTime);
						movTree.Line.geometry.vertices[0].y= (movTree.Y+movTree.Disp.y)*(normTime)+(parentNode.Y+movTree.Disp.y)*(1-normTime);
						movTree.Line.geometry.vertices[0].z= (movTree.Z+movTree.Disp.z)*(normTime)+(parentNode.Z+movTree.Disp.z)*(1-normTime);
						movTree.TreeLine.geometry.vertices[0]=movTree.TreeLine.geometry.vertices[1].clone();
					}
				}
				else{
						if(treeActive){
							movTree.TreeLine.geometry.vertices[0]= movTree.TreePosition.clone();
							movTree.Line.geometry.vertices[0]=movTree.Line.geometry.vertices[1].clone();
						}
						else{
							movTree.Line.geometry.vertices[0].x= movTree.X+movTree.Disp.x;
							movTree.Line.geometry.vertices[0].y= movTree.Y+movTree.Disp.y;
							movTree.Line.geometry.vertices[0].z= movTree.Z+movTree.Disp.z;
							movTree.TreeLine.geometry.vertices[0]=movTree.TreeLine.geometry.vertices[1].clone();
						}

				}
			}
			else{
				movTree.Line.geometry.vertices[0]=movTree.Line.geometry.vertices[1].clone();
				movTree.TreeLine.geometry.vertices[0]=movTree.TreeLine.geometry.vertices[1].clone();
			}
			movTree.Line.geometry.verticesNeedUpdate=true;
			movTree.TreeLine.geometry.verticesNeedUpdate=true;
		}

		updateLines(movTree.Ref,movTree,theTime,false,treeActive);
		updateLines(movTree.Mov,movTree,theTime,true,treeActive);

		var pos = 0;
		var lim = movTree.Fst.length;
		while(pos<lim){
			if( parentNode != null ){
				updateLines(movTree.Fst[pos],parentNode,theTime,false,treeActive);
			}
			else{
				updateLines(movTree.Fst[pos],movTree,theTime,false,treeActive);
			}
			pos++;
		}
		return;
	}

}




/**
*
* Initializes the axis lines for the bottom-left of the screen
*
* @method initAxisLines
* @for renderGlobal
* @return {Void}
*
*/
function initAxisLines(){

	theXAxis = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0xff0000, depthTest: false }));
	theXAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theXAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theXAxis.frustumCulled = false;

	theYAxis = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0x00ff00, depthTest: false }));
	theYAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theYAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theYAxis.frustumCulled = false;

	theZAxis = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0x0000ff, depthTest: false }));
	theZAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theZAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theZAxis.frustumCulled = false;

	xRet = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0x000000 }));
	xRet.geometry.vertices.push(new THREE.Vector3(0,0,0));
	xRet.geometry.vertices.push(new THREE.Vector3(0,0,0));
	xRet.frustumCulled = false;

	yRet = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0x000000 }));
	yRet.geometry.vertices.push(new THREE.Vector3(0,0,0));
	yRet.geometry.vertices.push(new THREE.Vector3(0,0,0));
	yRet.frustumCulled = false;

	scene.add(theXAxis);
	scene.add(theYAxis);
	scene.add(theZAxis);
	scene.add(xRet);
	scene.add(yRet);

}




/**
*
* Updates the axis line dispay
*
* @method updateAxisLines
* @for renderGlobal
* @return {Void}
*
*/
function updateAxisLines(){

	var theRot= new THREE.Quaternion(0,0,0,0);
	theRot.setFromEuler(camera.rotation);
	var theDir= new THREE.Vector3(-3,-3,-5);
	var retX0= new THREE.Vector3(-0.3,0,-5);
	var retX1= new THREE.Vector3(0.3,0,-5);
	var retY0= new THREE.Vector3(0,-0.08,-5);
	var retY1= new THREE.Vector3(0,0.08,-5);

	theDir.applyQuaternion(theRot);
	retX0.applyQuaternion(theRot);
	retX1.applyQuaternion(theRot);
	retY0.applyQuaternion(theRot);
	retY1.applyQuaternion(theRot);

	var thePosition = camera.position.clone();

	thePosition.add(theDir);

	theXAxis.geometry.vertices[0].copy(thePosition);
	theXAxis.geometry.vertices[0].x-=0.5;
	theXAxis.geometry.vertices[1].copy(thePosition);
	theXAxis.geometry.vertices[1].x+=1;
	theXAxis.geometry.verticesNeedUpdate=true;

	theYAxis.geometry.vertices[0].copy(thePosition);
	theYAxis.geometry.vertices[0].y-=0.5;
	theYAxis.geometry.vertices[1].copy(thePosition);
	theYAxis.geometry.vertices[1].y+=1;
	theYAxis.geometry.verticesNeedUpdate=true;

	theZAxis.geometry.vertices[0].copy(thePosition);
	theZAxis.geometry.vertices[0].z-=0.5;
	theZAxis.geometry.vertices[1].copy(thePosition);
	theZAxis.geometry.vertices[1].z+=1;
	theZAxis.geometry.verticesNeedUpdate=true;



	thePosition.copy(camera.position);
	thePosition.add(retX0);
	xRet.geometry.vertices[0].copy(thePosition);

	thePosition.copy(camera.position);
	thePosition.add(retX1);
	xRet.geometry.vertices[1].copy(thePosition);
	xRet.geometry.verticesNeedUpdate=true;

	thePosition.copy(camera.position);
	thePosition.add(retY0);
	yRet.geometry.vertices[0].copy(thePosition);

	thePosition.copy(camera.position);
	thePosition.add(retY1);
	yRet.geometry.vertices[1].copy(thePosition);
	yRet.geometry.verticesNeedUpdate=true;


}


/**
*
* Performs a bezier curve interpolation of the control points in pointlist given
* the time value T, and returns a ThreeJS Vector3 object with the interpolated coordinates.
*
* @method interp
* @for renderGlobal
* @param {Vector3 Array} pointList A list of control points for use in interpolation.
* @param {Float} T A normalized value for use as a time value in interpolation.
* @return {Object}
*
*/
function interp (pointList, T){

	var pos = 0;
	var lim = pointList.length;
	var listCopy = [];
	while(pos<lim){
		listCopy.push(pointList[pos].clone());
		pos++;
	}
	while(lim>1){
		pos = 0;
		while(pos<lim-1){
			listCopy[pos].lerpVectors(listCopy[pos],listCopy[pos+1],T);
			pos++;
		}
		delete listCopy[pos];
		lim--;
	}
	return listCopy[1];

}


/**
*
* Returns a string describing the x, y, and z coordinates of theVec.
*
* @method vecDesc
* @for renderGlobal
* @param {Vector3} theVec The ThreeJS Vector3 object to be described by the output string
* @return {String}
*
*/
function vecDesc(theVec){

	return "X: "+theVec.x+" Y: "+theVec.y+" Z: "+theVec.z;

}



/**
*
* Recursively adds Vector3 objects onto the Vector3 list, target, interpolating from startDisp
* and endDisp in an arc centered at the Vector3 object center. Each layer of recursion
* adds the midpoint of the arc from startDisp to endDisp until level = 0.
*
* @method addArcSubDiv
* @for renderGlobal
* @param {Vector3 Array} target The list where the calculated Vector3 objects should be added
* @param {Vector3} center The point which the generated arc should be centered on
* @param {Vector3} startDisp The starting point of the arc
* @param {Vector3} endDisp The ending point of the arc
* @param {Int} level The desired levels of recursion in the point interpolation
* @return {Void}
*
*/
function addArcSubDiv (target, center, startDisp, endDisp, level){

	var midVec = new THREE.Vector3(0,0,0);
	var midDisp = new THREE.Vector3(0,0,0);
	var startVec = new THREE.Vector3(0,0,0);
	var endVec = new THREE.Vector3(0,0,0);
	midDisp.add(startDisp);
	midDisp.add(endDisp);
	midDisp.normalize();
	midDisp.multiplyScalar((startDisp.length()+endDisp.length())/2);
	midVec.add(midDisp);
	midVec.add(center);
	startVec.add(startDisp);
	startVec.add(center);
	endVec.add(endDisp);
	endVec.add(center);


	if(level <= 0){
		target.push(midVec);
		target.push(endVec);
	}
	else{
		addArcSubDiv(target,center,startDisp,midDisp, level-1);
		addArcSubDiv(target,center,midDisp,endDisp, level-1);
	}

}






/**
*
* Returns a list of 2^(resolution+1) points which trace an arc beginning at startPoint,
* terminating at endpoint, and centered around center
*
* @method makeArcPointList
* @for renderGlobal
* @param {Vector3} startPoint The starting point of the arc
* @param {Vector3} center The point which the generated arc should be centered on
* @param {Vector3} endPoint The ending point of the arc
* @param {Int} resolution The desired levels of recursion in the point interpolation
* @return {Vector3 Array}
*
*/
function makeArcPointList(startPoint, center, endPoint, resolution){

	var pos = 0;
	var lim = 5;
	var result = [];
	var norm;
	var workVector = new THREE.Vector3 ( 0,0,0 );
	var crossVector = new THREE.Vector3 ( 0,0,0 );
	var startDisp = new THREE.Vector3 ( 0,0,0 );
	var endDisp = new THREE.Vector3 ( 0,0,0 );

	workVector.copy(endPoint);
	workVector.sub(center);

	startDisp.copy(startPoint);
	startDisp.sub(center);

	crossVector.clone(startDisp);

	endDisp.copy(endPoint);
	endDisp.sub(center);

	if(Math.abs(workVector.dot(crossVector)) > 0.98){
		while(Math.abs(workVector.dot(crossVector)) > 0.98){
			crossVector.set(Math.random()*100, Math.random()*100, Math.random()*100);
		}
		crossVector.cross(workVector);
		crossVector.normalize();
		crossVector.multiplyScalar((startDisp.length()+endDisp.length())/2);

		addArcSubDiv(result,center,endDisp,crossVector,resolution-1);
		addArcSubDiv(result,center,crossVector,startDisp,resolution-1);
	}
	else{
		delete crossVector;
		crossVector = null;
		addArcSubDiv(result,center,endDisp,startDisp,resolution);
	}

	return result;

}





/**
*
* Adds keyframes onto the keyframe lists provided so that the keyframed parts begin their
* animation at start location and move in an arc to their previously defined start position
*
* @method addCurveKeyFrames
* @for renderGlobal
* @param {Object List} theFrameLists A list of keyframe lists describing the movement of 3d models
* @param {Vector3} startLocation The desired new start location of the 3d models in the animation
* @return {Void}
*
*/
function addCurveKeyFrames(theFrameLists, startLocation){

	var pos = 0;
	var lim = theFrameLists.length;
	var center = new THREE.Vector3(0,0,0);
	center.add(startLocation);
	center.multiplyScalar(0.5);

	pos = 0;
	lim = theFrameLists.length;
	var framePos;
	var frameLim;
	var startFrame;
	var theFrame;
	var interpPoints;
	var offSet;
	var resolution = 4;

	while(pos<lim){
		interpPoints = [];
		startFrame = (theFrameLists[pos].Frames)[(theFrameLists[pos].Frames.length)-1];
		interpPoints = makeArcPointList( startLocation, center, startFrame.Position, resolution);
		treeInterps = makeArcPointList( startLocation, center, startFrame.TreePosition, resolution);
		framePos = 0;
		frameLim = interpPoints.length;
		while(framePos<frameLim){
			theFrame = copyFrame(startFrame);
			theFrame.Position.copy(interpPoints[framePos]);
			theFrame.TreePosition.copy(treeInterps[framePos]);
			theFrame.Time = startFrame.Time + framePos + 8;
			theFrame.Alpha = 1.0 - Math.pow((framePos+1)/frameLim,4);
			(theFrameLists[pos].Frames).push(theFrame);
			framePos++;
		}
		framePos = 0;
		frameLim = theFrameLists[pos].Frames.length;
		while(framePos<frameLim){
			framePos++;
		}
		pos++;
	}
	return 8 + Math.pow(2,resolution+1);

}


/**
*
* Adds a simple square grid of width equal to theSize and a number of lines equal to theDivs at Y=-1000
*
* @method addGrid
* @for renderGlobal
* @param {Int} theSize The desired grid width
* @param {Int} theDivs The desired number of lines per side of the grid
* @return {Void}
*
*/
function addGrid(theSize, theDivs, theHeight, theColor){

	var xpos = 0;
	var zpos;
	var theFloor = null;
	var theGeo = new THREE.Geometry();

	/*
	while(xpos<theDivs){
		zpos = 0;
		while(zpos<theDivs){
			theGeo.vertices.push(new THREE.Vector3(0-theSize/2, theHeight, zpos*theSize/theDivs-theSize/2));
			theGeo.vertices.push(new THREE.Vector3(theSize/2, theHeight , zpos*theSize/theDivs-theSize/2));
			zpos++;
		}
		theGeo.vertices.push(new THREE.Vector3(xpos*theSize/theDivs-theSize/2, theHeight , 0-theSize/2));
		theGeo.vertices.push(new THREE.Vector3(xpos*theSize/theDivs-theSize/2, theHeight , theSize/2));
		xpos++;
	}// */

	theGeo.vertices.push(new THREE.Vector3(0-theSize/2, theHeight , 0-theSize/2));
	theGeo.vertices.push(new THREE.Vector3(0-theSize/2, theHeight , theSize/2));
	theGeo.vertices.push(new THREE.Vector3(theSize/2, theHeight , theSize/2));
	theGeo.faces.push(new THREE.Face3(0, 1, 2));

	theGeo.vertices.push(new THREE.Vector3(0-theSize/2, theHeight , 0-theSize/2));
	theGeo.vertices.push(new THREE.Vector3(theSize/2, theHeight , theSize/2));
	theGeo.vertices.push(new THREE.Vector3(theSize/2, theHeight , 0-theSize/2));
	theGeo.faces.push(new THREE.Face3(3, 4, 5));

	theGeo.computeFaceNormals();

	theFloor =  new THREE.Mesh(
		theGeo,
		getGridMaterial()
	);
	scene.add(theFloor);

	theFloor.geometry.verticesNeedUpdate = true;

}



/**
*
* Adds a simple vertical column with a radius of theRad, a base Y value of theBot, a top terminating at
* theTop, an x and z position equal to theX and theZ, a line color of theColor, a number of vertical
* segmentations equal to stacks, and a number of radial segmentations equal to slices
*
* @method addGrid
* @for renderGlobal
* @param {Float} theRad The desired radius of the column
* @param {Float} theBot The desired bottom y value of the column
* @param {Float} theTop The desired top y value of the column
* @param {Float} theX The desired x value of the column
* @param {Float} theZ The desired z value of the column
* @param {Float} slices The desired number of radial segmentations
* @param {Float} stacks The desired z value of vertical segmentations
* @param {Float} theColor The desired color of the column
* @return {Void}
*
*/
function addCylender(theRad, theBot, theTop, theX, theZ, slices, stacks, theColor){

	var slicePos = 0;
	var theCyl = null;
	var theGeo = new THREE.Geometry();
	while(slicePos<slices){

		theGeo.vertices.push(new THREE.Vector3(
			theX+theRad*Math.cos(Math.PI*2*slicePos/slices),
			theTop,
			theZ+theRad*Math.sin(Math.PI*2*slicePos/slices)
		));
		theGeo.vertices.push(new THREE.Vector3(
			theX+theRad*Math.cos(Math.PI*2*(slicePos+1)/slices),
			theTop,
			theZ+theRad*Math.sin(Math.PI*2*(slicePos+1)/slices)
		));
		theGeo.vertices.push(new THREE.Vector3(
			theX+theRad*Math.cos(Math.PI*2*slicePos/slices),
			theBot,
			theZ+theRad*Math.sin(Math.PI*2*slicePos/slices)
		));
		theGeo.faces.push(new THREE.Face3(slicePos*6, slicePos*6+1, slicePos*6+2));

		theGeo.vertices.push(new THREE.Vector3(
			theX+theRad*Math.cos(Math.PI*2*(slicePos+1)/slices),
			theTop,
			theZ+theRad*Math.sin(Math.PI*2*(slicePos+1)/slices)
		));
		theGeo.vertices.push(new THREE.Vector3(
			theX+theRad*Math.cos(Math.PI*2*(slicePos+1)/slices),
			theBot,
			theZ+theRad*Math.sin(Math.PI*2*(slicePos+1)/slices)
		));
		theGeo.vertices.push(new THREE.Vector3(
			theX+theRad*Math.cos(Math.PI*2*slicePos/slices),
			theBot,
			theZ+theRad*Math.sin(Math.PI*2*slicePos/slices)
		));
		theGeo.faces.push(new THREE.Face3(slicePos*6+3, slicePos*6+4, slicePos*6+5));

		slicePos++;
	}
	theGeo.computeFaceNormals();

	theCyl =  new THREE.Mesh(
		theGeo,
		getGridMaterial()
	);
	scene.add(theCyl);

	theCyl.geometry.verticesNeedUpdate = true;



}
