;
//<script>


if( typeof(startupScripts) == 'undefined'){

	var startupScripts = [
		function(){},
		function(){},
		function(){},
		function(){},
		function(){},
		function(){},
		function(){},
		function(){}
	];

}




// Put recieved data about assembly into here. The code handles the rest.
// theXMLFile should be a string, and theSTLFiles as a binary ArrayBuffer
// Any text-based STL files should be in an 8-bit encoding
/**
*
* The function which handles the actual dir_rendering of the solution file animation
* and loading in the models
*
* @method dir_recieveData
* @for directionConfirmGlobal
* @param {String} theXMLFile
* @param {Object} theSTLFiles
* @return {Void}
*
*/
function dir_receiveData(theXMLFile, theSTLFiles){

	theXML=theXMLFile;

	parts.length=0;
	var pos=0;
	var lim=theSTLFiles.length;
	var partGeom;
	var partMesh;

	while(pos<lim){
		partGeom=null;
		partGeom=theSTLFiles[pos];
		if(partGeom===null){
			partGeom=parseStlBinary(fileReaders[pos].Reader.result);
		}

		partMesh=new THREE.Mesh(
				partGeom,
				new THREE.MeshNormalMaterial()
		);
		parts.push({
			Mesh: partMesh,
			Name: fileReaders[pos].Name
		})
		scene.add(partMesh);

		pos++;
	}

	dir_renderParts();

}



// Gets called when the user submits the table and everything is properly filled out
/**
*
* Is called whenever the user submits the part table and every entry has been
* properly filled out.
*
* @method dir_sendData
* @for directionConfirmGlobal
* @param {String} theXMLText The contents of the disassembly directions in the webpage, as a string
* in XML formatting
* @return {Void}
*
*/
function dir_sendData(theXMLText){

	// Do whatever you want with the resulting data to send it off, if you want


}






/**
*
* Given an HTML element corresponding to a "confirm" button, moves the parent element
* to the confirmed section of the webpage
*
* @method dir_confirmPair
* @for directionConfirmGlobal
* @param {HTML Element} theButton The confirm button of the element to be moved
* @return {Void}
*
*/
function dir_confirmPair(theButton){
	document.getElementById("confirmed").appendChild(theButton.parentElement);
	theButton.innerHTML="unconfirm";
	theButton.onclick=function(){
		dir_deconfirmPair(theButton);
	};
}



/**
*
* Given an HTML element corresponding to a "unconfirm" button, moves the parent element
* to the unconfirmed section of the webpage
*
* @method dir_deconfirmPair
* @for directionConfirmGlobal
* @param {HTML Element} theButton The unconfirm button of the element to be moved
* @return {Void}
*
*/
function dir_deconfirmPair(theButton){
	document.getElementById("unconfirmed").appendChild(theButton.parentElement);
	theButton.innerHTML="confirm";
	theButton.onclick=function(){
		dir_confirmPair(theButton);
	};
}



/**
*
* Given an HTML element corresponding to a "focus" button, makes the corresponding pair
* of parts to be displayed
*
* @method dir_changeCurrentPair
* @for directionConfirmGlobal
* @param {HTML Element} theButton The confirm button of the element to be moved
* @return {Void}
*
*/
function dir_changeCurrentPair(theButton){

	if(lastPair!==null){
		return;
	}

	lastPair=currentPair;
	var theRef=theButton.parentElement.Ref;
	var theMov=theButton.parentElement.Mov;
	var pos=0;
	var lim=assemblyPairs.length;
	while(pos<lim){
		if(assemblyPairs[pos].Ref.Name===theRef & assemblyPairs[pos].Mov.Name===theMov){
			currentPair=assemblyPairs[pos];
			return;
		}
		pos++;
	}

}

/**
*
* Given a jQuery object and a string, returns the first child of the given element with
* a tag equivalent to the given string.
*
* @method dir_grab
* @for  directionConfirmGlobal
* @param {jQuery Object} theTree The jQuery object whose child is to be returned
* @param {String} theMember The name of the tag being searched
* @return {jQuery Object} The first child with the given tag. If such a child does not
* exist, null is returned.
*
*/
function dir_grab(theTree,theMember){

	if($(theTree).children(theMember).length!=0){
		return $(theTree).children(theMember)[0];
	}
	else{
		return null;
	}

}


var time=0;
var focusBox;
var focusPoint;


/**
*
* The dir_rendering function for the webpage
*
* @for directionConfirmGlobal
* @return {Void}
*
*/
var dir_render = function () {

	// The function that will manage frame requests
	requestAnimationFrame( dir_render );

	if(lastPair!==null){
		var holder=currentPair;
		currentPair=lastPair;
		dir_dehighlight(currentPair);
		currentPair=holder;
		dir_highlight(currentPair);
		lastPair=null;
	}

	currentPair.Ref.Mesh.geometry.computeBoundingBox();
	currentPair.Mov.Mesh.geometry.computeBoundingBox();
	focusBox=currentPair.Ref.Mesh.geometry.boundingBox.clone();
	focusBox.union(currentPair.Mov.Mesh.geometry.boundingBox);

	focusPoint= new THREE.Vector3(
								  (focusBox.min.x+focusBox.max.x)/2,
								  (focusBox.min.y+focusBox.max.y)/2,
								  (focusBox.min.z+focusBox.max.z)/2
								 );

	thePos.normalize();

	thePos.applyEuler(theEul);
	theEul.set(0,0,0,'XYZ');
	thePos.multiplyScalar(theDistance);
	camera.position.copy(thePos);
	camera.position.add(focusPoint);
	camera.lookAt(focusPoint);
	camera.updateMatrix();

	sunLight.position.set( (camera.position.x-focusPoint.x)*2+focusPoint.x,
						   (camera.position.y-focusPoint.y)*2+focusPoint.y,
						   (camera.position.z-focusPoint.z)*2+focusPoint.z );
	sunLight.target.position=focusPoint;


	time+=0.01;

	dir_updateAxisLines();

	// Call for the render
	renderer.render(scene, camera);
};




