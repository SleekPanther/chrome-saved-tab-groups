const GROUP_COUNT = 10
//Separate data structurs since chrome.storage limits size (can't store entire Tab objects)
let savedTabGroupsUrls = new Array(GROUP_COUNT)
let savedTabGroupsTitles = new Array(GROUP_COUNT)
let savedTabGroupsFaviconUrls = new Array(GROUP_COUNT)

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
	//Numpad
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

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.msg === 'testMessage') {
			console.log('Test Message')
		}
	}
)

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.msg === 'tabsDataUpdated') {
			initPopup()
		}
	}
)

document.addEventListener("DOMContentLoaded", ()=>{
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

	initPopup()
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
		msg: 'saveGroup', 
		groupNumber: groupNumber
	}, ()=>{
		initPopup()
	})
	window.close()		//close popup to fix lastFocusedWindow not changing
}

function loadGroup(groupNumber){
	chrome.runtime.sendMessage({
		msg: 'loadGroup', 
		groupNumber: groupNumber
	})
	window.close()
}

function initPopup(){
	chrome.runtime.sendMessage({msg: 'requestSavedTabData'}, (response)=>{
		savedTabGroupsUrls = response.savedTabGroupsUrls
		savedTabGroupsTitles = response.savedTabGroupsTitles
		savedTabGroupsFaviconUrls = response.savedTabGroupsFaviconUrls

		populateGroupButtons()
		registerClickHandlers()
	})
}

function populateGroupButtons(){
	const groups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]		//group 0 is at the end due to physical keyboard layout
	let rowContent = [
		`<thead>
			<tr>
				<th>Save</th>
				<th>Load</th>
			</tr>
		</thead>
		<tbody id="groupButtons">`
	]
	groups.forEach((group)=>{
		let savedTabCount=0
		let links=''
		if(savedTabGroupsUrls[group]){
			savedTabCount=savedTabGroupsUrls[group].length

			for(let i=0; i<savedTabGroupsTitles[group].length; i++){
				let faviconSrc = 'assets/blank-favicon.png'
				if(savedTabGroupsFaviconUrls[group][i]){
					faviconSrc = savedTabGroupsFaviconUrls[group][i]
				}
				links += ('<a href="'+ savedTabGroupsUrls[group][i] +'">'+ '<img src="'+faviconSrc+'" width="16" height="16">'+ savedTabGroupsTitles[group][i] + '</a>')
			}
		}

		let tabCountInfo='<span class="tabCountInfo">('+savedTabCount+' tabs)</span><br>'
		if(savedTabCount===1){
			tabCountInfo='<span class="tabCountInfo">('+savedTabCount+' tab)</span><br>'
		}

		rowContent.push(
			`<tr>
				<td id='save${group}'>Group ${group}</td>
				<td id='load${group}'>${tabCountInfo}
					<div class='linksContainer'>
						<div class='links'>
							${links}
						</div>
					</div>
				</td>
			</tr>`
		)
	})
	document.getElementById('groupButtons').innerHTML = rowContent.join('')
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

	$('#groupButtons').on('click', '.links a', (e)=>{ 
		if(!e.ctrlKey && !e.shiftKey){		//Ctrl & shift already open tabs
			chrome.tabs.create({
				url: e.target.href
			})
		}
	})
}