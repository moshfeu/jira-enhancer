console.log('👋 hello from jira copy link');

/**
 *
 * @param {string} href link href
 * @param {string} text link text
 */
function copyToClipboard(href, text) {
  const link = document.createElement('a');
  link.href = href;
  link.innerText = text;
  link.style.position = 'absolute';
  link.style.left = '-9999px';
  document.body.appendChild(link);

  const range = document.createRange();
  range.selectNode(link);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  document.execCommand('copy');
  document.body.removeChild(link);
}

async function createLink() {
  const titleElem = await waitForElement('#summary-val');
  if (!titleElem) {
    console.error('Could not find title element');
    return;
  }

  const title = titleElem.innerText.trim();
  const url = window.location.href;
  const link = document.createElement('a');
  link.href = url;
  link.innerText = '📋';
  link.setAttribute('data-title', title);
  link.style.marginLeft = '10px';

  link.addEventListener('click', (event) => {
    event.preventDefault();
    const href = event.target.href;
    const text = event.target.getAttribute('data-title');
    copyToClipboard(href, text);
    showToast('Copied to clipboard');
  });

  const issueLink = document.querySelector('a#key-val,#issuekey-val a');
  if (!issueLink) {
    console.error('Could not find issue link');
    return;
  }

  issueLink.after(link);
}

/**
 *
 * @param {string} message Toast message
 */
function showToast(message) {
  // Create the toast element
  const toast = document.createElement('div');
  toast.id = 'jira-toast';
  toast.innerText = message;

  // Set the CSS styles for the toast
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #333;
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
    font-weight: bold;
    z-index: 9999;
  `;

  // Append the toast to the body
  document.body.appendChild(toast);

  // Remove the toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function waitForElement(selector, timeout = 3000) {
  let start = Date.now();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(`could not find element with selector ${selector}`);
      }
    }, 100);
  });
}

window.addEventListener('load', async () => {
  if (document.getElementById('key-val')) {
    createLink();
    return;
  }
  // Find the element that holds the ticket view
  const ticketViewElement = await waitForElement('#ghx-detail-view');

  // Observe the ticket view element for changes
  const observer = new MutationObserver((mutationsList) => {
    if ([...mutationsList[0].addedNodes].some((node) => node.id === 'ghx-detail-issue')) {
      createLink();
    }
  });
  // Observe the ticket view element for changes
  observer.observe(ticketViewElement, {
    childList: true,
    subtree: true,
  });
});
