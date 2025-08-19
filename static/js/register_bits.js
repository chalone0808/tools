// Register Bits JavaScript functionality

class RegisterBitFields {
    constructor() {
        this.isSelecting = false;
        this.selectedBits = new Set();
        this.startBitIndex = null;
        this.bitsData = null;
        this.bitWidth = null;
        this.bitElements = null;
        this.selectionDisplay = null;

        this.initializeForm();
    }

    initializeForm() {
        // Form submission handler
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Format change handler - auto parse when changed
        document.getElementById('numberFormat').addEventListener('change', () => {
            this.updatePlaceholderText();
            this.autoParseIfValueExists();
        });

        // Bit width change handler - auto parse when changed
        document.getElementById('bitWidth').addEventListener('change', () => {
            this.autoParseIfValueExists();
        });
    }

    autoParseIfValueExists() {
        const valueInput = document.getElementById('registerValue');
        if (valueInput.value.trim()) {
            // Trigger form submission programmatically
            const event = new Event('submit', { bubbles: true, cancelable: true });
            document.getElementById('registerForm').dispatchEvent(event);
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();

        const formData = {
            value: document.getElementById('registerValue').value,
            compare_value: document.getElementById('compareValue').value,
            format: document.getElementById('numberFormat').value,
            bit_width: document.getElementById('bitWidth').value
        };

        fetch('/parse-register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                this.displayResults(data);
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('message').innerHTML = `
                <div class="error-message">
                    <strong>Network Error:</strong> Could not connect to server.
                </div>
            `;
                document.getElementById('results').style.display = 'block';
            });
    }

    displayResults(data) {
        const resultsDiv = document.getElementById('results');
        const messageDiv = document.getElementById('message');
        const formatDiv = document.getElementById('formatDisplay');
        const bitDiv = document.getElementById('bitDisplay');

        if (data.success) {
            messageDiv.innerHTML = `
                <div class="success-message">
                    <strong>Parsing successful!</strong> Parsed value: ${data.parsed_value}
                </div>
            `;

            formatDiv.innerHTML = `
                <div class="format-display">
                    <h5>Format Representations:</h5>
                    <div class="row">
                        <div class="col-md-4">
                            <strong>Hexadecimal:</strong><br>
                            <code>${data.formats.hex}</code>
                        </div>
                        <div class="col-md-4">
                            <strong>Decimal:</strong><br>
                            <code>${data.formats.dec}</code>
                        </div>
                        <div class="col-md-4">
                            <strong>Octal:</strong><br>
                            <code>${data.formats.oct}</code>
                        </div>
                    </div>
                </div>
            `;

            // Create bit display
            const bitHtml = this.createBitDisplay(data);
            bitDiv.innerHTML = bitHtml;

            // Initialize bit selection functionality
            this.initializeBitSelection(data);
        } else {
            messageDiv.innerHTML = `
                <div class="error-message">
                    <strong>Error:</strong> ${data.error}
                </div>
            `;
            formatDiv.innerHTML = '';
            bitDiv.innerHTML = '';
        }

        resultsDiv.style.display = 'block';
    }

    createBitDisplay(data) {
        let bitHtml = '';

        // Check if we have valid comparison data
        if (data.comparison && data.comparison.binary && !data.comparison.error) {
            // Dual display mode with comparison
            bitHtml += '<h5>Binary Representation Comparison:</h5>';
            bitHtml += '<p class="text-muted">Click and drag to select bits for analysis. <span class="bit-different">■</span> Different bits highlighted</p>';

            // Create vertically stacked displays
            // Value 1 display
            bitHtml += '<div class="comparison-register">';
            bitHtml += '<div class="comparison-header">Register Value 1</div>';
            bitHtml += `<div class="value-info">${data.formats.hex} (${data.parsed_value})</div>`;
            bitHtml += this.createSingleBitDisplay(data, data.comparison, 1);
            bitHtml += `<div class="binary-string"><strong>Binary 1:</strong> <code>${data.binary}</code></div>`;
            bitHtml += '</div>';

            // Value 2 display
            bitHtml += '<div class="comparison-register">';
            bitHtml += '<div class="comparison-header">Register Value 2</div>';
            bitHtml += `<div class="value-info">${data.comparison.formats.hex} (${data.comparison.parsed_value})</div>`;
            bitHtml += this.createSingleBitDisplay(data.comparison, data, 2);
            bitHtml += `<div class="binary-string"><strong>Binary 2:</strong> <code>${data.comparison.binary}</code></div>`;
            bitHtml += '</div>';
        } else {
            // Single display mode
            bitHtml += '<h5>Binary Representation:</h5>';
            bitHtml += '<p class="text-muted">Click and drag to select bits for analysis</p>';
            bitHtml += this.createSingleBitDisplay(data, null, 1);

            // Add binary string
            bitHtml += `<div class="mt-3"><strong>Binary:</strong> <code>${data.binary}</code></div>`;
        }

        // Add selection display area
        bitHtml += '<div id="selectionDisplay" style="display: none;"></div>';

        return `<div class="bit-display">${bitHtml}</div>`;
    }

