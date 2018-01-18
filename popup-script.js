const keycodeToKey = {
	//Normal keys
	48: 0, 
	49: 1, 
	50: 2, 
	51: 3, 
	52: 4, 
	53: 5, 
	54: 6, 
	55: 7, 
	56: 8, 
	57: 9, 
	//numpad
	96: 0, 
	97: 1, 
	98: 2, 
	99: 3, 
	100: 4, 
	101: 5, 
	102: 6, 
	103: 7, 
	104: 8, 
	105: 9, 
}

document.addEventListener('DOMContentLoaded', doStuff, false);

function doStuff(){
	const modifierKey=18
	let isModifierKey = false
	$(document).keyup(function (e) {	//Detect when modifier key is released (no keyboard shortcut should happen)
		if(e.which == modifierKey){
			isModifierKey=false;
		}
	}).keydown(function (e) {
		let keycode=e.which
		if(keycode == modifierKey){
			isModifierKey=true;
		}
		if(isModifierKey && isValidComboKey(keycode)) {
			console.log(keycodeToKey[keycode])
		}
	});
}

function isValidComboKey(keycode){
	const digitLowerBound=48
	const digitUpperBound=57
	const numpadLowerBound=96
	const numpadUpperBound=105
	return (keycode>=digitLowerBound && keycode<=digitUpperBound) || (keycode>=numpadLowerBound && keycode<=numpadUpperBound)
}

function saveGroup(groupNumber){

}