/**
*
* Accepts a string and outputs the string of all characters following the final '.' symbol
* in the string. This is used internally to extract file extensions from file names.
*
* @method dir_grabExtension
* @for directionConfirmGlobal
* @param {String} theName The file name to be processed
* @return {String} the extension in the given file name. If no extension is found, the
* 'undefined' value is returned.
*
*/
function dir_grabExtension(theName){
	return (/[.]/.exec(theName)) ? /[^.]+$/.exec(theName) : undefined;
}





// Returns from the given list of file readers those that have not completed loading
/**
*
* Outputs through the console the list of FileReaders in theReaders which have
* not yet completed their loading
*
* @method dir_whoIsLeft
* @for  directionConfirmGlobal
* @param {FileReader Object List} theReaders The list of FileReaders to be checked
* @return {Void}
*
*/
function dir_whoIsLeft(theReaders){

	var pos=0;
	var lim=fileReaders.length;
	var theList=[];
	while(pos<lim){
		if(theReaders[pos].Reader.readyState!=2){
			theList.push(theReaders[pos].Name);
		}
		pos++;
	}
	console.log(theList);

}




/**
*
* Accepts a fileinput event, presumably from a file upload event listener, and assigns
* functions to each file reader listed in the event to be called upon the full loading
* of that given reader's files
*
* @method dir_readMultipleFiles
* @for directionConfirmGlobal
* @param {Event} evt A fileinput event, to be given by a fileinput event listener
* @return {Void}
*
*/
function dir_readMultipleFiles(evt) {
	//Retrieve all the files from the FileList object
	var files = evt.target.files;

	if (files) {
		for (var i=0, f; f=files[i]; i++) {

			var r = new FileReader();
			var extension=dir_grabExtension(f.name)[0];
			//console.log(f.name);

			if(extension===undefined){
				continue;
			}
			if(extension.toLowerCase()==="stl"){
				r.onload = (function(f) {
					return function(e) {
					//console.log(f.name);
						var contents = e.target.result;
						if(r.result!=null){
							STLs.push(r.result);
						}
						dir_loadParts();
					};
				})(f);
				r.readAsArrayBuffer(f);
				fileReaders.push({Reader: r, Name: f.name});
			}
			else if(extension.toLowerCase()==="xml"){
				console.log(f.name);
				if(!(theXML===null)){
					console.log("Warning: More than one XML file provided");
				}
				r.onload = (function(f) {
					return function(e) {
						//console.log(f.name);
						var contents = e.target.result;
						theXML=e.target.result;
						dir_loadParts();
					};
				})(f);
				r.readAsText(f,"US-ASCII");
				fileReaders.push({Reader: r, Name: f.name});
			}

		}
		console.log(fileReaders);
	}
	else {
		  alert("Failed to load files");
	}
}




/**
*
* Called internally upon every recieved fileload event. Checks if every file reader in the
* array "fileReaders" has fully read each of their files. If so, then the function converts
* all recieved stl files into threeJS models and executes "dir_renderParts".
*
* @method dir_loadParts
* @for directionConfirmGlobal
* @return {Void}
*
*/
function dir_loadParts (){


		// Looks for unloaded files
		var pos=0;
		var lim=fileReaders.length;
		while(pos<lim){
			if(!(fileReaders[pos].Reader.readyState===2)){
				//console.log(pos);
				//console.log(fileReaders[pos].Name);
				break;
			}
			pos++;
		}


	// Executes if all files are loaded
	if(pos===lim){
		//console.log("ALL DONE");
		parts.length=0;
		pos=0;
		var partGeom=null;
		var partMesh;
		var theCenter;
		var ext;
		while(pos<lim){
			ext=dir_grabExtension(fileReaders[pos].Name)[0];

			if(ext.toLowerCase()==="stl"){

				partGeom=parseStl(fileReaders[pos].Reader.result);
				if(partGeom===null){
					partGeom=parseStlBinary(fileReaders[pos].Reader.result);
				}

				//console.log(partGeom);

				partMesh=new THREE.Mesh(
						partGeom,
						new THREE.MeshLambertMaterial(wireSettings)
				);
				parts.push({
					Mesh: partMesh,
					Name: fileReaders[pos].Name
				})
				scene.add(partMesh);
			}

			pos++;
		}

		dir_renderParts();

	}


}


function dir_renderParts(){


	dir_parseData();
	dir_linkParts();
	console.log(assemblyPairs);
	dir_highlight(assemblyPairs[0]);
	lastPair=assemblyPairs[0];
	currentPair=assemblyPairs[0];
	dir_insertAssemblyPairs();
	dir_initAxisLines();
	dir_render();


}



/**
*
* Accepts two strings, a and b, and a vector, vec, and outputs a
* constructed part pair object if the two strings correspond to two
* extant parts
*
* @method dir_linkPair
* @for directionConfirmGlobal
* @param {String} a The first part name
* @param {String} b The second part name
* @param {Vector3} vec The vector to be added to the pair
* @return {Object} The resulting pair object
*
*/
function dir_linkPair(a,b,vec){

	var thePair={Ref: null,
				 Mov: null,
				 Vec: null,
				 Directed: null,
				 DoublyDirected: null,
				 InfiniteDirections: null};

	//console.log(parts);

	var pos=0;
	var lim=parts.length;
	while(pos<lim){

		if(parts[pos].Name===a+".STL" || parts[pos].Name===a){
			thePair.Ref=parts[pos];
		}
		if(parts[pos].Name===b+".STL" || parts[pos].Name===b){
			thePair.Mov=parts[pos];
		}
		if(thePair.Ref!==null && thePair.Mov!==null){
			thePair.Vec=vec;
			return thePair;
		}
		pos++;
	}
	//console.log(thePair);
	return null;

}



