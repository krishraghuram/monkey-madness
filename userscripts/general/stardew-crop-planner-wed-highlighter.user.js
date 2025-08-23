// ==UserScript==
// @name         Stardew Valley Wednesday Pierre's Closure Highlighter
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Highlights Wednesdays in red in the Crop Planner as a reminder that the Pierre's is closed on Wednesdays (so seeds can't be bought)
// @author       Raghuram Krishnaswami
// @match        https://exnil.github.io/crop_planner/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function to highlight Wednesdays (when Pierre's is closed)
    function highlightWednesdays() {
        // Find all elements with the class 'day ng-scope'
        const dayElements = document.querySelectorAll('.day.ng-scope');

        // Loop through each day element
        dayElements.forEach(element => {
            // Find span elements with class 'hidden-xs ng-binding' inside the current day element
            const spanElements = element.querySelectorAll('span.hidden-xs.ng-binding');

            // Check each span element
            spanElements.forEach(span => {
                // Get the text content (the number)
                const number = parseInt(span.textContent.trim(), 10);

                // Check if the number is one of: 3, 10, 17, 24 (all Wednesdays)
                if ([3, 10, 17, 24].includes(number)) {
                    // Set the background color to red to indicate shop closure
                    element.style.backgroundColor = '#bd4a4a';
                }
            });
        });
    }

    // Run the function initially
    highlightWednesdays();

    // Set up a MutationObserver to handle dynamic content changes
    const observer = new MutationObserver(function (mutations) { // eslint-disable-line no-unused-vars
        highlightWednesdays();
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();