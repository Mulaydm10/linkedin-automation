// save-jobs.js (enhanced)
console.log('[SAVER] save-jobs.js loaded');

let saveCooldown = false;
const DEBOUNCE_TIME = 5000; // 5 seconds cooldown

chrome.storage.onChanged.addListener((changes) => {
  if (changes.scrapedJobs && !saveCooldown) {
    saveCooldown = true;
    setTimeout(() => saveCooldown = false, DEBOUNCE_TIME);
    
    console.log('[SAVER] New jobs data received');
    saveJobsToFile(changes.scrapedJobs.newValue)
      .catch(error => {
        console.error('[SAVER] Error saving jobs:', error);
      });
  }
});

async function saveJobsToFile(jobs) {
  try {
    if (!jobs || !Array.isArray(jobs)) {
      throw new Error('Invalid jobs data format');
    }
    
    console.log('[SAVER] Generating file content');
    const content = formatJobData(jobs);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    console.log('[SAVER] Initiating download');
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'SAVE_JOBS_FILE',
        filename: generateFilename(),
        url: url
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    
  } catch (error) {
    console.error('[SAVER] File save failed:', error);
    if (url) URL.revokeObjectURL(url); // Cleanup if URL was created
    throw error;
  }
}

function formatJobData(jobs) {
  // Support multiple formats
  const format = 'text'; // Could be 'csv' or 'json'
  
  switch(format) {
    case 'csv':
      return jobs.map(job => 
        `"${job.title}","${job.company}","${job.location}","${job.url}","${job.easyApply}"`
      ).join('\n');
      
    case 'json':
      return JSON.stringify(jobs, null, 2);
      
    default: // text
      return jobs.map((job, index) => 
        `Job ${index + 1}:\n` +
        `Title:    ${job.title}\n` +
        `Company:  ${job.company}\n` +
        `Location: ${job.location}\n` +
        `URL:      ${job.url}\n` +
        `Easy Apply: ${job.easyApply ? '✅' : '❌'}\n`
      ).join('\n');
  }
}

function generateFilename() {
  const date = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
  const randomId = Math.random().toString(36).substring(2, 6);
  return `LinkedIn_Jobs_${date}_${randomId}.txt`;
}

// Initial check for existing jobs
chrome.storage.local.get('scrapedJobs', (result) => {
  if (result.scrapedJobs?.length) {
    console.log('[SAVER] Found existing jobs in storage');
    saveJobsToFile(result.scrapedJobs);
  }
});