/**
*
* Links together the pairs of parts corresponding to the strings present in
* the namePairs array.
*
* @method dir_linkParts
* @for directionConfirmGlobal
* @return {Void}
*
*/
function dir_linkParts(){

	var pos=0;
	var lim=namePairs.length;
	var thePair=null;

	while(pos<lim){
		thePair=dir_linkPair(namePairs[pos].Ref,namePairs[pos].Mov,namePairs[pos].Vec);

		if(thePair!=null){
			thePair.InfiniteDirections = namePairs[pos].InfiniteDirections;
			assemblyPairs.push(thePair);
		}
		pos++;
	}
	//console.log(assemblyPairs);
}


/**
*
* Populates the webpage with data stored int the global variable theSML
*
* @method dir_parseData
* @for directionConfirmGlobal
* @return {Void}
*
*/
function dir_parseData(){

	//console.log(theXML);
	var doc = $.parseXML(theXML);
	//console.log(doc);
	doc = dir_grab(doc,"DirectionSaveStructure");
	var directions = dir_grab(doc,"Directions");
	directions = $(directions).children("ArrayOfDouble");
	var thePairs=dir_grab(doc,"arcs");
	//console.log(thePairs);

	thePairs=$(thePairs).children("arc");
	//console.log(thePairs);
	var pos=0;
	var lim=thePairs.length;
	var thePair;
	var theMov;
	var theRef;
	var theVec;
	var vecPos;
	var vecLim;
	var directed;
	var docDirs;
	var doublyDirected;
	var docDubDirs;
	var infiniteDirections;
	var docInfDirs;

	while(pos<lim){

		theRef=dir_grab(thePairs[pos],"To");
		theMov=dir_grab(thePairs[pos],"From");

		docDirs=dir_grab(thePairs[pos],"directed");
		directed=[];

		docDubDirs=dir_grab(thePairs[pos],"doublyDirected");
		doublyDirected=[];

		docInfDirs=dir_grab(thePairs[pos],"InfiniteDirections");
		infiniteDirections=[];

		docFinDirs=dir_grab(thePairs[pos],"FiniteDirections");
		finiteDirections=[];



		if($(docDirs[vecPos]).innerHTML != "false"){
			docDirs = $(docDirs).children("int");
			vecPos=0;
			vecLim=docDirs.length;
			while(vecPos<vecLim){
				theVec=parseInt(docDirs[vecPos].innerHTML);
				directed.push(theVec);
				vecPos++;
			}
		}


		if($(docDubDirs[vecPos]).innerHTML != "false"){
			docDubDirs = $(docDubDirs).children("int");
			vecPos=0;
			vecLim=docDubDirs.length;
			while(vecPos<vecLim){
				theVec=parseInt(docDubDirs[vecPos].innerHTML);
				doublyDirected.push(theVec);
				vecPos++;
			}
		}

		if($(docInfDirs[vecPos]).innerHTML != "false"){
			docInfDirs = $(docInfDirs).children("int");
			vecPos=0;
			vecLim=docInfDirs.length;
			while(vecPos<vecLim){
				theVec=parseInt(docInfDirs[vecPos].innerHTML);
				infiniteDirections.push(theVec);
				vecPos++;
			}
		}


		theVec=dir_grab(thePairs[pos],"vector");
		namePairs.push({
			name: dir_grab(thePairs[pos],"name").innerHTML,
			Ref: theRef.innerHTML,
			Mov: theMov.innerHTML,
			localLabels: dir_grab(thePairs[pos],"localLabels").innerHTML,
			localVariables: dir_grab(thePairs[pos],"localVariables").innerHTML,
			Directed: dir_grab(thePairs[pos],"Directed").innerHTML,
			DoublyDirected: dir_grab(thePairs[pos],"DoublyDirected").innerHTML,
			InfiniteDirections: infiniteDirections,
			FiniteDirections: dir_grab(thePairs[pos],"FiniteDirections").innerHTML,
			Fasteners: dir_grab(thePairs[pos],"Fasteners").innerHTML,
			Certainty: dir_grab(thePairs[pos],"Certainty").innerHTML,
			ConnectionType: dir_grab(thePairs[pos],"ConnectionType").innerHTML
		});
		pos++;
	}

}



/**
*
* Populates the webpage with graphical representations of the assembly pairs
* stored in the global variable assemblyPairs
*
* @method dir_insertAssemblyPairs
* @for directionConfirmGlobal
* @return {Void}
*
*/
function dir_insertAssemblyPairs(){

	var pos=0;
	var lim=assemblyPairs.length;
	while(pos<lim){
		var theDiv = document.createElement("div");
		var theText = document.createElement("text");
		theText.innerHTML = assemblyPairs[pos].Ref.Name + " \n<---\n " + assemblyPairs[pos].Mov.Name;
		var theConfBut = document.createElement("button");
		theConfBut.innerHTML = "confirm";
		theConfBut.onclick = function (){
			dir_confirmPair(this);
		}
		var thedir_highlightBut = document.createElement("button");
		thedir_highlightBut.innerHTML = "focus";
		thedir_highlightBut.onclick = (function(position){
			return function(){
				lastPair=currentPair;
				console.log("assigning currentPair");
				console.log(position);
				console.log(assemblyPairs[position]);
				currentPair=assemblyPairs[position];
				console.log ("Doing the focus thing");
			}
		})(pos);
		theText.className="pairText";
		theConfBut.className="dirButton";
		thedir_highlightBut.className="dirButton";
		theDiv.appendChild(theText);
		theDiv.appendChild(document.createElement("br"));
		theDiv.appendChild(thedir_highlightBut);
		theDiv.appendChild(theConfBut);
		theDiv.className="dirPair";
		document.getElementById("unconfirmed").appendChild(theDiv);
		pos++;
	}
	pos--;

}





