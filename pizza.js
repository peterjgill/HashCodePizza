var fs = require('fs');

// global variables

let inputFileName = "a_example.in";
let outputFileName = "response_a.txt";

let fileData = ""; // data directly from file

// variables read from file
let pizzaData; // 2d array of M or T
let totalRows; // R
let totalCols; // C
let minIngredients; // L - min of each ingredient
let maxSize; // H - max number of cells

let factorArray; // array of arrays of factors of varying area of slice

let isInSlice; // same as pizzaData, but values are true or false for if it is in a slice

let sliceArray = []; // each element is array of [y1, x1, y2, x2]

fs.readFile(inputFileName, "utf-8", function(err, buf) {
	fileData = buf.toString();
	
	setVariables(fileData);
	
	// program runtime
	cutInitialSlices();
});

// set the variables to what they should be from the data string
function setVariables(data) {
	dataArray = data.split(" ");
	
	totalRows = dataArray[0];
	totalCols = dataArray[1];
	minIngredients = dataArray[2];
	
	// for the maxSize variable, split at first newLine
	let i = dataArray[3].indexOf("\n");
	maxSize = dataArray[3].substring(0, i);
	pizzaData = convertToArray(dataArray[3].substring(i+1));
	
	factorArray = generateFactorArray();
	
	isInSlice = generateIsInSlice();
}

function writeToFile(data) {
	fs.writeFile(outputFileName, data, function(err, data){ 
	    if (err) console.log(err);
	    console.log("Successfully Written to File.");
	});
}

// col = x
// row = y
// (y, x)

function convertToArray(string) {
	let array = [];
	array = string.split(/\n/);
	array.pop();
	for (let i = 0; i < array.length; i++) {
		array[i] = array[i].split(""); // split into separate strings
	}
	return array;
}

function generateIsInSlice() {
	let arr = [];
	for (let i = 0; i < totalRows; i++) {
		let el = [];
		for (let x = 0; x < totalCols; x++) {
			el.push(false);
		}
		arr.push(el);
	}
	return arr;
}

function findFactors(n) {
	let factorArray = [];
	for (let i = 1; i < Math.sqrt(n); i++) {
		if (n%i === 0) {
			// valid factor
			let j = n / i;
			factorArray.push([j, i]);
			factorArray.push([i, j]);
		}
	}
	// try sqrt
	if (n%Math.sqrt(n) === 0) {
		// valid factor
		factorArray.push([Math.sqrt(n), Math.sqrt(n)]);
	}
	return factorArray;
}

// index = array of factors for that index
function generateFactorArray() {
	let array = [[]];
	for (let i = 1; i <= maxSize; i++) {
		array.push(findFactors(i));
	}
	return array;
}

// coords from (x1, y1) to (x2, y2) inclusive
function getSlice(y1, x1, y2, x2) {
	let array = [];
	for (let y = y1; y <= y2; y++) {
		let el = []
		for (let x = x1; x <= x2; x++) {
			el.push(pizzaData[y][x]);
		}
		array.push(el);
	}
	return array;
}

// parameter is from getSlice
function checkSlice(slice) {
	let T = 0;
	let M = 0;
	for(let y = 0; y < slice.length; y++){
		for(let x = 0; x < slice[y].length; x++){
			if(slice[y][x] === "T"){
				T++;
			}else{
				M++;
			}
		}
	}
	return T >= minIngredients && M >= minIngredients;
}

// returns in format [height, width]
function findValidSlice(y, x, area) {
	let array = [];
	for (let i = area.length-1; i >= 0; i--) {
		if (totalRows - y - area[i][0] >= 0 && totalCols - x - area[i][1] >= 0){
			let available = true;
			for (let dx = 0; dx < area[i][1]; dx++) {
				if(isInSlice[y][x+dx]) {
					available = false;
				}
			}
			if (available) {
				array.push(area[i]);
			}
		}
	}
	for(let i = 0; i < array.length; i++){
		let slice = getSlice(y, x, y+array[i][0]-1, x+array[i][1]-1);
		if(checkSlice(slice)){
			return array[i];
		}
	}
	return false;
}

// add a confirmed slice to the correct arrays etc.
// coords from (x1, y1) to (x2, y2) inclusive
function confirmSlice(y1, x1, y2, x2) {
	sliceArray.push([y1, x1, y2, x2]);
	
	// set the values in the isInSlice array
	for (let y = y1; y <= y2; y++) {
		for (let x = x1; x <= x2; x++) {
			if (isInSlice[y][x] === false) {
				// everything has gone as planned
				isInSlice[y][x] = true;
			}
			else {
				console.error("Uh oh, an invalid slice has been confirmed.");
			}
		}
	}
}

function cutInitialSlices() {
	for (let y = 0; y < totalRows; y++) {
		for (let x = 0; x < totalCols; x++) {
			if (isInSlice[y][x] === false) {
				// tile is not in a slice yet
				
				for (let sliceArea = maxSize; sliceArea > 0; sliceArea--) {
					// iterate through slice areas
					// find a valid slice from x y coordinates of width and height in factor array
					let validSlice = findValidSlice(y, x, factorArray[sliceArea]);
					if (validSlice !== false) {
						confirmSlice(y, x, y + validSlice[0] - 1, x + validSlice[1] - 1); // add to arrays etc.
						break;
					}
					// otherwise there are no valid slices for this size, so decrease slice area by 1 and try again
				}
				
			}
		}
	}
	
	done();
}

function generateWriteData(slices) {
	let writeData = "";
	writeData += slices.length + "\n";
	for (let slice = 0; slice < slices.length; slice++) {
		for (let i = 0; i < slices[slice].length; i++) {
			writeData += slices[slice][i];
			if (i !== slices[slice].length - 1) {
				// space to separate
				writeData += " ";
			}
		}
		// \n to separate
		writeData += "\n";
	}
	
	return writeData;
}

/*function calculateScore(slices) {
	let score = 0;
	for (let i = 0; i < slices.length; i++) {
		let height = slices[i][2] + 1 - slices[i][0];
		let width = slices[i][3] + 1 - slices[i][1];
		score += height * width;
	}
	return score;
}*/

function done() {
	let writeData = generateWriteData(sliceArray);
	
	writeToFile(writeData);
	
	//console.log(writeData);
	//console.log(calculateScore(sliceArray));
}
