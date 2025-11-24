// ==UserScript==
// @name         Medium.com Remove Member-Only Articles
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Medium.com Remove Member-Only Articles
// @author       You
// @match        https://medium.com/
// @match        https://*.medium.com/
// @match        https://medium.com/@*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const delays = [1000, 2000, 4000, 8000, 16000, 20000]; // Delays in milliseconds
    let delayIndex = 0;
    let currentDelay = delays[0];
    let timeoutId = null;

    function showToast() {
        const toast = document.createElement('div');
        toast.textContent = 'Removing paywalled articles for your benefit';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeInOut 3s ease-in-out;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Remove toast after animation completes
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function isSafeToRemove(element) {
        // Don't remove these critical elements
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'body' || tagName === 'html' || tagName === 'main') {
            return false;
        }

        // Don't remove elements that contain the navigation/header
        if (element.querySelector('nav') || element.querySelector('header')) {
            return false;
        }

        // Don't remove elements that are too large (likely page containers)
        const rect = element.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.95) {
            return false;
        }

        return true;
    }

    function removeMemberOnlyArticles() {
        const now = new Date().toISOString();

        // Find all article elements
        const articles = document.querySelectorAll('article[data-testid="post-preview"]');
        let removedCount = 0;

        articles.forEach(article => {
            // Check if this article contains a member-only button
            const memberOnlyButton = article.querySelector('button[aria-label="Member-only story"]');

            if (memberOnlyButton) {
                // Traverse up to find the highest parent before encountering another article
                let currentElement = article;
                let parentToRemove = article;

                while (currentElement.parentElement) {
                    const parent = currentElement.parentElement;

                    // Safety check: don't remove critical page elements
                    if (!isSafeToRemove(parent)) {
                        break;
                    }

                    // Check if parent contains other articles (siblings of our article)
                    const articlesInParent = parent.querySelectorAll('article[data-testid="post-preview"]');

                    // If parent contains more than just this one article, stop here
                    if (articlesInParent.length > 1) {
                        break;
                    }

                    // Otherwise, this parent can be removed
                    parentToRemove = parent;
                    currentElement = parent;
                }

                parentToRemove.remove();
                removedCount++;
            }
        });

        // Adjust delay based on results
        if (removedCount === 0) {
            // Move to next delay in sequence (cap at last value)
            delayIndex = Math.min(delayIndex + 1, delays.length - 1);
        } else {
            // Reset to first delay when we find articles
            delayIndex = 0;
        }

        currentDelay = delays[delayIndex];
        const nextRunSeconds = (currentDelay / 1000).toFixed(1);
        console.log(`[${now}] Removed ${removedCount} member-only articles. Next run in ${nextRunSeconds} seconds.`);

        // Schedule next run
        timeoutId = setTimeout(removeMemberOnlyArticles, currentDelay);
    }

    // Wait 2 seconds
    await new Promise(r => setTimeout(r, 5000));

    // Show toast notification
    showToast();

    // Start the process
    console.log('Member-only article remover started');
    removeMemberOnlyArticles();
})();