/**
*
* dir_dehighlights the given pair of parts
*
* @method dir_dehighlight
* @for directionConfirmGlobal
* @param {Object} thePair The pair object to be dir_dehighlighted
* @return {Void}
*
*/
function dir_dehighlight(thePair){
	console.log("The number of vectors is ",theVectors.length);
	dir_removeVectorView(document.getElementById("expandButton"));
	thePair.Ref.Mesh.material=new THREE.MeshLambertMaterial(wireSettings);
	thePair.Mov.Mesh.material=new THREE.MeshLambertMaterial(wireSettings);
}



/**
*
* dir_highlights the given pair of parts
*
* @method dir_highlight
* @for directionConfirmGlobal
* @param {Object} thePair The pair object to be dir_highlighted
* @return {Void}
*
*/

function dir_highlight(thePair){

	console.log(thePair);
	thePair.Ref.Mesh.material=new THREE.MeshLambertMaterial({color: 0x4444FF /*, transparent: true, opacity: 0.6, depthTest: false */});
	thePair.Mov.Mesh.material=new THREE.MeshLambertMaterial({color: 0xFF4444 /*, transparent: true, opacity: 0.6, depthTest: false */});
	thePair.Ref.Mesh.geometry.computeBoundingBox();
	thePair.Mov.Mesh.geometry.computeBoundingBox();
	var theBox=thePair.Mov.Mesh.geometry.boundingBox.clone();
	var distBox = thePair.Mov.Mesh.geometry.boundingBox.clone();
	distBox.union(thePair.Ref.Mesh.geometry.boundingBox);



	var pos=0;
	var lim=theVectors.length;
	while(pos<lim){
		scene.remove( theVectors[pos] );
		pos++;
	}


	theVectors.length=0;
	console.log("Just set the Vectors to 0");
	console.log("The pair is: ", thePair);
	var theVec;

	var theDist = Math.sqrt(Math.pow(distBox.max.x-distBox.min.x,2)+
							Math.pow(distBox.max.y-distBox.min.y,2)+
							Math.pow(distBox.max.y-distBox.min.y,2));


	pos=0;
	lim=thePair.InfiniteDirections.length;
	while(pos<lim){
		theVec = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0xff0000}));
		theVec.geometry.vertices[0]=new THREE.Vector3(
								  (theBox.min.x+theBox.max.x)/2,
								  (theBox.min.y+theBox.max.y)/2,
								  (theBox.min.z+theBox.max.z)/2
								 );
		theVec.geometry.vertices[1]=new THREE.Vector3(theDist*theDirections[thePair.InfiniteDirections[pos]].X,
													  theDist*theDirections[thePair.InfiniteDirections[pos]].Y,
													  theDist*theDirections[thePair.InfiniteDirections[pos]].Z);
		theVec.geometry.vertices[1].add(theVec.geometry.vertices[0]);
		theVec.geometry.verticesNeedUpdate=true;
		scene.add(theVec);
		theVectors.push(theVec);
		console.log("Vector List Size is: ",theVectors.length);
		pos++;
	}

	dir_insertVectorView(document.getElementById("expandButton"));

}




/**
*
* Sets the opacity of each (non-dir_highlighted) mesh object to the value of the
* slider element provided
*
* @method dir_fixOpacity
* @for directionConfirmGlobal
* @param {Object} theSlider The slider which is to be referenced when setting object opacity
* @return {Void}
*
*/
function dir_fixOpacity(theSlider){

	console.log("Changing Opacity");
	var val = theSlider.value;
	wireSettings.opacity=val;
	var pos=0;
	var lim=parts.length;
	while(pos<lim){
		if(parts[pos].Mesh!=currentPair.Ref.Mesh && parts[pos].Mesh!=currentPair.Mov.Mesh){
			parts[pos].Mesh.material=new THREE.MeshLambertMaterial(wireSettings);
		}
		pos++;
	}

}



/**
*
* Given a mouseup event, sets corresponding internal button states for mouse-related controls
*
* @method dir_doMouseUp
* @for directionConfirmGlobal
* @param {mouseup event} theEvent
* @return {Void}
*
*/
function dir_doMouseUp(theEvent){
	if(theEvent.button == 0){
		leftDrag = false;
	}
	else if(theEvent.button == 2){
		rightDrag = false;
	}
}


/**
*
* Given a mousedown event, sets corresponding internal button states for mouse-related controls
*
* @method dir_doMouseDown
* @for directionConfirmGlobal
* @param {mousedown event} theEvent
* @return {Void}
*
*/
function dir_doMouseDown(theEvent){
	if(theEvent.button == 0){
		leftDrag = true;
	}
	else if(theEvent.button == 2){
		rightDrag = true;
	}
}


/**
*
* Given a mouseleave event, sets corresponding internal button states for mouse-related controls
*
* @method dir_doMouseLeave
* @for directionConfirmGlobal
* @param {mouseup event} theEvent
* @return {Void}
*
*/
function dir_doMouseLeave(theEvent){
	leftDrag = false;
	rightDrag = false;
	lastMouse = null;
}


