const GROUP_COUNT = 10
let savedTabGroups = new Array(GROUP_COUNT)

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.msg == "saveGroup") {
			saveCurrentWindowTabs(request.groupNumber)
		}
	}
)

function saveCurrentWindowTabs(groupNumber) {
	// chrome.storage.sync.clear()
	console.log('group='+groupNumber)

	let currentWindowTabs = []

	chrome.windows.getCurrent((currentWindow)=>{
		chrome.tabs.query({windowId: currentWindow.id}, (tabs)=>{
			tabs.forEach(function(tab, i){
				currentWindowTabs.push(tab)
			})

			savedTabGroups[groupNumber]=currentWindowTabs

			chrome.storage.sync.set({'savedTabGroups': savedTabGroups}, () => {
				if(chrome.runtime.lastError){
					console.log('Failed to set savedTabGroups & sync storage')
				}
			});
		})
	})
}

function loadTabs(groupNumber){
	chrome.storage.sync.get("savedTabGroups", function(syncedSavedTabGroups) {
		if(syncedSavedTabGroups.savedTabGroups === undefined || chrome.runtime.lastError){
			console.log('Failed to sync savedTabGroups, using empty array')
		}
		else{
			savedTabGroups=syncedSavedTabGroups.savedTabGroups
		}
		console.log('Synced savedTabGroups')
		console.log(savedTabGroups)
	})

	chrome.windows.create({
		type: 'normal',
		focused: true, 
		state: 'maximized'
	}, ()=>{})

	//Update the new empty tab to the 1st saved Tab
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		let activeTab = arrayOfTabs[0]		// only one tab should be active and in the current window at once
		
		//Open Blank window & Return if no saved tabs for that group
		if(savedTabGroups[groupNumber] === null){
			console.log('No saved Tabs for group '+groupNumber+'. Opening blank window')
			return
		}

		let tabsToLoad = savedTabGroups[groupNumber]

		if(tabsToLoad[0].pinned){
			chrome.tabs.update(activeTab.id, {url: tabsToLoad[0].url, pinned: true})
		}
		else{
			chrome.tabs.update(activeTab.id, {url: tabsToLoad[0].url})
		}
		
		//Start at index 1 & create new tabs for the rest of the saved tabs
		for(index=1; index<tabsToLoad.length; index++){
			if(tabsToLoad[index].pinned){
				chrome.tabs.create({
					url: tabsToLoad[index].url,
					index: index, 
					pinned: true
				})
			}
			else{
				chrome.tabs.create({
					url: tabsToLoad[index].url,
					index: index
				})
			}
		}
	})
}

const defaultGroup = 1
chrome.commands.onCommand.addListener(function(command) {
	if(command === "saveTabs"){
		saveCurrentWindowTabs(defaultGroup)
	}
	else if(command === "loadTabs"){
		loadTabs(defaultGroup)
	}
})