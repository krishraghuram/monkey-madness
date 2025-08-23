// ==UserScript==
// @name         Claude.ai Key Behavior Swapper
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Swaps Enter and Shift+Enter behaviors on claude.ai (Enter creates line break, Shift+Enter sends message)
// @author       Raghuram Krishnaswami
// @match        https://claude.ai/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Enable debug mode - set to true to see console logs
    const DEBUG = true;

    // Store the last synthetic event for comparison
    let lastSyntheticEvent = null;

    function debugLog(...args) {
        if (DEBUG) {
            console.log('[Claude Key Swapper]', ...args);
        }
    }

    debugLog('Script loaded');

    // Function to create a new synthetic keyboard event
    function createSyntheticEvent(originalEvent, withShift) {
        const options = {
            key: originalEvent.key,
            code: originalEvent.code,
            keyCode: originalEvent.keyCode,
            which: originalEvent.which,
            ctrlKey: originalEvent.ctrlKey,
            altKey: originalEvent.altKey,
            shiftKey: withShift,
            metaKey: originalEvent.metaKey,
            bubbles: true,
            cancelable: true,
            composed: true, // For shadow DOM
            view: originalEvent.view,
            detail: originalEvent.detail
        };

        // Create the new keyboard event
        const syntheticEvent = new KeyboardEvent('keydown', options);

        // Store reference to our synthetic event
        lastSyntheticEvent = syntheticEvent;

        debugLog('Created synthetic event with shiftKey:', withShift);
        return syntheticEvent;
    }

    // Function to check if an event is our synthetic event
    function isSyntheticEvent(event) {
        if (lastSyntheticEvent === event) {
            debugLog('Detected our synthetic event');
            return true;
        }
        return false;
    }

    // Function to check if an element is a valid target for our script
    function isValidTarget(element) {
        // Check for contenteditable divs
        if (element.getAttribute && element.getAttribute('contenteditable') === 'true') {
            return true;
        }

        // Check for textareas
        if (element.tagName === 'TEXTAREA') {
            return true;
        }

        return false;
    }

    // Function to intercept keydown events
    function interceptKeyDown(event) {
        // Skip if this is our own synthetic event
        if (isSyntheticEvent(event)) {
            debugLog('Skipping already processed event');
            return;
        }

        // Process events from valid targets (contenteditable divs or textareas)
        if (isValidTarget(event.target)) {
            debugLog('Intercepted keydown in valid target', event.target.tagName,
                'key:', event.key, 'shift:', event.shiftKey, 'ctrl:', event.ctrlKey);

            // Regular Enter should insert a line break
            if (event.key === 'Enter') {
                // Prevent default and stop propagation of the original event
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                // By default, enter sends the message, and shift-enter creates a line break
                // We want: enter to be a line break, and ctrl-enter to send message
                // Enter -> Shift+Enter
                // Ctrl+Enter -> Enter
                // For textareas, we may need to manually insert a newline rather than rely on synthetic events
                if (event.target.tagName === 'TEXTAREA' && !event.shiftKey && !event.ctrlKey) {
                    // For regular Enter in textareas, manually insert newline
                    const textarea = event.target;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const value = textarea.value;

                    debugLog('Manually inserting newline in textarea');

                    // Insert a newline at the cursor position
                    textarea.value = value.substring(0, start) + '\n' + value.substring(end);

                    // Place the cursor after the inserted newline
                    textarea.selectionStart = textarea.selectionEnd = start + 1;
                } else {
                    // For contenteditable or Shift+Enter/Ctrl+Enter cases, use synthetic event
                    const syntheticEvent = createSyntheticEvent(event, !(event.shiftKey || event.ctrlKey));

                    debugLog('Dispatching synthetic event');
                    event.target.dispatchEvent(syntheticEvent);
                }

                return false;
            }
        }
    }

    // Intercept keypress events as a backup
    function interceptKeyPress(event) {
        // Process events from valid targets (contenteditable divs or textareas)
        if (isValidTarget(event.target) && event.key === 'Enter' && !event.shiftKey) {
            debugLog('Intercepted Enter keypress event as backup');
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return false;
        }
    }

    // We don't need special handling for textareas as the interceptKeyDown function should work for both

    // Setup all event interceptors
    function setupEventInterceptors() {
        debugLog('Setting up event interceptors');

        // Use capturing phase to catch events before they reach the app
        document.addEventListener('keydown', interceptKeyDown, true);
        document.addEventListener('keypress', interceptKeyPress, true);
        // Also intercept events at the document level for maximized chances
        document.documentElement.addEventListener('keydown', interceptKeyDown, true);
        document.documentElement.addEventListener('keypress', interceptKeyPress, true);
    }

    // Function to run immediately and also after load
    function initialize() {
        setupEventInterceptors();

        // Re-apply event listeners when DOM changes (for SPA navigation)
        const observer = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    setupEventInterceptors();
                }
            }
        });

        // Start observing document for DOM changes
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Run immediately to ensure we catch all events
    initialize();

    // Also run after load to make sure
    window.addEventListener('load', initialize);

    // Log success message
    debugLog('Script initialization complete');
})();