/**
*
* Prevents the default response of the given event (used to prevent dropdown menus when right
* clicking on the display).
*
* @method dir_justDont
* @for directionConfirmGlobal
* @param {Event Object} theEvent The event to suppress the default response of.
* @return {Void}
*
*/
function dir_justDont(theEvent){
	theEvent.preventDefault();
}


/**
*
* Given a mousedrag event, rotates the camera or adds a vector to the currently displayed pair,
* depending upon whether or not the left or right mouse button is depressed
*
* @method dir_doDrag
* @for directionConfirmGlobal
* @param {mouseup event} theEvent
* @return {Void}
*
*/
function dir_doDrag(theEvent){


	if(theAddAxis !== null){

		var theBox=currentPair.Mov.Mesh.geometry.boundingBox.clone();
		var theArea = document.getElementById("display");
		var areaW = theArea.clientWidth;
		var areaH = theArea.clientHeight;
		var areaT = theArea.offsetTop;
		var areaL = theArea.offsetLeft;
		var mouseX = theEvent.clientX;
		var mouseY = theEvent.clientY;
		//console.log("aW: "+areaW+" aH: "+areaH+" aT: "+areaT+" aL: "+areaL);
		//console.log("mX: "+(((mouseX-areaL)-areaW/2)/(areaW/2))+" mY: "+((areaH/2-(mouseY-areaT))/(areaH/2)));
		var theDir = dir_getDirectionFromMouse( ((mouseX-areaL)-areaW/2)/(areaW/2), (areaH/2-(mouseY-areaT))/(areaH/2) );

		theAddAxis.geometry.vertices[0].set((theBox.min.x+theBox.max.x)/2,(theBox.min.y+theBox.max.y)/2,(theBox.min.z+theBox.max.z)/2);
		theAddAxis.geometry.vertices[1].set((theBox.min.x+theBox.max.x)/2+theDirections[theDir].X*theDistance*0.6,
											(theBox.min.y+theBox.max.y)/2+theDirections[theDir].Y*theDistance*0.6,
											(theBox.min.z+theBox.max.z)/2+theDirections[theDir].Z*theDistance*0.6 );

		console.log( "X: "+(theBox.min.x+theBox.max.x)/2+
					" Y: "+(theBox.min.y+theBox.max.y)/2+
					" Z: "+(theBox.min.z+theBox.max.z)/2 );

		console.log(" X: "+theDirections[theDir].X +
					" Y: "+theDirections[theDir].Y +
					" Z: "+theDirections[theDir].Z  );

		theAddAxis.geometry.verticesNeedUpdate=true;

	}


	if(leftDrag==true){
		thePos.normalize();
		theEul.set(theEvent.movementY*(-0.02)*Math.cos(Math.atan2(thePos.x,thePos.z)),
				   theEvent.movementX*(-0.02),
				   theEvent.movementY*(0.02)*Math.sin(Math.atan2(thePos.x,thePos.z)),
				   'ZYX');
	}
	if(rightDrag==true){
		dir_addVectorFromMouse(theEvent.clientX, theEvent.clientY);
	}
}


/**
*
* Given a mousewheel event, changes the distance of the camera from the center of the scene
*
* @method dir_doMouseUp
* @for directionConfirmGlobal
* @param {mouseup event} theEvent
* @return {Void}
*
*/
function dir_doZoom(theEvent){
	var theDelta = theEvent.deltaY == 0 ? 0 : ( theEvent.deltaY > 0 ? 1 : -1 );
	theDistance=theDistance*Math.pow(1.001,theDelta*(-40));
}





/**
*
* Inserts the vector view into the webpage
*
* @method dir_insertVectorView
* @for directionConfirmGlobal
* @param {HTML Element} theButton The vector viewing button
* @return {Void}
*
*/
function dir_insertVectorView(theButton){

	console.log("doing dir_insertVectorView");

	if(currentPair==null){
		return;
	}

	currentPair.Ref.Mesh.geometry.computeBoundingBox();
	currentPair.Mov.Mesh.geometry.computeBoundingBox();
	var theBox=currentPair.Mov.Mesh.geometry.boundingBox.clone();
	var distBox = currentPair.Mov.Mesh.geometry.boundingBox.clone()
	distBox.union(currentPair.Ref.Mesh.geometry.boundingBox);

	var theDist = Math.sqrt(Math.pow(distBox.max.x-distBox.min.x,2)+
							Math.pow(distBox.max.y-distBox.min.y,2)+
							Math.pow(distBox.max.y-distBox.min.y,2));

	var theDiv=theButton.parentElement;
	console.log(theDiv);
	theButton.onclick=function () {dir_removeVectorView(this);};
	var theVecList=document.createElement("div");
	theVecList.id="vecList";
	var addButton=document.createElement("button");
	addButton.innerHTML="Add Vector";
	addButton.id="addButton";
	addButton.onclick=function () {dir_addVectorToPair(this);};

	var pos=0;
	var lim=theVectors.length;
	var theEntry;
	var remBut;
	var xLab;
	var xInp;
	var yLab;
	var yInp;
	var zLabl;
	var zInp;
	while(pos<lim){
		theEntry=document.createElement("div");
		remBut=document.createElement("button");
		remBut.innerHTML="Remove";
		remBut.onclick=function () {dir_remVectorFromPair(this);};
		xLab=document.createElement("text");
		xLab.innerHTML="X";
		xInp=document.createElement("input");
		xInp.type="number";
		xInp.step=0.01;
		xInp.value=(theVectors[pos].geometry.vertices[1].x-theVectors[pos].geometry.vertices[0].x)/theDist;
		xInp.onchange=function () {dir_vecEntryUpdate(this);};
		yLab=document.createElement("text");
		yLab.innerHTML="Y";
		yInp=document.createElement("input");
		yInp.type="number";
		yInp.step=0.01;
		yInp.value=(theVectors[pos].geometry.vertices[1].y-theVectors[pos].geometry.vertices[0].y)/theDist;
		yInp.onchange=function () {dir_vecEntryUpdate(this);};
		zLab=document.createElement("text");
		zLab.innerHTML="Z";
		zInp=document.createElement("input");
		zInp.type="number";
		zInp.step=0.01;
		zInp.value=(theVectors[pos].geometry.vertices[1].z-theVectors[pos].geometry.vertices[0].z)/theDist;
		zInp.onchange=function () {dir_vecEntryUpdate(this);};

		theEntry.appendChild(xLab);
		theEntry.appendChild(xInp);
		theEntry.appendChild(document.createElement("br"));
		theEntry.appendChild(yLab);
		theEntry.appendChild(yInp);
		theEntry.appendChild(document.createElement("br"));
		theEntry.appendChild(zLab);
		theEntry.appendChild(zInp);
		theEntry.appendChild(document.createElement("br"));
		theEntry.appendChild(remBut);

		theEntry.counterPart=theVectors[pos];
		theEntry.className="vecEntry";

		theVecList.appendChild(theEntry);
		pos++;
	}

	theDiv.appendChild(addButton);
	theDiv.appendChild(theVecList);

}





