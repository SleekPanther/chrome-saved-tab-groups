chrome.runtime.onMessage.addListener(function(response, sender, sendResponse){
	// alert(response)
})

let URLs = []

function saveCurrentWindowTabs() {
	URLs = []		//reset any previously saved tabs
	chrome.windows.getCurrent(getTabUrls)
}

function getTabUrls(win) {
	chrome.tabs.query({windowId: win.id}, function(tabs){
		tabs.forEach(function(tab, i){
			URLs.push(tab.url)
			console.log(i+": index="+tab.index+" "+tab.url)
		})
	})
}

function loadTabs(){
	chrome.windows.create({
		// tabId: tab.id,
		type: 'normal',
		focused: true, 
		state: 'maximized'
	}, ()=>{})

	//Update the new empty tab to the 1st saved URL
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		let activeTab = arrayOfTabs[0]		// only one tab should be active and in the current window at once
		chrome.tabs.update(activeTab.id, {url: URLs[0]})
	})

	//Start at index 1 & create new tabs for the rest of the saved URLs
	for(index=1; index<URLs.length; index++){
		console.log("in="+index+": "+URLs[index])
		chrome.tabs.create({url: URLs[index], index: index})
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