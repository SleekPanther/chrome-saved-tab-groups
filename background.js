chrome.runtime.onMessage.addListener(function(response, sender, sendResponse){
	// alert(response)
})

let savedTabs = []

function saveCurrentWindowTabs() {
	// chrome.storage.sync.clear()
	savedTabs = []		//reset any previously saved tabs

	chrome.windows.getCurrent((currentWindow)=>{
		chrome.tabs.query({windowId: currentWindow.id}, (tabs)=>{
			tabs.forEach(function(tab, i){
				savedTabs.push(tab)
			})

			chrome.storage.sync.set({'savedTabs': savedTabs}, () => {
				if(chrome.runtime.lastError){
					console.log('Failed to set savedTabs & sync storage')
				}
			});
		})
	})
}

function loadTabs(){
	chrome.storage.sync.get("savedTabs", function(syncedsavedTabs) {
		if(syncedsavedTabs.savedTabs === undefined || chrome.runtime.lastError){
			console.log('Failed to sync savedTabs, using empty array')
		}
		else{
			savedTabs=syncedsavedTabs.savedTabs
		}
	})

	chrome.windows.create({
		type: 'normal',
		focused: true, 
		state: 'maximized'
	}, ()=>{})

	//Update the new empty tab to the 1st saved Tab
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		let activeTab = arrayOfTabs[0]		// only one tab should be active and in the current window at once
		if(savedTabs[0].pinned){
			chrome.tabs.update(activeTab.id, {url: savedTabs[0].url, pinned: true})
		}
		else{
			chrome.tabs.update(activeTab.id, {url: savedTabs[0].url})
		}
		
		//Start at index 1 & create new tabs for the rest of the saved savedTabs
		for(index=1; index<savedTabs.length; index++){
			if(savedTabs[index].pinned){
				chrome.tabs.create({
					url: savedTabs[index].url,
					index: index, 
					pinned: true
				})
			}
			else{
				chrome.tabs.create({
					url: savedTabs[index].url,
					index: index
				})
			}
		}
	})
}


chrome.commands.onCommand.addListener(function(command) {
	if(command === "saveTabs"){
		saveCurrentWindowTabs()
	}
	else if(command === "loadTabs"){
		loadTabs()
	}
	// else{
	// 	alert(command)
	// }
})

//10 groups (1-9, then 0=10?)