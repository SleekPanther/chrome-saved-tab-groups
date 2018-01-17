chrome.runtime.onMessage.addListener(function(response, sender, sendResponse){
	// alert(response)
})

let savedTabs = []

function saveCurrentWindowTabs() {
	// chrome.storage.sync.clear()

	savedTabs = []		//reset any previously saved tabs
	chrome.windows.getCurrent(getCurrentWindowTabs)
}

function getCurrentWindowTabs(win) {
	chrome.tabs.query({windowId: win.id}, (tabs)=>{
		tabs.forEach(function(tab, i){
			savedTabs.push(tab)
			console.log(i+": index="+tab.index+" "+tab.url+" pinned="+tab.pinned+" title="+tab.title)
		})

		chrome.storage.sync.set({'savedTabs': savedTabs}, () => {
			if(chrome.runtime.lastError){
				console.log('Failed to set savedTabs & sync storage')
			}
		});
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
		chrome.tabs.update(activeTab.id, {url: savedTabs[0].url})
	})

	//Start at index 1 & create new tabs for the rest of the saved savedTabs
	for(index=1; index<savedTabs.length; index++){
		console.log("in="+index+": "+savedTabs[index])
		chrome.tabs.create({
			url: savedTabs[index].url,
			index: index
		})
	}
}

chrome.commands.onCommand.addListener(function(command) {
	if(command === "saveTabs"){
		saveCurrentWindowTabs()
	}
	else if(command === "loadTabs"){
		loadTabs()
	}
	else{
		alert(command)
	}
})

/* store objects {title, url, pinned}
if(myTab.pinned){
	make pinned tab
	https://stackoverflow.com/questions/36289244/programatically-pin-a-tab-in-google-chrome
}
else{
	make normal tab
}

myTab.title = used for displaying previews for what's in a tab group
*/