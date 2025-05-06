// job-scraper.js (updated)
console.log('[SCRAPER] job-scraper.js loaded');

const jobSelectors = {
  container: '.jobs-search-results-list',
  card: '.jobs-search-results__list-item',
  title: '.job-card-list__title',
  company: '.job-card-container__company-name',
  location: '.job-card-container__metadata-item',
  easyApply: '.jobs-apply-button'
};

async function waitForJobContainer() {
  return new Promise(resolve => {
    const checkContainer = setInterval(() => {
      const container = document.querySelector(jobSelectors.container);
      if (container) {
        clearInterval(checkContainer);
        resolve(container);
      }
    }, 500);
  });
}

async function extractJobListings() {
  const container = await waitForJobContainer();
  const observer = new MutationObserver(() => {
    if (container.scrollHeight > container.clientHeight) {
      container.scrollTop = container.scrollHeight;
    }
  });
  
  observer.observe(container, { childList: true, subtree: true });
  
  // Allow time for infinite scroll
  await new Promise(resolve => setTimeout(resolve, 3000));
  observer.disconnect();

  const jobCards = document.querySelectorAll(jobSelectors.card);
  console.log(`[SCRAPER] Found ${jobCards.length} job cards`);

  return Array.from(jobCards).map(card => ({
    title: card.querySelector(jobSelectors.title)?.textContent?.trim() || '',
    company: card.querySelector(jobSelectors.company)?.textContent?.trim() || '',
    location: card.querySelector(jobSelectors.location)?.textContent?.trim() || '',
    url: card.querySelector(jobSelectors.title)?.href || '',
    easyApply: !!card.querySelector(jobSelectors.easyApply)
  })).filter(job => job.title);
}

function sendJobsToBackground(jobs) {
  if (jobs.length > 0) {
    chrome.runtime.sendMessage({ type: 'JOB_DATA', data: jobs });
  }
}

(async () => {
  if (window.location.href.includes('/collections/easy-apply/')) {
    console.log('[SCRAPER] Starting job extraction');
    try {
      const jobs = await extractJobListings();
      sendJobsToBackground(jobs);
    } catch (error) {
      console.error('[SCRAPER] Extraction failed:', error);
    }
  }
})();