    createSingleBitDisplay(primaryData, compareData, displayIndex) {
        let bitHtml = '<div class="single-bit-display">';

        if (!primaryData || !primaryData.bits || primaryData.bit_width === undefined) {
            return '<div class="single-bit-display"><div class="error">Error: Missing bit data</div></div>';
        }

        const bitsPerRow = 16;
        const bits = [...primaryData.bits].reverse(); // Create copy and reverse to show MSB first
        const numRows = Math.ceil(primaryData.bit_width / bitsPerRow);

        for (let row = 0; row < numRows; row++) {
            const startBit = primaryData.bit_width - 1 - (row * bitsPerRow);
            const endBit = Math.max(startBit - bitsPerRow + 1, 0);

            // Add bit numbers header for this row
            bitHtml += '<div class="bit-row">';
            for (let i = startBit; i >= endBit; i--) {
                if (i < startBit && (i + 1) % 8 === 0) {
                    bitHtml += '<div class="group-separator"></div>';
                }
                bitHtml += `<div class="bit-number">${i}</div>`;
            }
            bitHtml += '</div>';

            // Add bit values for this row
            bitHtml += '<div class="bit-row">';
            for (let i = startBit; i >= endBit; i--) {
                if (i < startBit && (i + 1) % 8 === 0) {
                    bitHtml += '<div class="group-separator"></div>';
                }
                const bitIndex = primaryData.bit_width - 1 - i;
                const bit = bits[bitIndex];
                let className = bit.set ? 'bit-set' : 'bit-unset';

                // Add comparison styling if comparison data exists
                if (compareData && compareData.bits) {
                    const compareBit = compareData.bits.find(b => b.position === bit.position);
                    if (compareBit && compareBit.value !== bit.value) {
                        className += ' bit-different';
                    }
                }

                // Use unique data attributes for each display
                const dataAttributes = `data-position="${bit.position}" data-bit-index="${bitIndex}" data-display="${displayIndex}"`;
                bitHtml += `<div class="bit-value ${className}" ${dataAttributes}>${bit.value}</div>`;
            }
            bitHtml += '</div>';

            // Add some spacing between rows
            if (row < numRows - 1) {
                bitHtml += '<div style="margin-bottom: 10px;"></div>';
            }
        }

        bitHtml += '</div>';
        return bitHtml;
    }

    updatePlaceholderText() {
        const format = document.getElementById('numberFormat').value;
        const input = document.getElementById('registerValue');

        switch (format) {
            case 'hex':
                input.placeholder = 'Enter hex value (e.g., 0x12345678, ABCDEF)';
                break;
            case 'dec':
                input.placeholder = 'Enter decimal value (e.g., 305419896)';
                break;
            case 'oct':
                input.placeholder = 'Enter octal value (e.g., 0o1234567, 1234567)';
                break;
        }
    }

