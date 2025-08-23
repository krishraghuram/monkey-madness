# monkey-madness

Mixed Bag of Grease/Tamper/Violent Monkey Scripts for the Web

## Overview

A curated collection of userscripts to enhance your web browsing experience. These scripts work with userscript managers like Tampermonkey, Greasemonkey, or Violentmonkey.

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

2. Click on any userscript link below and your userscript manager will prompt you to install it.

## Available Scripts

### Amazon Scripts

#### 🛒 [Amazon Order History Filters](userscripts/amazon/amazon-order-history-filters.user.js)
Filter your Amazon order history with tabbed interface to show/hide Whole Foods and Amazon orders.

**Features:**
- Tabbed UI (All Orders / Amazon Orders / Whole Foods Orders)
- Order count display
- Sticky navigation bar
- Works with dynamic content loading

**Usage:** Visit any Amazon order history page and use the filter tabs at the top.

---

#### 📦 [Amazon Hide Whole Foods Orders](userscripts/amazon/amazon-hide-whole-foods-orders.user.js)
Simple script to hide all Whole Foods orders from Amazon order history.

**Note:** This script is redundant if you're using the Order History Filters above.

---

#### 📄 [Amazon Pagination Auto-Continue](userscripts/amazon/amazon-pagination-auto-continue.user.js)
Automatically loads the next page of Amazon search results or order history.

**Features:**
- Seamless infinite scrolling
- Works on search results and order history
- Automatic detection when you reach the bottom

---

#### 🧾 [Amazon Whole Foods Order Parser](userscripts/amazon/amazon-whole-foods-order-parser.user.js)
Parse and copy Whole Foods order details from Amazon order history.

**Features:**
- Extracts item details from Whole Foods orders
- Copies formatted data to clipboard
- Easy integration with expense tracking

### General Purpose Scripts

#### ⌨️ [Claude Ctrl+Enter to Send](userscripts/general/claude-ctrl-enter-to-send.user.js)
Changes Claude.ai behavior to send messages with Ctrl+Enter instead of just Enter.

**Features:**
- Ctrl+Enter sends message
- Enter creates new line
- Works across all Claude.ai pages

---

#### 🎯 [DOM Element Highlighter](userscripts/general/dom-element-highlighter.user.js)
Visual tool to highlight DOM elements on any webpage for development and debugging.

**Features:**
- Toggle highlighting with keyboard shortcut
- Color-coded element borders
- Hover effects for easy identification
- Developer-friendly tooltips

---

#### 🎮 [Stardew Valley Junimo Kart Helper](userscripts/general/stardew-valley-junimo-kart-helper.user.js)
Assistance tool for the Junimo Kart minigame in Stardew Valley.

**Features:**
- Visual guidance for tricky sections
- Timing helpers
- Score tracking

## Development

### Prerequisites
```bash
npm install
```

### Available Scripts
```bash
npm run lint          # Run ESLint
npm run validate      # Validate userscript headers
npm run check         # Run both lint and validate
```

### Code Quality
- All scripts must pass ESLint validation
- Headers must follow the standardized format
- Pre-commit hooks ensure code quality

### Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Ensure all scripts pass `npm run check`
5. Submit a pull request

### Userscript Standards

All userscripts must include these headers:
```javascript
// ==UserScript==
// @name         Your Script Name
// @namespace    https://github.com/krishraghuram
// @version      0.0.1
// @description  Brief description of what the script does
// @author       Raghuram Krishnaswami
// @match        https://example.com/*
// @grant        none
// ==/UserScript==
```

## Browser Compatibility

These scripts are tested on:
- Chrome + Tampermonkey
- Firefox + Violentmonkey
- Edge + Tampermonkey

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

If you encounter issues or have suggestions:
- Open an [issue](https://github.com/krishraghuram/monkey-madness/issues)
- Check existing issues for solutions
- Contributions welcome!