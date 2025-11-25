// ==UserScript==
// @name         Medium.com Remove Member-Only Articles
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Medium.com Remove Member-Only Articles with Settings Panel
// @author       You
// @match        https://medium.com/
// @match        https://*.medium.com/
// @match        https://medium.com/@*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async function() {
    'use strict';

    const delays = [1000, 2000, 4000, 8000, 16000, 20000];
    let delayIndex = 0;
    let currentDelay = delays[0];
    let timeoutId = null;
    let removedThisSession = 0;
    let isEnabled = GM_getValue('mediumRemover_enabled', true); // Default to enabled
    let totalRemovedAllTime = GM_getValue('mediumRemover_totalRemoved', 0);

    function updateTotalRemoved(count) {
        totalRemovedAllTime += count;
        GM_setValue('mediumRemover_totalRemoved', totalRemovedAllTime);
    }

    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.textContent = message;
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
            animation: fadeInOut ${duration}ms ease-in-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
        `;
        if (!document.querySelector('style[data-toast-style]')) {
            style.setAttribute('data-toast-style', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    }

    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'medium-remover-settings';
        panel.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            min-width: 250px;
        `;

        panel.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: bold; font-size: 16px; color: #333;">
                Medium Paywalled Article Remover
            </div>
            
            <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #666;">Continuous Removal:</span>
                <label style="display: inline-flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="remover-toggle" ${isEnabled ? 'checked' : ''} 
                           style="width: 18px; height: 18px; cursor: pointer;">
                </label>
            </div>

            <button id="run-once-btn" style="
                width: 100%;
                padding: 8px;
                margin-bottom: 12px;
                background: #1a8917;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            ">Run Once</button>

            <div style="border-top: 1px solid #eee; padding-top: 12px; margin-top: 12px;">
                <div style="margin-bottom: 8px; color: #666;">
                    This session: <strong id="session-count" style="color: #1a8917;">0</strong>
                </div>
                <div style="margin-bottom: 8px; color: #666;">
                    All time: <strong id="alltime-count" style="color: #1a8917;">${totalRemovedAllTime}</strong>
                </div>
                <button id="reset-stats-btn" style="
                    width: 100%;
                    padding: 6px;
                    background: #f0f0f0;
                    color: #666;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Reset All-Time Stats</button>
            </div>

            <div id="removal-feedback" style="
                margin-top: 12px;
                padding: 8px;
                background: #e8f5e9;
                color: #1a8917;
                border-radius: 4px;
                text-align: center;
                font-weight: 500;
                display: none;
            "></div>
        `;

        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('remover-toggle').addEventListener('change', (e) => {
            isEnabled = e.target.checked;
            GM_setValue('mediumRemover_enabled', isEnabled);
            
            if (isEnabled) {
                showToast('Continuous removal enabled');
                startRemovalLoop();
            } else {
                showToast('Continuous removal disabled');
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            }
        });

        document.getElementById('run-once-btn').addEventListener('click', () => {
            showToast('Running one-time removal...');
            removeMemberOnlyArticles(true);
        });

        document.getElementById('reset-stats-btn').addEventListener('click', () => {
            if (confirm('Reset all-time statistics?')) {
                totalRemovedAllTime = 0;
                GM_setValue('mediumRemover_totalRemoved', 0);
                document.getElementById('alltime-count').textContent = '0';
                showToast('Statistics reset');
            }
        });
    }

    function updateStats(removed) {
        removedThisSession += removed;
        document.getElementById('session-count').textContent = removedThisSession;
        document.getElementById('alltime-count').textContent = totalRemovedAllTime;
        
        if (removed > 0) {
            const feedback = document.getElementById('removal-feedback');
            feedback.textContent = `Removed ${removed}`;
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 2000);
        }
    }

    function isSafeToRemove(element) {
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'body' || tagName === 'html' || tagName === 'main') {
            return false;
        }
        
        if (element.querySelector('nav') || element.querySelector('header')) {
            return false;
        }
        
        const rect = element.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.95) {
            return false;
        }
        
        return true;
    }

    function removeMemberOnlyArticles(isOneTime = false) {
        const now = new Date().toISOString();
        const articles = document.querySelectorAll('article[data-testid="post-preview"]');
        
        const memberOnlyArticles = [];
        articles.forEach(article => {
            const memberOnlyButton = article.querySelector('button[aria-label="Member-only story"]');
            if (memberOnlyButton) {
                memberOnlyArticles.push(article);
            }
        });

        const articlesToRemove = memberOnlyArticles.length === articles.length 
            ? memberOnlyArticles.slice(0, -1)
            : memberOnlyArticles;

        let removedCount = 0;

        articlesToRemove.forEach(article => {
            let currentElement = article;
            let parentToRemove = article;

            while (currentElement.parentElement) {
                const parent = currentElement.parentElement;

                if (!isSafeToRemove(parent)) {
                    break;
                }

                const articlesInParent = parent.querySelectorAll('article[data-testid="post-preview"]');

                if (articlesInParent.length > 1) {
                    break;
                }

                parentToRemove = parent;
                currentElement = parent;
            }

            parentToRemove.remove();
            removedCount++;
        });

        if (removedCount > 0) {
            updateTotalRemoved(removedCount);
            updateStats(removedCount);
        }

        // Only continue loop if not one-time and enabled
        if (!isOneTime && isEnabled) {
            if (removedCount === 0) {
                delayIndex = Math.min(delayIndex + 1, delays.length - 1);
            } else {
                delayIndex = 0;
            }

            currentDelay = delays[delayIndex];
            const nextRunSeconds = (currentDelay / 1000).toFixed(1);
            console.log(`[${now}] Removed ${removedCount} member-only articles. Next run in ${nextRunSeconds} seconds.`);

            timeoutId = setTimeout(() => removeMemberOnlyArticles(false), currentDelay);
        } else if (isOneTime) {
            console.log(`[${now}] One-time removal: Removed ${removedCount} member-only articles.`);
        }
    }

    function startRemovalLoop() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        delayIndex = 0;
        currentDelay = delays[0];
        removeMemberOnlyArticles(false);
    }

    // Create settings panel
    createSettingsPanel();

    // Start removal if enabled
    if (isEnabled) {
        console.log('Member-only article remover started (enabled)');
        startRemovalLoop();
    } else {
        console.log('Member-only article remover started (disabled - use settings panel to enable)');
    }
})();