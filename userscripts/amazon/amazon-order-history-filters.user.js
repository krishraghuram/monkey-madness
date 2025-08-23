// ==UserScript==
// @name         Filter Amazon and Whole Foods Orders
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Filter Amazon orders with tabs to show/hide Whole Foods and Amazon orders
// @author       Raghuram Krishnaswami
// @match        https://www.amazon.com/gp/css/order-history*
// @match        https://www.amazon.com/gp/your-account/order-history*
// @match        https://www.amazon.com/your-orders/orders*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let currentFilter = 'all'; // 'all', 'amazon', 'wholefoods'
    let orderCards = [];

    // CSS styles for the filter tabs
    const styles = `
        <style id="order-filter-styles">
            .order-filter-container {
                position: sticky;
                top: 0;
                z-index: 1000;
                background: white;
                border-bottom: 1px solid #ddd;
                padding: 10px 0;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .order-filter-tabs {
                display: flex;
                justify-content: center;
                gap: 2px;
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            .order-filter-tab {
                padding: 12px 24px;
                border: 1px solid #ddd;
                background: #f8f8f8;
                cursor: pointer;
                border-radius: 4px 4px 0 0;
                font-weight: 500;
                color: #333;
                transition: all 0.2s ease;
                position: relative;
            }
            .order-filter-tab:hover {
                background: #e8e8e8;
            }
            .order-filter-tab.active {
                background: #ff9900;
                color: white;
                border-color: #ff9900;
                border-bottom-color: white;
            }
            .order-filter-tab .count {
                background: rgba(255,255,255,0.3);
                border-radius: 12px;
                padding: 2px 8px;
                margin-left: 8px;
                font-size: 0.9em;
            }
            .order-filter-tab.active .count {
                background: rgba(255,255,255,0.3);
                color: white;
            }
            .order-card.filtered-out {
                display: none !important;
            }
        </style>
    `;

    // Function to create the filter UI
    function createFilterUI() {
        // Remove existing filter UI if it exists
        const existing = document.getElementById('order-filter-container');
        if (existing) {
            existing.remove();
        }

        // Add styles to head
        if (!document.getElementById('order-filter-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }

        // Find a good place to insert the filter (usually after the page header)
        const insertPoint = document.querySelector('#ordersContainer, .a-section.a-spacing-none.a-spacing-top-medium, .your-orders-content-container') || document.body;

        const filterHTML = `
            <div id="order-filter-container" class="order-filter-container">
                <div class="order-filter-tabs">
                    <div class="order-filter-tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                        All Orders <span class="count" id="all-count">0</span>
                    </div>
                    <div class="order-filter-tab ${currentFilter === 'amazon' ? 'active' : ''}" data-filter="amazon">
                        Amazon Orders <span class="count" id="amazon-count">0</span>
                    </div>
                    <div class="order-filter-tab ${currentFilter === 'wholefoods' ? 'active' : ''}" data-filter="wholefoods">
                        Whole Foods Orders <span class="count" id="wholefoods-count">0</span>
                    </div>
                </div>
            </div>
        `;

        insertPoint.insertAdjacentHTML('afterbegin', filterHTML);

        // Add click event listeners to tabs
        document.querySelectorAll('.order-filter-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');
                setFilter(filter);
            });
        });
    }

    // Function to identify and categorize orders
    function categorizeOrders() {
        orderCards = [];

        // Find all order cards using multiple selectors
        const orderSelectors = [
            '.order-card',
            '.js-order-card',
            '.a-box-group.a-spacing-base.order',
            '[data-order-id]',
            '.order-info'
        ];

        let foundOrders = [];
        orderSelectors.forEach(selector => {
            const orders = document.querySelectorAll(selector);
            orders.forEach(order => {
                if (!foundOrders.includes(order)) {
                    foundOrders.push(order);
                }
            });
        });

        // If no orders found with specific selectors, try a broader approach
        if (foundOrders.length === 0) {
            const possibleOrders = document.querySelectorAll('.a-section');
            possibleOrders.forEach(section => {
                const orderInfo = section.querySelector('.delivery-box__primary-text, .a-size-medium, [data-order-id]');
                if (orderInfo) {
                    foundOrders.push(section);
                }
            });
        }

        foundOrders.forEach(order => {
            const isWholeFood = checkIfWholeFoods(order);
            orderCards.push({
                element: order,
                type: isWholeFood ? 'wholefoods' : 'amazon'
            });
        });

        console.log(`Found ${orderCards.length} orders: ${orderCards.filter(o => o.type === 'amazon').length} Amazon, ${orderCards.filter(o => o.type === 'wholefoods').length} Whole Foods`);
    }

    // Function to check if an order is from Whole Foods
    function checkIfWholeFoods(orderElement) {
        const textContent = orderElement.textContent || '';

        // Check for various Whole Foods indicators
        const wholeFoodsIndicators = [
            'Purchased at Whole Foods Market',
            'Whole Foods Market',
            'WFM',
            'whole foods'
        ];

        return wholeFoodsIndicators.some(indicator =>
            textContent.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    // Function to apply the current filter
    function applyFilter() {
        let amazonCount = 0;
        let wholeFoodsCount = 0;

        orderCards.forEach(order => {
            const shouldShow = currentFilter === 'all' ||
                (currentFilter === 'amazon' && order.type === 'amazon') ||
                (currentFilter === 'wholefoods' && order.type === 'wholefoods');

            if (shouldShow) {
                order.element.classList.remove('filtered-out');
                order.element.style.display = '';
            } else {
                order.element.classList.add('filtered-out');
            }

            // Count orders
            if (order.type === 'amazon') amazonCount++;
            else wholeFoodsCount++;
        });

        // Update counts in UI
        updateCounts(orderCards.length, amazonCount, wholeFoodsCount);
    }

    // Function to update the counts in the tabs
    function updateCounts(total, amazon, wholefoods) {
        const allCount = document.getElementById('all-count');
        const amazonCount = document.getElementById('amazon-count');
        const wholefoodsCount = document.getElementById('wholefoods-count');

        if (allCount) allCount.textContent = total;
        if (amazonCount) amazonCount.textContent = amazon;
        if (wholefoodsCount) wholefoodsCount.textContent = wholefoods;
    }

    // Function to set the active filter
    function setFilter(filter) {
        currentFilter = filter;

        // Update active tab
        document.querySelectorAll('.order-filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Apply the filter
        applyFilter();
    }

    // Main function to initialize the filter system
    function initializeFilter() {
        createFilterUI();
        categorizeOrders();
        applyFilter();
    }

    // Function to handle dynamic content loading
    function handleDynamicContent() {
        // Re-categorize orders (new ones might have loaded)
        const oldCount = orderCards.length;
        categorizeOrders();

        // Only apply filter if new orders were found
        if (orderCards.length !== oldCount) {
            applyFilter();
        }
    }

    // Initial setup
    function setup() {
        // Wait a bit for the page to fully load
        setTimeout(() => {
            initializeFilter();
        }, 1000);
    }

    // Set up mutation observer for dynamic content
    const observer = new MutationObserver(function (mutations) {
        let shouldUpdate = false;

        mutations.forEach(mutation => {
            // Check if new order-related content was added
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const hasOrderContent = node.querySelector && (
                        node.querySelector('.order-card, .js-order-card, [data-order-id]') ||
                        node.classList.contains('order-card') ||
                        node.classList.contains('js-order-card')
                    );
                    if (hasOrderContent) {
                        shouldUpdate = true;
                    }
                }
            });
        });

        if (shouldUpdate) {
            setTimeout(handleDynamicContent, 500);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }

    // Also try to initialize after a short delay to catch late-loading content
    setTimeout(setup, 2000);
})();