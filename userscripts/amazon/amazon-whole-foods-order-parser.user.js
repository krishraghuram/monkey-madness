// ==UserScript==
// @name         Whole Foods Order Parser
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Parse Whole Foods order data into JSON
// @author       Raghuram Krishnaswami
// @match        https://www.amazon.com/fopo/order-details*
// @match        https://www.amazon.com/gp/your-account/order-details*
// @match        https://www.amazon.com/gp/css/order-details*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function parseWholefoodsOrder() {
        const orderContainer = document.querySelector('#f3_food_ItemList');

        if (!orderContainer) {
            console.log('Whole Foods order container not found');
            return null;
        }

        const items = [];

        // Get all item rows (both visible and in expanded sections)
        const itemRows = orderContainer.querySelectorAll('.a-row.a-spacing-base');

        itemRows.forEach((row) => {
            // Extract item name - check for both link and span formats
            const productLink = row.querySelector('a[href*="/dp/"]');
            const productSpan = row.querySelector('.a-column.a-span10 .a-size-small');

            let itemName = '';
            if (productLink) {
                itemName = productLink.textContent.trim();
            } else if (
                productSpan &&
                !productSpan.textContent.includes('Qty:') &&
                !productSpan.textContent.includes('@') &&
                !productSpan.textContent.includes('$')
            ) {
                itemName = productSpan.textContent.trim();
            }

            // Skip if we couldn't find a product name
            if (!itemName) return;

            // Extract total price from the right column first (this is always correct)
            const totalPriceElement = row.querySelector('.a-text-right .a-size-small');
            let totalPrice = 0;
            if (totalPriceElement) {
                const totalPriceText = totalPriceElement.textContent.trim();
                const totalPriceMatch = totalPriceText.match(/\$([0-9,]+\.?\d*)/);
                if (totalPriceMatch) {
                    totalPrice = parseFloat(totalPriceMatch[1].replace(',', ''));
                }
            }

            // Extract quantity and unit price
            const allTextElements = row.querySelectorAll('.a-size-small');
            let quantity = 1;
            let unitPrice = 0;
            let unit = 'each';

            // Find quantity
            for (let element of allTextElements) {
                const text = element.textContent.trim();
                const qtyMatch = text.match(/Qty:\s*([\d.]+)(?:\s*(lb|each))?/);
                if (qtyMatch) {
                    quantity = parseFloat(qtyMatch[1]);
                    if (qtyMatch[2]) {
                        unit = qtyMatch[2];
                    }
                    break;
                }
            }

            // Find unit price
            for (let element of allTextElements) {
                const text = element.textContent.trim();
                // Look for unit price patterns: "$X.XX each" or "$X.XX/lb"
                const unitPriceMatch = text.match(/\$([0-9,]+\.?\d*)(?:\/lb|\/each|\s+each)/);
                if (unitPriceMatch) {
                    unitPrice = parseFloat(unitPriceMatch[1].replace(',', ''));
                    break;
                }
            }

            // If we couldn't find unit price, calculate it from total
            if (unitPrice === 0 && totalPrice > 0 && quantity > 0) {
                unitPrice = totalPrice / quantity;
            }

            if (itemName && quantity > 0) {
                items.push({
                    name: itemName,
                    quantity: quantity,
                    unit: unit,
                    unitPrice: parseFloat(unitPrice.toFixed(2)),
                    totalPrice: parseFloat(totalPrice.toFixed(2)),
                });
            }
        });

        return items;
    }

    function addParseButton() {
        // Create a button to trigger parsing
        const button = document.createElement('button');
        button.textContent = 'Parse Order to JSON';
        button.style.cssText =
            'position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 10px 15px; background: #ff9900; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';

        button.addEventListener('click', function () {
            const orderData = parseWholefoodsOrder();

            if (orderData && orderData.length > 0) {
                const jsonOutput = JSON.stringify(orderData, null, 2);

                // Log to console
                console.log('Whole Foods Order Data:', jsonOutput);

                // Copy to clipboard
                navigator.clipboard
                    .writeText(jsonOutput)
                    .then(() => {
                        // Show success message
                        const message = document.createElement('div');
                        message.textContent =
                            'Parsed ' + orderData.length + ' items! JSON copied to clipboard.';
                        message.style.cssText =
                            'position: fixed; top: 70px; right: 20px; z-index: 10001; padding: 10px; background: #4CAF50; color: white; border-radius: 4px; max-width: 300px;';
                        document.body.appendChild(message);

                        setTimeout(() => {
                            document.body.removeChild(message);
                        }, 3000);
                    })
                    .catch((err) => {
                        console.error('Could not copy to clipboard:', err);
                        // Fallback: show JSON in an alert
                        alert('JSON Data:\n\n' + jsonOutput);
                    });
            } else {
                alert('No Whole Foods order data found on this page.');
            }
        });

        document.body.appendChild(button);
    }

    // Wait for page to load, then add the parse button
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addParseButton);
    } else {
        addParseButton();
    }

    // Also make the function available globally for manual use
    window.parseWholeFoodsOrder = parseWholefoodsOrder;
})();
