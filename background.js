const GROUP_COUNT = 10
//Separate data structurs since chrome.storage limits size (can't store entire Tab objects)
let savedTabGroupsUrls = new Array(GROUP_COUNT)
let savedTabGroupsTitles = new Array(GROUP_COUNT)
let savedTabGroupsFaviconUrls = new Array(GROUP_COUNT)
let savedTabGroupsPinned = new Array(GROUP_COUNT)

let storageMode = 'sync'	//whether data should be synced or local (sometimes sync gets full & must resort to local)

chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.msg === 'saveGroup') {
			saveCurrentWindowTabs(request.groupNumber)
		}
	}
)

chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.msg === 'loadGroup') {
			loadTabs(request.groupNumber)
		}
	}
)

chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.msg === 'getTabData') {
			sendResponse({
				savedTabGroupsUrls: savedTabGroupsUrls, 
				savedTabGroupsTitles: savedTabGroupsTitles, 
				savedTabGroupsFaviconUrls: savedTabGroupsFaviconUrls
			})
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
		tabs.forEach((tab, i)=>{
			savedTabGroupsUrls[groupNumber].push(tab.url)
			savedTabGroupsTitles[groupNumber].push(tab.title)
			savedTabGroupsFaviconUrls[groupNumber].push(tab.favIconUrl)
			savedTabGroupsPinned[groupNumber].push(tab.pinned)
		})

		console.log('Saved Tab URLs\n', savedTabGroupsUrls)

		storageMode = 'sync'	//attempt to use sync
		chrome.storage.sync.set({
				'savedTabGroupsUrls': savedTabGroupsUrls, 
				'savedTabGroupsTitles': savedTabGroupsTitles, 
				'savedTabGroupsFaviconUrls': savedTabGroupsFaviconUrls, 
				'savedTabGroupsPinned': savedTabGroupsPinned
			}, () => {
			if(chrome.runtime.lastError){
				console.log(chrome.runtime.lastError.message)

				chrome.storage.local.set({
						'savedTabGroupsUrls': savedTabGroupsUrls, 
						'savedTabGroupsTitles': savedTabGroupsTitles, 
						'savedTabGroupsFaviconUrls': savedTabGroupsFaviconUrls, 
						'savedTabGroupsPinned': savedTabGroupsPinned
					}, () => {
						console.log('Saving to Local storage')
						storageMode='local'
				})
			}
		})
	})
}

function loadTabs(groupNumber){
	console.log('Load Group', groupNumber)

	 if(storageMode==='sync'){
		chrome.storage.sync.get(['savedTabGroupsUrls', 'savedTabGroupsPinned'], (tabDataResponse)=>{
			copyTabDataFromStorageToVariables(tabDataResponse)
		})
	}
	else{
		chrome.storage.local.get(['savedTabGroupsUrls', 'savedTabGroupsPinned'], (tabDataResponse)=>{
			copyTabDataFromStorageToVariables(tabDataResponse)
		})
	}

	chrome.windows.create({
		type: 'normal',
		focused: true, 
		state: 'maximized'
	}, ()=>{})

	if(savedTabGroupsUrls[groupNumber]===undefined || savedTabGroupsPinned[groupNumber]===undefined){
		console.log('No tab data for group', groupNumber, 'Using empty window')
		return
	}

	//Update the new empty window/tab to the 1st saved Tab
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
			chrome.tabs.create({
				url: tabUrlsToLoad[index],
				index: index, 
				pinned: tabPinnedStatus[index]
			})
		}
	})
}

function copyTabDataFromStorageToVariables(tabDataResponse){
	if(chrome.runtime.lastError){
		console.log(chrome.runtime.lastError.message)
	}

	if(tabDataResponse.savedTabGroupsUrls === undefined){
		console.log('Failed to sync savedTabGroupsUrls or empty group, using empty array')
	}
	else{
		savedTabGroupsUrls=tabDataResponse.savedTabGroupsUrls
	}

	if(tabDataResponse.savedTabGroupsPinned === undefined){
		console.log('Failed to sync savedTabGroupsPinned or empty group, using empty array')
	}
	else{
		savedTabGroupsPinned=tabDataResponse.savedTabGroupsPinned
	}
}


//Listen for keyboard shotcuts
const defaultGroup = 1
chrome.commands.onCommand.addListener(command => {
	if(command === 'saveTabs'){
		saveCurrentWindowTabs(defaultGroup)
		chrome.runtime.sendMessage({
			msg: 'tabsDataUpdated', 
		})
	}
	else if(command === 'loadTabs'){
		loadTabs(defaultGroup)
	}
	else if(command === 'clearSynced'){
		console.log('Cleared Synced')
		chrome.storage.sync.clear()

		savedTabGroupsUrls = new Array(GROUP_COUNT)
		savedTabGroupsTitles = new Array(GROUP_COUNT)
		savedTabGroupsFaviconUrls = new Array(GROUP_COUNT)
		savedTabGroupsPinned = new Array(GROUP_COUNT)
	}

	//Testing
	else if(command === 'test'){
		console.log('test', savedTabGroupsUrls, savedTabGroupsTitles, savedTabGroupsFaviconUrls, savedTabGroupsPinned)
		chrome.runtime.sendMessage({
			msg: 'testMessage'
		})
	}
})