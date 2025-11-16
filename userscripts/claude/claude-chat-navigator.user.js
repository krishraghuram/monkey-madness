// ==UserScript==
// @name         Claude Chat Navigator
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Navigate between user messages in Claude chat
// @author       Raghuram Krishnaswami
// @match        https://claude.ai/chat/*
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

    // Function to check if element has background-color defined in style
    function hasBackgroundColorStyle(element) {
        const computedStyle = window.getComputedStyle(element);
        // Check if background-color is explicitly set (not just inherited)
        return (
            computedStyle.backgroundColor &&
            computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
            computedStyle.backgroundColor !== 'transparent'
        );
    }

    // Function to find all user message containers
    function findUserMessages() {
        // Find all elements that contain data-testid="user-message"
        const userMessageElements = document.querySelectorAll('[data-testid="user-message"]');

        // Get their ancestor containers
        userMessages = Array.from(userMessageElements)
            .map((el) => {
                let container = el;

                // Walk up the DOM to find the container
                while (container && container.parentElement) {
                    // Look for the container that has avatar, message, and background-color
                    const hasAvatar = container.querySelector(
                        '.rounded-full[class*="bg-text-200"]'
                    );
                    const hasMessage = container.querySelector('[data-testid="user-message"]');
                    const hasBgColor = hasBackgroundColorStyle(container);

                    if (hasAvatar && hasMessage && hasBgColor) {
                        return container;
                    }
                    container = container.parentElement;
                }
                return null;
            })
            .filter(Boolean);

        // Remove duplicates
        userMessages = [...new Set(userMessages)];

        return userMessages;
    }

    // Function to scroll to a message
    function scrollToMessage(index) {
        if (index < 0 || index >= userMessages.length) return;

        currentIndex = index;
        const element = userMessages[index];

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight briefly
        element.style.transition = 'background-color 0.7s';
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = 'rgba(207, 128, 99, 0.2)';
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
        }, 1000);

        updateButtons();
    }

    // Function to update button states
    function updateButtons() {
        const prevBtn = document.getElementById('chat-nav-prev');
        const nextBtn = document.getElementById('chat-nav-next');
        const indicator = document.getElementById('chat-nav-indicator');

        if (prevBtn) prevBtn.disabled = currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= userMessages.length - 1;
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
            <button id="chat-nav-prev" class="chat-nav-btn" title="Previous message (↑)">↑</button>
            <div id="chat-nav-indicator" class="chat-nav-indicator">0/0</div>
            <button id="chat-nav-next" class="chat-nav-btn" title="Next message (↓)">↓</button>
        `;

        document.body.appendChild(container);

        document.getElementById('chat-nav-prev').addEventListener('click', () => {
            if (currentIndex > 0) {
                scrollToMessage(currentIndex - 1);
            }
        });

        document.getElementById('chat-nav-next').addEventListener('click', () => {
            if (currentIndex < userMessages.length - 1) {
                scrollToMessage(currentIndex + 1);
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Alt + Up/Down arrows
        if (e.altKey && e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIndex > 0) scrollToMessage(currentIndex - 1);
        } else if (e.altKey && e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIndex < userMessages.length - 1) scrollToMessage(currentIndex + 1);
        }
    });

    // Initialize
    function init() {
        findUserMessages();
        createNavButtons();
        updateButtons();

        // Set initial position to first message
        if (userMessages.length > 0 && currentIndex === -1) {
            currentIndex = 0;
            updateButtons();
        }
    }

    // Watch for new messages being added
    const observer = new MutationObserver(() => {
        const oldCount = userMessages.length;
        findUserMessages();
        if (userMessages.length !== oldCount) {
            updateButtons();
        }
    });

    // Start observing after page loads
    setTimeout(() => {
        init();

        const chatContainer = document.querySelector('.overflow-y-scroll');
        if (chatContainer) {
            observer.observe(chatContainer, {
                childList: true,
                subtree: true,
            });
        }
    }, 1000);
})();
