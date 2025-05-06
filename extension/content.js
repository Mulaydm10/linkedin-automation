// content.js (updated)
let hasRedirected = false;
let isInitialized = false;

const selectors = {
  profileImage: 'img.global-nav__me-photo.evil-icon',
  signInButton: 'a[data-tracking-control-name="guest_homepage-basic_nav-header-signin"]',
  usernameInput: '#username',
  passwordInput: '#password',
  submitButton: '.btn__primary--large.from__button--floating'
};

function checkLoginStatus() {
  return {
    isLoggedIn: !!document.querySelector(selectors.profileImage),
    isLoggedOut: !!document.querySelector(selectors.signInButton)
  };
}

async function autoLoginAndRedirect() {
  if (!window.location.href.includes('/login')) return;

  const elementsExist = () => {
    return document.querySelector(selectors.usernameInput) &&
           document.querySelector(selectors.passwordInput) &&
           document.querySelector(selectors.submitButton);
  };

  await new Promise(resolve => {
    const checkInterval = setInterval(() => {
      if (elementsExist()) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);
  });

  chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (response) => {
    if (!response) return;

    const username = document.querySelector(selectors.usernameInput);
    const password = document.querySelector(selectors.passwordInput);
    const submitButton = document.querySelector(selectors.submitButton);

    if (username && password && submitButton) {
      username.value = response.username;
      password.value = response.password;
      submitButton.click();
      startLoginObserver();
    }
  });
}

function startLoginObserver() {
  const observer = new MutationObserver(() => {
    if (document.querySelector(selectors.profileImage) && !hasRedirected) {
      observer.disconnect();
      hasRedirected = true;
      window.location.replace('https://www.linkedin.com/jobs/collections/easy-apply/');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function handlePage() {
  if (isInitialized) return;
  isInitialized = true;

  const { isLoggedIn } = checkLoginStatus();
  const isEasyApplyPage = window.location.href.includes('/collections/easy-apply/');

  if (isLoggedIn && !isEasyApplyPage && !hasRedirected) {
    hasRedirected = true;
    window.location.replace('https://www.linkedin.com/jobs/collections/easy-apply/');
  } else if (window.location.href.includes('/login')) {
    autoLoginAndRedirect();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(handlePage, 1000);
});