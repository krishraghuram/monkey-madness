// ==UserScript==
// @name         Claude Chat Navigator
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Navigate between user messages in Claude chat
// @author       Raghuram Krishnaswami
// @match        https://claude.ai/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Add CSS for navigation buttons
    GM_addStyle(`
        .chat-nav-buttons {
            position: fixed;
            top: 80px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 10000;
        }
        .chat-nav-btn {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #ccc;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s;
        }
        .chat-nav-btn:hover {
            background: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .chat-nav-btn:active {
            transform: scale(0.95);
        }
        .chat-nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        .chat-nav-indicator {
            width: 40px;
            height: 24px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #666;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
    `);

    let currentIndex = -1;
    let userMessages = [];
    let isScrollingProgrammatically = false;
    let isInitialized = false;
    let mutationObserver = null;
    let chatContainer = null;

    // Function to check if we're on a chat page
    function isOnChatPage() {
        return window.location.pathname.startsWith('/chat/');
    }

    // Function to count user messages within an element
    function countUserMessages(element) {
        return element.querySelectorAll('[data-testid="user-message"]').length;
    }

    // Function to find all user message containers
    function findUserMessages() {
        // Find all elements that contain data-testid="user-message"
        const userMessageElements = document.querySelectorAll('[data-testid="user-message"]');

        // Get their ancestor containers
        const messages = Array.from(userMessageElements)
            .map((el) => {
                let container = el;
                let lastValid = container;

                // Keep going up as long as parent doesn't contain more than one user message
                while (container && container.parentElement) {
                    const parent = container.parentElement;
                    const messageCount = countUserMessages(parent);

                    if (messageCount > 1) {
                        // Parent has multiple messages, stop here
                        break;
                    }

                    lastValid = container;
                    container = parent;
                }

                return lastValid;
            })
            .filter(Boolean);

        // Remove duplicates
        return [...new Set(messages)];
    }

    function findDescendantWithDifferentBackground(element) {
        // Get the background color of the starting element
        const elementBgColor = window.getComputedStyle(element).backgroundColor;

        // Find the descendant with data-testid="user-message"
        const userMessage = element.querySelector('[data-testid="user-message"]');
        if (!userMessage) {
            return null;
        }

        // Traverse from element down to userMessage
        let current = userMessage;
        const pathToUserMessage = [];

        // Build path from userMessage up to element
        while (current && current !== element) {
            pathToUserMessage.unshift(current);
            current = current.parentElement;
        }

        // Now check each element in the path for different background
        for (let node of pathToUserMessage) {
            const nodeBgColor = window.getComputedStyle(node).backgroundColor;

            // Skip transparent backgrounds
            if (
                !nodeBgColor ||
                nodeBgColor === 'rgba(0, 0, 0, 0)' ||
                nodeBgColor === 'transparent'
            ) {
                continue;
            }

            // Check if different from element's background
            if (nodeBgColor !== elementBgColor) {
                return node;
            }
        }

        return null;
    }

    // Function to find which message is currently in view
    function findVisibleMessageIndex() {
        if (userMessages.length === 0) return -1;

        const viewportMiddle = window.innerHeight / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        userMessages.forEach((msg, index) => {
            const rect = msg.getBoundingClientRect();
            const msgMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(msgMiddle - viewportMiddle);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        return closestIndex;
    }

    // Function to update current index based on scroll position
    function updateCurrentIndexFromScroll() {
        if (isScrollingProgrammatically) return;

        const visibleIndex = findVisibleMessageIndex();
        if (visibleIndex !== -1 && visibleIndex !== currentIndex) {
            currentIndex = visibleIndex;
            updateButtons();
        }
    }

    // Function to scroll to a message
    function scrollToMessage(index) {
        if (userMessages.length === 0) return;

        // Handle wrapping
        if (index < 0) {
            index = ((index % userMessages.length) + userMessages.length) % userMessages.length;
        } else if (index >= userMessages.length) {
            index = index % userMessages.length;
        }

        // Update index and UI immediately
        currentIndex = index;
        updateButtons();

        // Then perform the scroll
        const userMessage = userMessages[index];
        const element = findDescendantWithDifferentBackground(userMessage);

        isScrollingProgrammatically = true;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Reset flag after scroll animation completes
        setTimeout(() => {
            isScrollingProgrammatically = false;
        }, 1000);

        // Highlight briefly
        element.style.transition = 'background-color 0.7s';
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = 'rgba(207, 128, 99, 0.2)';
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
        }, 1000);
    }

    // Function to update button states
    function updateButtons() {
        const prevBtn = document.getElementById('chat-nav-prev');
        const nextBtn = document.getElementById('chat-nav-next');
        const indicator = document.getElementById('chat-nav-indicator');

        // Buttons are never disabled now since we loop
        if (prevBtn) prevBtn.disabled = userMessages.length === 0;
        if (nextBtn) nextBtn.disabled = userMessages.length === 0;
        if (indicator) {
            indicator.textContent =
                userMessages.length > 0 ? `${currentIndex + 1}/${userMessages.length}` : '0/0';
        }
    }

    // Function to create navigation UI
    function createNavButtons() {
        // Remove existing buttons if any
        const existing = document.getElementById('chat-nav-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'chat-nav-container';
        container.className = 'chat-nav-buttons';

        container.innerHTML = `
            <button id="chat-nav-prev" class="chat-nav-btn" title="Previous message (Alt+↑)">↑</button>
            <div id="chat-nav-indicator" class="chat-nav-indicator">0/0</div>
            <button id="chat-nav-next" class="chat-nav-btn" title="Next message (Alt+↓)">↓</button>
        `;

        document.body.appendChild(container);

        document.getElementById('chat-nav-prev').addEventListener('click', () => {
            scrollToMessage(currentIndex - 1);
        });

        document.getElementById('chat-nav-next').addEventListener('click', () => {
            scrollToMessage(currentIndex + 1);
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Alt + Up/Down arrows
        if (e.altKey && e.key === 'ArrowUp') {
            e.preventDefault();
            scrollToMessage(currentIndex - 1);
        } else if (e.altKey && e.key === 'ArrowDown') {
            e.preventDefault();
            scrollToMessage(currentIndex + 1);
        }
    });

    // Initialize
    function init() {
        const newMessages = findUserMessages();
        const messagesChanged = newMessages.length !== userMessages.length;

        userMessages = newMessages;

        if (!document.getElementById('chat-nav-container')) {
            createNavButtons();
        }

        // If messages were added and we were at the end, move to new last message
        if (messagesChanged && currentIndex === userMessages.length - 2) {
            currentIndex = userMessages.length - 1;
        }

        // Set initial position to first message if not set
        if (userMessages.length > 0 && currentIndex === -1) {
            currentIndex = findVisibleMessageIndex();
            if (currentIndex === -1) currentIndex = 0;
        }

        updateButtons();
    }

    // Throttle for mutations - execute immediately, then ignore for T milliseconds
    let mutationThrottleTimer = null;
    let mutationPending = false;

    const throttledMutationHandler = () => {
        if (mutationThrottleTimer === null) {
            // Execute immediately
            init();
            mutationThrottleTimer = setTimeout(() => {
                mutationThrottleTimer = null;
                // If there was a pending event, execute it now
                if (mutationPending) {
                    mutationPending = false;
                    init();
                }
            }, 200); // 200ms throttle period
        } else {
            // Mark that we have a pending event
            mutationPending = true;
        }
    };

    // Throttle for scroll events - execute immediately, then ignore for T milliseconds
    let scrollThrottleTimer = null;
    let scrollPending = false;

    const handleScroll = () => {
        if (scrollThrottleTimer === null) {
            // Execute immediately
            updateCurrentIndexFromScroll();
            scrollThrottleTimer = setTimeout(() => {
                scrollThrottleTimer = null;
                // If there was a pending event, execute it now
                if (scrollPending) {
                    scrollPending = false;
                    updateCurrentIndexFromScroll();
                }
            }, 100); // 100ms throttle period
        } else {
            // Mark that we have a pending event
            scrollPending = true;
        }
    };

    // Function to cleanup observers and UI
    function cleanup() {
        if (mutationObserver) {
            mutationObserver.disconnect();
            mutationObserver = null;
        }
        if (chatContainer) {
            chatContainer.removeEventListener('scroll', handleScroll);
            chatContainer = null;
        }
        const existing = document.getElementById('chat-nav-container');
        if (existing) existing.remove();

        isInitialized = false;
        currentIndex = -1;
        userMessages = [];
    }

    // Function to start the script
    function startScript() {
        if (isInitialized) return;

        chatContainer = document.querySelector('.overflow-y-scroll');
        if (!chatContainer) {
            // Chat container not ready yet, try again soon
            setTimeout(startScript, 500);
            return;
        }

        isInitialized = true;

        init();

        mutationObserver = new MutationObserver(throttledMutationHandler);
        mutationObserver.observe(chatContainer, {
            childList: true,
            subtree: true,
        });

        // Listen for scroll events
        chatContainer.addEventListener('scroll', handleScroll);
    }

    // Watch for URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;

            // Check if we've navigated to or away from a chat page
            if (isOnChatPage()) {
                // Navigated to a chat page
                if (!isInitialized) {
                    setTimeout(startScript, 1000);
                }
            } else {
                // Navigated away from a chat page
                if (isInitialized) {
                    cleanup();
                }
            }
        }
    }).observe(document, { subtree: true, childList: true });

    // Also add disconnect on page unload to prevent memory leaks
    window.addEventListener('beforeunload', cleanup);

    // Start immediately if already on a chat page
    if (isOnChatPage()) {
        setTimeout(startScript, 1000);
    }
})();
