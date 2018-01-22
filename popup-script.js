const keycodeToKey = {
	//Normal number keys
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

$().ready( ()=>{
	const saveModifierKey=18
	const loadAdditionalModifierKey=17
	let isSaveModifierKey = false
	let isLoadAdditionalModifierKey = false
	
	$(document).keyup(function (e) {	//Detect when modifier key is released (no keyboard shortcut should happen)
		if(e.which == saveModifierKey){
			isSaveModifierKey=false;
		}
		if(e.which == loadAdditionalModifierKey){
			isLoadAdditionalModifierKey=false
		}
	}).keydown(function (e) {
		let keycode=e.which
		if(keycode == saveModifierKey){
			isSaveModifierKey=true
		}
		if(keycode == loadAdditionalModifierKey){
			isLoadAdditionalModifierKey=true
		}

		if(isLoadAdditionalModifierKey && isSaveModifierKey && isValidComboKey(keycode)) {
			loadGroup(keycodeToKey[keycode])
		}
		else if(isSaveModifierKey && isValidComboKey(keycode)) {
			saveGroup(keycodeToKey[keycode])
		}
	})

	populateGroupButtons()
})

function isValidComboKey(keycode){
	const digitLowerBound=48
	const digitUpperBound=57
	const numpadLowerBound=96
	const numpadUpperBound=105
	return (keycode>=digitLowerBound && keycode<=digitUpperBound) || (keycode>=numpadLowerBound && keycode<=numpadUpperBound)
}

function saveGroup(groupNumber){
	chrome.runtime.sendMessage({
		msg: "saveGroup", 
		groupNumber: groupNumber
	})
	window.close()		//close popup to fix lastFocusedWindow not changing
}

function loadGroup(groupNumber){
	chrome.runtime.sendMessage({
		msg: "loadGroup", 
		groupNumber: groupNumber
	})
	window.close()
}

function populateGroupButtons(){
	const groups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]		//group 0 is at the end
	let newRowContent = []
	groups.forEach((group)=>{
			newRowContent.push(
			'<tr> \
				<td id="save'+group+'">'+
					group+
				'</td>\
				<td id="load'+group+'">'+
					group+
				'</td>\
			</tr>'
		)
	})
	$('#groupButtons').append(newRowContent.join(''))

	$().ready(registerClickHandlers)
}

function registerClickHandlers(){
	$('#groupButtons').on('click', 'td', (e)=>{ 
		let group = e.target.id.slice(-1)
		let action = e.target.id.slice(0, e.target.id.length-1)

		if(action==='save'){
			saveGroup(group)
		}
		else if(action==='load'){
			loadGroup(group)
		}
	})
}
