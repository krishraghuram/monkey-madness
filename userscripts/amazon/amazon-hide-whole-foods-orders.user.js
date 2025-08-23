// ==UserScript==
// @name         Hide Whole Foods Orders on Amazon
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Hide all Whole Foods orders from Amazon order history
// @author       Raghuram Krishnaswami
// @match        https://www.amazon.com/gp/css/order-history*
// @match        https://www.amazon.com/gp/your-account/order-history*
// @match        https://www.amazon.com/your-orders/orders*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function to hide Whole Foods orders
    function hideWholeFood() {
        // Find all elements that might contain "Purchased at Whole Foods Market" text
        const wholeFoodsTexts = document.querySelectorAll('.delivery-box__primary-text, .a-size-medium');

        // Loop through each potential element
        wholeFoodsTexts.forEach(element => {
            if (element.textContent.includes('Purchased at Whole Foods Market')) {
                // Find the parent order card - might be several levels up
                let orderCard = element;
                while (orderCard && !orderCard.classList.contains('order-card') && !orderCard.classList.contains('js-order-card')) {
                    orderCard = orderCard.parentElement;
                }

                // If we found the order card, hide it
                if (orderCard) {
                    orderCard.style.display = 'none';
                }
            }
        });
    }

    // Initial run
    hideWholeFood();

    // Set up a mutation observer to run when new content loads (for infinite scrolling or ajax)
    const observer = new MutationObserver(function (mutations) { // eslint-disable-line no-unused-vars
        hideWholeFood();
    });

    // Start observing the document body for DOM changes
    observer.observe(document.body, { childList: true, subtree: true });
})();