/**
*
* Removes the vector view from the webpage
*
* @method dir_removeVectorView
* @for directionConfirmGlobal
* @param {HTML Element} theButton The vector viewing button
* @return {Void}
*
*/
function dir_removeVectorView(theButton){

	console.log("doing dir_removeVectorView");

	var theDiv=theButton.parentElement;
	var vecListHolder=document.getElementById("vecList");



	if(vecListHolder!=null){
		var vecPos=0;
		var vecLim=theVectors.length;
		console.log(theVectors);

		var best;
		var ang;
		var testVector;
		currentPair.InfiniteDirections.length=0;
		while(vecPos<vecLim){
			testVector=new THREE.Vector3(1,1,1);
			//
			testVector.copy(theVectors[vecPos].geometry.vertices[1]);
			testVector.sub(theVectors[vecPos].geometry.vertices[0]);
			testVector.normalize();
			//console.log(testVector);
			pos=dir_getDir(testVector);
			console.log(theVectors[vecPos]);
			if(theVectors[vecPos].material.color.r===1){
				currentPair.InfiniteDirections.push(pos);
				console.log("<--->");
			}

			console.log("Vector List Size is: ",theVectors.length);
			console.log("InfDir List Size is: ",currentPair.InfiniteDirections.length);
			vecPos++;
		}

		theDiv.removeChild(vecListHolder);
		theDiv.removeChild(document.getElementById("addButton"));
	}

	theButton.onclick=function () {dir_insertVectorView(this);};

}


/**
*
* Inserts a blank vector widget into the vector view element
*
* @method dir_addVectorToPair
* @for directionConfirmGlobal
* @param {HTML Element} theButton The "add vector" button
* @return {Void}
*
*/
function dir_addVectorToPair(theButton){

	console.log("doing dir_addVectorToPair");

	var theDiv=theButton.parentElement;
	var theVecList=document.getElementById("vecList");
	//console.log(theVecList);

	var theEntry=document.createElement("div");
	var remBut=document.createElement("button");
	remBut.innerHTML="Remove";
	remBut.onclick=function () {dir_remVectorFromPair(this);};
	var xLab=document.createElement("text");
	xLab.innerHTML="X";
	var xInp=document.createElement("input");
	xInp.type="number";
	xInp.step=0.01;
	xInp.onchange=function () {dir_vecEntryUpdate(this);};
	var yLab=document.createElement("text");
	yLab.innerHTML="Y";
	var yInp=document.createElement("input");
	yInp.type="number";
	yInp.step=0.01;
	yInp.onchange=function () {dir_vecEntryUpdate(this);};
	var zLab=document.createElement("text");
	zLab.innerHTML="Z";
	var zInp=document.createElement("input");
	zInp.type="number";
	zInp.step=0.01;
	zInp.onchange=function () {dir_vecEntryUpdate(this);};

	theEntry.appendChild(xLab);
	theEntry.appendChild(xInp);
	theEntry.appendChild(document.createElement("br"));
	theEntry.appendChild(yLab);
	theEntry.appendChild(yInp);
	theEntry.appendChild(document.createElement("br"));
	theEntry.appendChild(zLab);
	theEntry.appendChild(zInp);
	theEntry.appendChild(document.createElement("br"));
	theEntry.appendChild(remBut);

	theEntry.counterPart=null;
	theEntry.className="vecEntry";

	theVecList.appendChild(theEntry);
	return theEntry;

}




/**
*
* Removes a vector widget from the vector view element
*
* @method dir_remVectorFromPair
* @for directionConfirmGlobal
* @param {HTML Element} theButton The "remove" button of the widget to be removed
* @return {Void}
*
*/
function dir_remVectorFromPair(theButton){

	console.log("doing dir_remVectorFromPair");
	if(theButton.parentElement.counterPart!=null){
		scene.remove(theButton.parentElement.counterPart);
	}

	console.log("The vector length before splice: ",theVectors.lenth);
	theVectors.splice(theVectors.indexOf(theButton.parentElement.counterPart),1);
	console.log("The vector length after splice: ",theVectors.lenth);

	theButton.parentElement.parentElement.removeChild(theButton.parentElement);

}