    initializeBitSelection(fullData) {
        // Store both data sources for selection calculations
        this.data1 = fullData; // Register Value 1 data
        this.data2 = fullData.comparison || null; // Register Value 2 data (if exists)
        this.bitElements = document.querySelectorAll('.bit-value');
        this.selectionDisplay = document.getElementById('selectionDisplay');
        this.isSelecting = false;
        this.startBitIndex = null;
        this.currentDisplay = null;

        // Add event listeners to bit elements
        this.bitElements.forEach((bitElement, index) => {
            bitElement.addEventListener('mousedown', (e) => {
                this.handleBitMouseDown(e, index);
            });

            bitElement.addEventListener('mouseenter', (e) => {
                this.handleBitMouseEnter(e, index);
            });

            bitElement.addEventListener('click', (e) => {
                e.preventDefault();
            });
        });

        // Global mouse events
        document.addEventListener('mouseup', () => {
            this.isSelecting = false;
            this.startBitIndex = null;
            this.currentDisplay = null;
        });

        // Click outside to clear selection
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.bit-display')) {
                this.clearSelection();
                this.updateSelectionDisplay();
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSelection();
                this.updateSelectionDisplay();
            }
        });
    }

    handleBitMouseDown(e, index) {
        e.preventDefault();
        this.isSelecting = true;
        this.startBitIndex = index;
        this.currentDisplay = e.target.getAttribute('data-display');

        this.clearSelection();

        const bitElement = this.bitElements[index];
        const position = parseInt(bitElement.dataset.position);
        this.selectedBits.add(position);
        bitElement.classList.add('bit-selected');

        this.updateSelectionDisplay();
    }

    handleBitMouseEnter(e, index) {
        if (this.isSelecting && this.startBitIndex !== null) {
            // Check if we're in the same display
            const targetDisplay = e.target.getAttribute('data-display');
            if (targetDisplay !== this.currentDisplay) {
                return; // Don't select across different displays
            }

            this.clearSelection();
            this.selectBitRange(this.startBitIndex, index);
            this.updateSelectionDisplay();
        }
    }

    updateSelectionDisplay() {
        if (this.selectedBits.size === 0) {
            this.selectionDisplay.style.display = 'none';
            return;
        }

        // Determine which data source to use based on current display
        let bitsData;
        let displayName;

        if (this.currentDisplay === '2' && this.data2) {
            bitsData = this.data2.bits;
            displayName = 'Register Value 2';
        } else {
            bitsData = this.data1.bits;
            displayName = 'Register Value 1';
        }

        // Convert selected bits to value - treat as new number starting from bit 0
        const sortedPositions = Array.from(this.selectedBits).sort((a, b) => b - a); // MSB first
        let selectedValue = 0;
        let binaryStr = '';

        // Build binary string from MSB to LSB using the correct data source
        for (const position of sortedPositions) {
            const bitValue = bitsData.find(b => b.position === position).value;
            binaryStr += bitValue;
        }

        // Calculate value treating the binary string as a new number
        for (let i = 0; i < binaryStr.length; i++) {
            if (binaryStr[i] === '1') {
                selectedValue += Math.pow(2, binaryStr.length - 1 - i);
            }
        }

        // Calculate hex, decimal, octal
        const hexValue = selectedValue > 0 ? `0x${selectedValue.toString(16).toUpperCase()}` : '0x0';
        const decValue = selectedValue.toString();
        const octValue = selectedValue > 0 ? `0o${selectedValue.toString(8)}` : '0o0';

        const minBit = Math.min(...this.selectedBits);
        const maxBit = Math.max(...this.selectedBits);
        const rangeText = minBit === maxBit ? `Bit ${minBit}` : `Bits ${maxBit} - ${minBit}`;

        this.selectionDisplay.innerHTML = `
            <div class="selection-display">
                <div class="selection-info">
                    <strong>${displayName} - Selected ${rangeText}</strong> (${this.selectedBits.size} bit${this.selectedBits.size > 1 ? 's' : ''})
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <strong>Binary:</strong><br>
                        <code>${binaryStr}</code>
                    </div>
                    <div class="col-md-3">
                        <strong>Hexadecimal:</strong><br>
                        <code>${hexValue}</code>
                    </div>
                    <div class="col-md-3">
                        <strong>Decimal:</strong><br>
                        <code>${decValue}</code>
                    </div>
                    <div class="col-md-3">
                        <strong>Octal:</strong><br>
                        <code>${octValue}</code>
                    </div>
                </div>
            </div>
        `;
        this.selectionDisplay.style.display = 'block';
    }

    selectBitRange(startIndex, endIndex) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);

        this.selectedBits.clear();

        for (let i = start; i <= end; i++) {
            const bitElement = this.bitElements[i];
            if (bitElement && bitElement.getAttribute('data-display') === this.currentDisplay) {
                const position = parseInt(bitElement.dataset.position);
                this.selectedBits.add(position);
                bitElement.classList.add('bit-selected');
            }
        }
    }

    clearSelection() {
        this.selectedBits.clear();
        if (this.bitElements) {
            this.bitElements.forEach(el => el.classList.remove('bit-selected'));
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RegisterBitFields();
});
