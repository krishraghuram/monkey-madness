// ==UserScript==
// @name         Amazon Subscribe & Save Analyzer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Show total delivery prices and export subscription data
// @author       You
// @match        https://www.amazon.com/auto-deliveries*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function to parse price string to number
    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        // Remove $ and any non-numeric characters except decimal point
        const cleaned = priceStr.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
    }

    // Function to calculate and display totals
    function addDeliveryTotals() {
        const deliveryRows = document.querySelectorAll('.delivery-card-row');

        deliveryRows.forEach((row) => {
            // Skip if already processed
            if (row.querySelector('.delivery-total-price')) return;

            // Get delivery date
            const dateHeader = row.querySelector(
                'div.delivery-information-container h2.delivery-header-message'
            );
            if (!dateHeader) return;

            // Get all subscription items
            const subscriptionContainer = row.querySelector(
                'div.subscription-information-container div.subscription-list-container'
            );
            if (!subscriptionContainer) return;

            const items = subscriptionContainer.querySelectorAll(
                'div.subscription-card:not(:has(.store-front-ingress-container))'
            );

            // Calculate total
            let total = 0;
            items.forEach((item) => {
                const priceElement = item.querySelector(
                    'div.subscription-price-container span.subscription-price'
                );
                if (priceElement) {
                    total += parsePrice(priceElement.innerHTML);
                }
            });

            // Create and insert total element
            const totalElement = document.createElement('h4');
            totalElement.className = 'delivery-total-price a-spacing-small';
            totalElement.style.color = '#0F1111';
            totalElement.style.fontWeight = '700';
            totalElement.innerHTML = `Total: $${total.toFixed(2)}`;

            // Insert after the date header
            dateHeader.parentNode.insertBefore(totalElement, dateHeader.nextSibling);
        });
    }

    // Function to collect all delivery data
    function collectDeliveryData() {
        const deliveryRows = document.querySelectorAll('.delivery-card-row');
        const allData = [];

        deliveryRows.forEach((row) => {
            const dateHeader = row.querySelector(
                'div.delivery-information-container h2.delivery-header-message'
            );
            if (!dateHeader) return;

            const deliveryDate = dateHeader.innerHTML.trim();

            const subscriptionContainer = row.querySelector(
                'div.subscription-information-container div.subscription-list-container'
            );
            if (!subscriptionContainer) return;

            const items = subscriptionContainer.querySelectorAll(
                'div.subscription-card:not(:has(.store-front-ingress-container))'
            );
            const itemsData = [];

            items.forEach((item) => {
                // Get price
                const priceElement = item.querySelector(
                    'div.subscription-price-container span.subscription-price'
                );
                const price = priceElement ? priceElement.innerHTML.trim() : '';

                // Get name
                const nameElement = item.querySelector(
                    'div.subscription-product-title-container span.subscription-product-title span.a-truncate-full'
                );
                const name = nameElement ? nameElement.innerHTML.trim() : '';

                // Get JSON blob
                const modalSpan = item.querySelector(
                    'div.subscription-image-container span[data-action="a-modal"][data-a-modal]'
                );
                let jsonBlob = null;
                if (modalSpan) {
                    try {
                        jsonBlob = JSON.parse(modalSpan.getAttribute('data-a-modal'));
                    } catch (e) {
                        console.error('Error parsing JSON blob:', e);
                    }
                }

                itemsData.push({
                    name: name,
                    price: price,
                    priceNumeric: parsePrice(price),
                    jsonBlob: jsonBlob,
                });
            });

            const totalPrice = itemsData.reduce((sum, item) => sum + item.priceNumeric, 0);

            allData.push({
                deliveryDate: deliveryDate,
                totalPrice: totalPrice.toFixed(2),
                items: itemsData,
            });
        });

        return allData;
    }

    // Function to export data as JSON
    function exportData() {
        const data = collectDeliveryData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `amazon-deliveries-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Create export button
    function createExportButton() {
        // Check if button already exists
        if (document.getElementById('export-delivery-data-btn')) return;

        const button = document.createElement('button');
        button.id = 'export-delivery-data-btn';
        button.innerHTML = 'Export Delivery Data';
        button.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 9999;
            padding: 10px 20px;
            background-color: #FF9900;
            color: #0F1111;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#FFA724';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#FF9900';
        });

        button.addEventListener('click', exportData);

        document.body.appendChild(button);
    }

    // Initialize script
    function init() {
        addDeliveryTotals();
        createExportButton();
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also observe for dynamic content changes
    const observer = new MutationObserver(() => {
        addDeliveryTotals();
        createExportButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
