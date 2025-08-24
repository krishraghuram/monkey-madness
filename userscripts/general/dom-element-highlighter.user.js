// ==UserScript==
// @name         Element Highlighter
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Highlight hovered elements with a keyboard shortcut
// @author       Raghuram Krishnaswami
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Configuration
    const KEY_COMBO = {
        ctrl: true,
        alt: false,
        shift: true,
        meta: false,
        key: 'H',
    };

    const HIGHLIGHT_COLOR = 'yellow';
    const TEXT_COLOR = 'black';

    // Store highlighted elements and their remove functions
    const highlightedElements = new Map();

    // Track the current element under the mouse
    let hoveredElement = null;

    // Function to highlight an element
    function highlightElement(element, color = HIGHLIGHT_COLOR) {
        if (!element || highlightedElements.has(element)) {
            return;
        }

        // Save original styles
        const originalStyles = {
            backgroundColor: element.style.backgroundColor,
            color: element.style.color,
            transition: element.style.transition,
        };

        // Apply highlight with a smooth transition
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = color;
        element.style.color = TEXT_COLOR;

        // Store the element and its remove function
        highlightedElements.set(element, function removeHighlight() {
            element.style.backgroundColor = originalStyles.backgroundColor;
            element.style.color = originalStyles.color;
            element.style.transition = originalStyles.transition;
            highlightedElements.delete(element);
        });

        // Add a subtle outline to make it more visible
        element.style.outline = `2px solid ${adjustColor(color, -20)}`;

        console.log('Element highlighted:', element);

        // Create a small notification
        showNotification('Element highlighted!');
    }

    // Function to remove highlight from an element
    function removeHighlight(element) {
        const removeFunc = highlightedElements.get(element);
        if (removeFunc) {
            removeFunc();
            element.style.outline = '';
            console.log('Highlight removed from:', element);
            showNotification('Highlight removed!');
        }
    }

    // Function to toggle highlight on an element
    function toggleHighlight(element) {
        if (!element) return;

        if (highlightedElements.has(element)) {
            removeHighlight(element);
        } else {
            highlightElement(element);
        }
    }

    // Helper function to darken or lighten a color
    function adjustColor(color, amount) {
        // For simple named colors, use a map
        const colorMap = {
            yellow: '#FFFF00',
            red: '#FF0000',
            blue: '#0000FF',
            green: '#00FF00',
            purple: '#800080',
            orange: '#FFA500',
            black: '#000000',
            white: '#FFFFFF',
        };

        let hex = colorMap[color.toLowerCase()] || color;

        // Check if the color is in hex format
        if (hex.startsWith('#')) {
            return shadeHexColor(hex, amount);
        }

        // Default to a darker yellow if we can't process
        return '#CCCC00';
    }

    // Function to shade a hex color
    function shadeHexColor(color, percent) {
        const f = parseInt(color.slice(1), 16);
        const t = percent < 0 ? 0 : 255;
        const p = percent < 0 ? percent * -1 : percent;
        const R = f >> 16;
        const G = (f >> 8) & 0x00ff;
        const B = f & 0x0000ff;
        return (
            '#' +
            (
                0x1000000 +
                (Math.round((t - R) * p) + R) * 0x10000 +
                (Math.round((t - G) * p) + G) * 0x100 +
                (Math.round((t - B) * p) + B)
            )
                .toString(16)
                .slice(1)
        );
    }

    // Function to show a notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';

        document.body.appendChild(notification);

        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        // Fade out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // Track the currently hovered element
    document.addEventListener('mouseover', function (e) {
        hoveredElement = e.target;
    });

    // Listen for the keyboard shortcut
    document.addEventListener('keydown', function (e) {
        // Check if the key combo matches our configuration
        if (
            KEY_COMBO.ctrl === e.ctrlKey &&
            KEY_COMBO.alt === e.altKey &&
            KEY_COMBO.shift === e.shiftKey &&
            KEY_COMBO.meta === e.metaKey &&
            e.key.toLowerCase() === KEY_COMBO.key.toLowerCase()
        ) {
            // Prevent default browser behavior
            e.preventDefault();

            // Toggle highlight on the current element
            toggleHighlight(hoveredElement);
        }

        // Add keyboard shortcut to clear all highlights (F2)
        if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && e.key === 'F2') {
            e.preventDefault();
            clearAllHighlights();
        }
    });

    // Function to clear all highlights
    function clearAllHighlights() {
        for (const [element, removeFunc] of highlightedElements.entries()) {
            removeFunc();
            element.style.outline = '';
        }
        highlightedElements.clear();
        showNotification('All highlights cleared!');
    }

    // Add an info message to the console
    console.log('Element Highlighter script loaded.');
    console.log(`Use ${KEY_COMBO.key} to highlight elements.`);
    console.log('Use F2 to clear all highlights.');
})();