/**
*
* Updates a vector to match the values in its corresponding widget
* @method dir_vecEntryUpdate
* @for directionConfirmGlobal
* @param {HTML Element} theInput An input element of the vector's widget
* @return {Void}
*
*/
function dir_vecEntryUpdate(theInput){

	console.log("doing dir_vecEntryUpdate");

	var theBox=currentPair.Mov.Mesh.geometry.boundingBox.clone();

	currentPair.Ref.Mesh.geometry.computeBoundingBox();
	currentPair.Mov.Mesh.geometry.computeBoundingBox();
	var theBox=currentPair.Mov.Mesh.geometry.boundingBox.clone();
	var distBox = currentPair.Mov.Mesh.geometry.boundingBox.clone();
	distBox.union(currentPair.Ref.Mesh.geometry.boundingBox);

	var theDist = Math.sqrt(Math.pow(distBox.max.x-distBox.min.x,2)+
							Math.pow(distBox.max.y-distBox.min.y,2)+
							Math.pow(distBox.max.y-distBox.min.y,2));


	var theEntry=theInput.parentElement;
	var theInputs=theEntry.getElementsByTagName("INPUT");
	var pos=0;
	var lim=theInputs.length;
	var current;
	while(pos<lim){
		current=theInputs[pos];
		if(theInputs[pos].value===""){
			return;
		}
		pos++;
	}

	var theMag = Math.sqrt( Math.pow(parseFloat(theInputs[0].value),2)+
							Math.pow(parseFloat(theInputs[1].value),2)+
							Math.pow(parseFloat(theInputs[2].value),2));
	theInputs[0].value = theInputs[0].value/theMag;
	theInputs[1].value = theInputs[1].value/theMag;
	theInputs[2].value = theInputs[2].value/theMag;

	console.log(theInputs);
	if(theEntry.counterPart===null){
		var theVec = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0xff0000}));
		theVec.geometry.vertices[0]=new THREE.Vector3(
								  (theBox.min.x+theBox.max.x)/2,
								  (theBox.min.y+theBox.max.y)/2,
								  (theBox.min.z+theBox.max.z)/2
								 );
		theVec.geometry.vertices[1]=new THREE.Vector3(theVec.geometry.vertices[0].x+parseFloat(theInputs[0].value)*theDist,
													  theVec.geometry.vertices[0].y+parseFloat(theInputs[1].value)*theDist,
													  theVec.geometry.vertices[0].z+parseFloat(theInputs[2].value)*theDist);



		scene.add(theVec);
		theVectors.push(theVec);
		console.log("theVectors Updated. New length is: ",theVectors.length);
		theVec.geometry.verticesNeedUpdate=true;
		theEntry.counterPart=theVec;
		theEntry.counterPart.geometry.verticesNeedUpdate=true;
	}
	else{
		var theVerts=theEntry.counterPart.geometry.vertices;
		theVerts[1].x=theVerts[0].x+parseFloat(theInputs[0].value)*theDist;
		theVerts[1].y=theVerts[0].y+parseFloat(theInputs[1].value)*theDist;
		theVerts[1].z=theVerts[0].z+parseFloat(theInputs[2].value)*theDist;
		theEntry.counterPart.geometry.verticesNeedUpdate=true;
	}
	console.log(theEntry.counterPart.geometry.vertices);

}



/**
*
* Finds and returns the index of the direction in the list of usable vector directions
* which best matches the given vector
*
* @method dir_getDir
* @for directionConfirmGlobal
* @param {Vector3} theVec The vector to be searched with
* @return {Int} The index of the best matching direction in the list of usable vector directions
*
*/
function dir_getDir(theVec){

	var maxDot=-1;
	var theDot;
	var best=-1;
	var pos=0;
	var lim=theDirections.length;
	while(pos<lim){
		theDot=theDirections[pos].X*theVec.x+theDirections[pos].Y*theVec.y+theDirections[pos].Z*theVec.z;
		if(theDot>maxDot){
			maxDot=theDot;
			best=pos;
		}
		pos++;
	}
	return best;

}



/**
*
* Processes the information in the webpage into an XML string and inserts a download link
* for the data into the top of the page
*
* @method dir_renderXML
* @for directionConfirmGlobal
* @return {Void}
*
*/
function dir_renderXML(){


	var start= "<?xml version='1.0' encoding='utf-8'?>\n"+
				"<DirectionSaveStructure xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>\n";
	var end= "</DirectionSaveStructure>\n";

	var arcContent = "<arcs>\n";
	var idxPos;
	var idxLim;
	pos=0;
	lim=namePairs.length;
	while(pos<lim){
		arcContent = arcContent+"<arc xsi:type='Connection'>\n";
		arcContent = arcContent+"<name>"+namePairs[pos].name+"</name>\n";
		arcContent = arcContent+"<localLabels>"+namePairs[pos].localLabels+"</localLabels>\n";
		arcContent = arcContent+"<localVariables>"+namePairs[pos].localVariables+"</localVariables>\n";
		arcContent = arcContent+"<From>"+namePairs[pos].Mov+"</From>\n";
		arcContent = arcContent+"<To>"+namePairs[pos].Ref+"</To>\n";
		arcContent = arcContent+"<directed>"+namePairs[pos].Directed+"</directed>\n";
		arcContent = arcContent+"<doublyDirected>"+namePairs[pos].DoublyDirected+"</doublyDirected>\n";
		arcContent = arcContent+"<InfiniteDirections> \n";
		idxPos=0;
		idxLim=namePairs[pos].InfiniteDirections.length;
		while(idxPos<idxLim){
			arcContent = arcContent+"<int>"+namePairs[pos].InfiniteDirections[idxPos].toString()+"</int>\n";
			idxPos++;
		}
		arcContent = arcContent+"</InfiniteDirections>\n";
		arcContent = arcContent+"<FiniteDirections>"+namePairs[pos].FiniteDirections+"</FiniteDirections>\n";
		arcContent = arcContent+"<Fasteners>"+namePairs[pos].Fasteners+"</Fasteners>\n";
		arcContent = arcContent+"<Certainty>"+namePairs[pos].Certainty+"</Certainty>\n";
		arcContent = arcContent+"<ConnectionType>"+namePairs[pos].ConnectionType+"</ConnectionType>\n";

		arcContent = arcContent+"</arc>\n";
		pos++;
	}
	arcContent= arcContent + "</arcs>\n";

	var result = start + arcContent + end;

	outText = result;
	requestAdvance(5);

}



