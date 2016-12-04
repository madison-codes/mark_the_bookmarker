'use strict';

require('devtron').install();

const { shell, remote } = require('electron');
const { systemPreferences } = remote;

const newLinkUrl = document.querySelector('.new-link-form--url');
const newLinkSubmit = document.querySelector('.new-link-form--submit');
const newLinkForm = document.querySelector('.new-link-form');
const errorMessage = document.querySelector('.message');
const linkTemplate = document.querySelector('#link-template');
const linksSection = document.querySelector('.links');
const clearStorageButton = document.querySelector('.controls--clear-storage')

const parser = new DOMParser();
const parseResponse = (text) => parser.parseFromString(text, 'text/html');
const findTitle = (nodes) => nodes.querySelector('title').innerText;

// Enable submit if valid URL
newLinkUrl.addEventListener('keyup', () => {
  newLinkSubmit.disabled = !newLinkUrl.validity.valid;
});

// get all items from local storage
window.addEventListener('load', () => {
  for (let title of Object.keys(localStorage)) {
    addToPage({ title, url: localStorage.getItem(title) });
  }
});

// Swap style sheets if computer is in dark mode
window.addEventListener('load', () => {
  for (let title of Object.keys(localStorage)) {
    addToPage({ title, url: localStorage.getItem(title) });
  }
  if (systemPreferences.isDarkMode()) {
    document.querySelector('link').href = 'styles-dark.css';
  }
});

// open selected link
linksSection.addEventListener('click', (event) => {
  if (event.target.href) {
    event.preventDefault();
    shell.openExternal(event.target.href);
  }
});

// clear everything from local storage
clearStorageButton.addEventListener('click', () => {
  localStorage.clear();
  linksSection.innerHTML = '';
});

// Fetch accurate URL
newLinkForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const url = newLinkUrl.value;

  fetch(url)
    .then(response => response.text())
    .then(parseResponse)
    .then(findTitle)
    .then(title => ({ title, url }))
    .then(addToPage)
    .then(storeLink)
    .then(clearInput)
    .catch(error => {
      console.error(error);
      errorMessage.textContent = `There was an error fetching "${url}."`;
    });
});

// open links in external browser
linksSection.addEventListener('click', (event) => {
  if (event.target.href) {
    event.preventDefault();
    shell.openExternal(event.target.href);
  }
});

// Store link in local storage
const storeLink = ({ title, url }) => {
  localStorage.setItem(title, url);
  return { title, url };
};

// Clear input field after save
const clearForm () => {
  newLinkUrl.value = null;
};

// Add new link to the page
const addToPage = ({ title, url }) => {
  const newLink = linkTemplate.content.cloneNode(true);
  const titleElement = newLink.querySelector('.link--title');
  const urlElement =  newLink.querySelector('.link--url')

  titleElement.textContent = title;
  urlElement.href = url;
  urlElement.textContent = url;

  linksSection.appendChild(newLink);
  return { title, url };
};

// if link is 400 or 500 level, don't save
const validateResponse = (response) => {
  if (response.ok) { return response; }
  throw new Error(`Received a status code of ${response.status}`);
}
