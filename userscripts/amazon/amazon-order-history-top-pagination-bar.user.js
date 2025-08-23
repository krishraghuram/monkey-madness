// ==UserScript==
// @name         Amazon Order History Double Pagination
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Adds a pagination bar at the top of Amazon order history
// @author       Raghuram Krishnaswami
// @match        https://*.amazon.com/your-orders/*
// @match        https://*.amazon.com/gp/css/order-history*
// @match        https://*.amazon.com/gp/your-account/order-history*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function addTopPagination() {
        // Check if top pagination already exists
        if (document.querySelector('.js-top-pagination')) return;

        // Find the bottom pagination bar
        const bottomPagination = document.querySelector('.a-pagination')?.closest('.a-text-center');
        if (!bottomPagination) return;

        // Find the first order card to insert pagination before it
        const firstOrderCard = document.querySelector('.order-card.js-order-card');
        if (!firstOrderCard) return;

        // Clone the pagination and add a class to identify it
        const topPagination = bottomPagination.cloneNode(true);
        topPagination.classList.add('js-top-pagination');

        // Insert before the first order card
        firstOrderCard.parentNode.insertBefore(topPagination, firstOrderCard);
    }

    // Run on page load
    addTopPagination();

    // Optional: Watch for dynamic content changes
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                addTopPagination();
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();