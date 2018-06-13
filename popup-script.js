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
	(request, sender, sendResponse) => {
		if (request.msg === 'testMessage') {
			console.log('Test Message')
		}
	}
)

//Recreate HTML in popoup from javascript if data changes
chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.msg === 'tabsDataUpdated') {
			initPopup()
		}
	}
)

document.addEventListener("DOMContentLoaded", ()=>{
	const saveModifierKey=18	//alt
	const loadAdditionalModifierKey=16	//shift
	let isSaveModifierKeyDown = false
	let isLoadAdditionalModifierKeyDown = false
	
	document.onkeyup=function(e) {	//Detect when modifier key is released (no keyboard shortcut should happen)
		if(e.which == saveModifierKey){
			isSaveModifierKeyDown=false;
		}
		if(e.which == loadAdditionalModifierKey){
			isLoadAdditionalModifierKeyDown=false
		}
	}
	document.onkeydown=function(e){
		let keycode=e.which
		if(keycode == saveModifierKey){
			isSaveModifierKeyDown=true
		}
		if(keycode == loadAdditionalModifierKey){
			isLoadAdditionalModifierKeyDown=true
		}

		if(isLoadAdditionalModifierKeyDown && isSaveModifierKeyDown && isValidComboKey(keycode)) {
			loadGroup(keycodeToKey[keycode])
		}
		else if(isSaveModifierKeyDown && isValidComboKey(keycode)) {
			saveGroup(keycodeToKey[keycode])
		}
	}

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
	chrome.runtime.sendMessage({msg: 'getTabData'}, (response)=>{
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
				links += `<a href="${savedTabGroupsUrls[group][i]}"><img src="${faviconSrc}" width="16" height="16">${savedTabGroupsTitles[group][i]}</a>`
			}
		}

		let tabCountInfo=`<span class="tabCountInfo">(${savedTabCount} tabs)</span><br>`
		if(savedTabCount===1){
			tabCountInfo=`<span class="tabCountInfo">(${savedTabCount} tab)</span><br>`
		}

		rowContent.push(
			`<tr>
				<td id='save${group}'>Group ${group}</td>
				<td id='load${group}'>${tabCountInfo}
					<div class='linksContainer'>
						<div class='links'>${links}</div>
					</div>
				</td>
			</tr>`
		)
	})
	rowContent.push('</tbody>')
	document.getElementById('groupTable').innerHTML = rowContent.join('')
}

function registerClickHandlers(){
	//Click Handlers for saving/loading entire group
	document.querySelector('#groupButtons').addEventListener('click', (e)=>{
		if(e.target !== e.currentTarget){	//don't add listener to the container itself
			let element = e.target
			if(!e.target.id){	//get parent if click detected on child element
				element = element.parentElement
			}
			
			let group = element.id.slice(-1)
			let action = element.id.slice(0, element.id.length-1)

			if(action==='save'){
				saveGroup(group)
			}
			else if(action==='load'){
				loadGroup(group)
			}
		}
	})

	//Click events to make links in popup open new tabs
	document.querySelector('#groupButtons').addEventListener('click', (e)=>{
		if(e.target.href){		//if it has an href attribute, it must be a link
			if(!e.ctrlKey && !e.shiftKey){		//Ctrl & shift already open tabs
				chrome.tabs.create({
					url: e.target.href
				})
			}
		}
	})
}