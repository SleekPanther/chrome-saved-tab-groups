const GROUP_COUNT = 10
//Separate data structurs since chrome.storage limits size (can't store entire Tab objects)
let savedTabGroupsUrls = new Array(GROUP_COUNT)
let savedTabGroupsTitles = new Array(GROUP_COUNT)
let savedTabGroupsFaviconUrls = new Array(GROUP_COUNT)
let savedTabGroupsPinned = new Array(GROUP_COUNT)

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.msg == "saveGroup") {
			saveCurrentWindowTabs(request.groupNumber)
		}
	}
)

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.msg == "loadGroup") {
			loadTabs(request.groupNumber)
		}
	}
)

function saveCurrentWindowTabs(groupNumber) {
	console.log('Save Group '+groupNumber)

	chrome.tabs.query({lastFocusedWindow: true}, (tabs)=>{
		savedTabGroupsUrls[groupNumber]=[]
		savedTabGroupsTitles[groupNumber]=[]
		savedTabGroupsFaviconUrls[groupNumber]=[]
		savedTabGroupsPinned[groupNumber]=[]
		tabs.forEach(function(tab, i){
			savedTabGroupsUrls[groupNumber].push(tab.url)
			savedTabGroupsTitles[groupNumber].push(tab.title)
			savedTabGroupsFaviconUrls[groupNumber].push(tab.favIconUrl)
			savedTabGroupsPinned[groupNumber].push(tab.pinned)
			console.log(tab.title)
		})

		console.log('Saved Tab URLs\n', savedTabGroupsUrls)

		chrome.storage.sync.set({
				'savedTabGroupsUrls': savedTabGroupsUrls, 
				'savedTabGroupsTitles': savedTabGroupsTitles, 
				'savedTabGroupsFaviconUrls': savedTabGroupsFaviconUrls, 
				'savedTabGroupsPinned': savedTabGroupsPinned
			}, () => {
			if(chrome.runtime.lastError){
				console.log('Likely failed to set & sync storage\n', chrome.runtime.lastError.message)
			}
		})
	})
}

function loadTabs(groupNumber){
	console.log('Load Group', groupNumber)

	chrome.storage.sync.get(['savedTabGroupsUrls', 'savedTabGroupsPinned'], function(syncedTabData) {
		if(chrome.runtime.lastError){
			console.log(chrome.runtime.lastError.message)
		}

		if(syncedTabData.savedTabGroupsUrls === undefined){
			console.log('Failed to sync savedTabGroupsUrls or empty group, using empty array')
		}
		else{
			savedTabGroupsUrls=syncedTabData.savedTabGroupsUrls
		}

		if(syncedTabData.savedTabGroupsPinned === undefined){
			console.log('Failed to sync savedTabGroupsPinned or empty group, using empty array')
		}
		else{
			savedTabGroupsPinned=syncedTabData.savedTabGroupsPinned
		}
	})

	chrome.windows.create({
		type: 'normal',
		focused: true, 
		state: 'maximized'
	}, ()=>{})

	if(savedTabGroupsUrls[groupNumber]===undefined || savedTabGroupsPinned[groupNumber]===undefined){
		console.log('No tab data for group', groupNumber, 'Using empty window')
		return
	}

	//Update the new empty tab to the 1st saved Tab
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		let activeTab = arrayOfTabs[0]		// only one tab should be active and in the current window at once
		
		let tabUrlsToLoad = savedTabGroupsUrls[groupNumber]
		let tabPinnedStatus = savedTabGroupsPinned[groupNumber]

		if(tabPinnedStatus[0]){
			chrome.tabs.update(activeTab.id, {url: tabUrlsToLoad[0], pinned: true})
		}
		else{
			chrome.tabs.update(activeTab.id, {url: tabUrlsToLoad[0]})
		}
		
		//Start at index 1 & create new tabs for the rest of the saved tabs
		for(let index=1; index<tabUrlsToLoad.length; index++){
			if(tabPinnedStatus[index]){
				chrome.tabs.create({
					url: tabUrlsToLoad[index],
					index: index, 
					pinned: true
				})
			}
			else{
				chrome.tabs.create({
					url: tabUrlsToLoad[index],
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
	else if(command === "clearSynced"){
		console.log('Cleared Synced')
		chrome.storage.sync.clear()
		savedTabGroupsUrls = new Array(GROUP_COUNT)
	}
})