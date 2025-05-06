// background.js (updated)
const redirectedTabs = new Set();

chrome.action.onClicked.addListener(() => {
  console.log('[BACKGROUND] Extension icon clicked');
  chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/collections/easy-apply/' });
});

chrome.runtime.onMessage.addListener((request, sender) => {
  console.log(`[BACKGROUND] Received message: ${request.type}`);
  
  switch(request.type) {
    case 'LOGIN_STATUS':
      handleLoginStatus(request, sender);
      break;
    case 'JOB_DATA':
      handleJobData(request.data);
      break;
    case 'SAVE_JOBS_FILE':
      handleFileDownload(request);
      break;
  }
  return true;
});

function handleLoginStatus(request, sender) {
  const tabId = sender.tab.id;
  const isEasyApplyPage = sender.url.includes('/collections/easy-apply/');

  if (!redirectedTabs.has(tabId) && request.data.isLoggedIn && !isEasyApplyPage) {
    redirectedTabs.add(tabId);
    chrome.tabs.update(tabId, {
      url: "https://www.linkedin.com/jobs/collections/easy-apply/"
    });
  }
}

function handleJobData(jobs) {
  if (!jobs?.length) {
    console.warn('[BACKGROUND] Received empty job list');
    return;
  }

  chrome.storage.local.set({ scrapedJobs: jobs }, () => {
    if (chrome.runtime.lastError) {
      console.error('[BACKGROUND] Storage error:', chrome.runtime.lastError);
    }
  });
}

function handleFileDownload(request) {
  chrome.downloads.download({
    url: request.url,
    filename: request.filename,
    conflictAction: 'uniquify'
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('[BACKGROUND] Download failed:', chrome.runtime.lastError);
    }
    URL.revokeObjectURL(request.url); // Cleanup blob URL
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  redirectedTabs.delete(tabId);
});