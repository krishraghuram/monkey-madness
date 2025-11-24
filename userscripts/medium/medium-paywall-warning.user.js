// ==UserScript==
// @name         Medium.com Paywall Warning
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Warn when viewing a paywalled Medium article
// @author       You
// @match        https://*.medium.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Exit early if not on an article page
    const path = window.location.pathname;
    if (path === '/' || path === '' || path.startsWith('/@')) {
        console.log('[Medium Paywall Warning] Not an article page, script disabled');
        return;
    }

    let warningShown = false;

    function isArticlePage() {
        const path = window.location.pathname;
        // Article pages don't start with @ (author pages do)
        // Skip empty path, just domain, or author pages
        return path.length > 1 && !path.startsWith('/@');
    }

    function isMemberOnlyArticle() {
        const memberOnlyText = Array.from(document.querySelectorAll('p')).find(
            p => p.textContent.trim() === 'Member-only story'
        );
        return !!memberOnlyText;
    }

    function showPaywallWarning() {
        if (warningShown) return; // Prevent duplicate warnings

        const warning = document.createElement('div');
        warning.setAttribute('data-paywall-warning', 'true');
        warning.innerHTML = `
            <strong style="font-size: 20px; display: block; margin-bottom: 8px;">⚠️ This is a paywalled article</strong>
            <span>Check <a href="https://www.reddit.com/r/Piracy/comments/16b9jzn/how_can_i_read_medium_articles_for_free_as/" target="_blank" style="color: #4da6ff; text-decoration: underline;">this Reddit thread</a> for alternatives</span>
        `;
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #d32f2f;
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            text-align: center;
            max-width: 90%;
            animation: slideDown 0.3s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(warning);
        warningShown = true;
    }

    function checkForPaywall() {
        if (warningShown) return; // Already checked and shown

        if (isArticlePage() && isMemberOnlyArticle()) {
            console.log('[Medium Paywall Warning] Paywalled article detected');
            showPaywallWarning();
        }
    }

    // Check immediately
    if (document.readyState === 'loading') {
        document.addEven