/**
*
* Initializes the lines for the XYZ compass in the display
*
* @method dir_initAxisLines
* @for directionConfirmGlobal
* @return {Void}
*
*/
function dir_initAxisLines(){

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

	theAddAxis = new THREE.Line(  new THREE.Geometry(),  new THREE.LineBasicMaterial({color: 0x00ff00, depthTest: true }));
	theAddAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theAddAxis.geometry.vertices.push(new THREE.Vector3(0,0,0));
	theAddAxis.frustumCulled = false;


	scene.add(theXAxis);
	scene.add(theYAxis);
	scene.add(theZAxis);
	scene.add(theAddAxis);


}


/**
*
* Updates the lines for the XYZ compass in the display
*
* @method dir_updateAxisLines
* @for directionConfirmGlobal
* @return {Void}
*
*/
function dir_updateAxisLines(){

	var theRot= new THREE.Quaternion(0,0,0,0);
	theRot.setFromEuler(camera.rotation);
	var theDir= new THREE.Vector3(-3,-3,-5);

	theDir.applyQuaternion(theRot);


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

}




/**
*
* Maps a given mouse X position and mouse Y position to a point on a unit hemisphere facing
* towards the user then returns the index of the closest valid direction
*
* @method dir_getDirectionFromMouse
* @for directionConfirmGlobal
* @param {Float} mouseX
* @param {Float} mouseY
* @return {Int}
*
*/
function dir_getDirectionFromMouse( mouseX, mouseY ){

	var mouseZ;
	mouseZ = Math.pow(1-((mouseX*mouseX)+(mouseY*mouseY)),0.5);

	var theVec = new THREE.Vector3(mouseX,mouseY,mouseZ);
	var theRot = new THREE.Euler( 	0-Math.atan2(thePos.y,Math.sqrt(Math.pow(thePos.z,2)+Math.pow(thePos.x,2))),
									Math.atan2(thePos.x,thePos.z),
									0,
									'ZYX' );
	theVec.applyEuler(theRot);

	var theDir = dir_getDir(theVec);
	return theDir;

}




/**
*
* Adds a vector to the currently displayed pair based off of camera position, mouse X and mouse Y
*
* @method dir_addVectorFromMouse
* @for directionConfirmGlobal
* @param {Float} mouseX The X position of the mouse
* @param {Float} mouseY The Y position of the mouse
* @return {Void}
*
*/
function dir_addVectorFromMouse ( mouseX, mouseY ){

	var theButton = document.getElementById("addButton");
	var theArea = document.getElementById("display");
	var areaW = theArea.clientWidth;
	var areaH = theArea.clientHeight;
	var areaT = theArea.offsetTop;
	var areaL = theArea.offsetLeft;
	console.log("aW: "+areaW+" aH: "+areaH+" aT: "+areaT+" aL: "+areaL);
	console.log("mX: "+(((mouseX-areaL)-areaW/2)/(areaW/2))+" mY: "+((areaH/2-(mouseY-areaT))/(areaH/2)));
	var theDir = dir_getDirectionFromMouse( ((mouseX-areaL)-areaW/2)/(areaW/2), (areaH/2-(mouseY-areaT))/(areaH/2) );


	var theVecList=document.getElementById("vecList");
	var theVecs = theVecList.childNodes;
	var pos = 0;
	var lim = theVecs.length;
	var testVec = new THREE.Vector3(theDirections[theDir].X,theDirections[theDir].Y,theDirections[theDir].Z);
	var otherVec = new THREE.Vector3(0,0,0);
	while(pos<lim){
		if(theVecs[pos]!==null){
			otherVec.copy(theVecs[pos].counterPart.geometry.vertices[1]);
			otherVec.sub(theVecs[pos].counterPart.geometry.vertices[0]);
			if(testVec.angleTo(otherVec) < 0.15){
				return;
			}
		}
		pos++;
	}
	delete testVec;
	delete otherVec;
	var theElem = dir_addVectorToPair(theButton);
	var theInputs = theElem.getElementsByTagName("input");
	theInputs[0].value = theDirections[theDir].X;
	theInputs[1].value = theDirections[theDir].Y;
	theInputs[2].value = theDirections[theDir].Z;
	theInputs[0].onchange();

}










startupScripts["4"] = function() {


	lastPair=null;
	currentPair=null;


	theWidth=document.getElementById("display").clientWidth;
	theHeight= document.getElementById("display").clientHeight;

	// The scene of the assembly animation
	//scene = new THREE.Scene();

	// The camera
	//camera = new THREE.PerspectiveCamera( 75, theWidth/theHeight, 1, 16000 );


	document.getElementById("display").appendChild( renderer.domElement );



	// Inserts the file loading manager into the document
	//document.getElementById('fileinput').addEventListener('change', dir_readMultipleFiles, false);
	document.getElementById("display").addEventListener("mousemove", dir_doDrag);
	document.getElementById("display").addEventListener("wheel", dir_doZoom);

	theXML = inText;

	var i = 0;
	var lim = directionList.length;
	theDirections = [];
	while( i < lim ){
		theDirections.push({
			X: directionList[i][0],
			Y: directionList[i][1],
			Z: directionList[i][2]
		});
		i++;
	}

	dir_renderParts();

}
//</script>
