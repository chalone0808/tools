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

        // Add mode toggle button
        bitHtml += '<div class="mode-controls mb-3">';
        bitHtml += '<div class="btn-group" role="group" aria-label="Interaction Mode">';
        bitHtml += '<input type="radio" class="btn-check" name="interactionMode" id="selectionMode" value="selection" checked>';
        bitHtml += '<label class="btn btn-outline-primary" for="selectionMode">Selection Mode</label>';
        bitHtml += '<input type="radio" class="btn-check" name="interactionMode" id="editMode" value="edit">';
        bitHtml += '<label class="btn btn-outline-success" for="editMode">Edit Mode</label>';
        bitHtml += '</div>';
        bitHtml += '<small class="text-muted ms-3">Selection: Click and drag to select bits | Edit: Click bits to toggle values</small>';
        bitHtml += '</div>';

        // Check if we have valid comparison data
        if (data.comparison && data.comparison.binary && !data.comparison.error) {
            // Dual display mode with comparison
            bitHtml += '<h5>Binary Representation Comparison:</h5>';
            bitHtml += '<p class="text-muted"><span class="bit-different">■</span> Different bits highlighted</p>';

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
            bitHtml += '<p class="text-muted">Use mode buttons above to switch between selection and editing</p>';
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
        this.currentMode = 'selection'; // Default to selection mode

        // Add event listeners for mode toggle buttons
        this.initializeModeToggle();

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
                this.handleBitClick(e, index);
            });
        });

        // Global mouse events
        document.addEventListener('mouseup', () => {
            // Clear the click timeout if mouse is released quickly (indicates click, not drag)
            if (this.clickTimeout) {
                clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
            }
            
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

        // Initialize cursor styles
        this.updateBitCursors();
    }

    initializeModeToggle() {
        const selectionModeBtn = document.getElementById('selectionMode');
        const editModeBtn = document.getElementById('editMode');
        
        if (selectionModeBtn) {
            selectionModeBtn.addEventListener('change', () => {
                if (selectionModeBtn.checked) {
                    this.currentMode = 'selection';
                    this.clearSelection();
                    this.updateSelectionDisplay();
                    this.updateBitCursors();
                }
            });
        }
        
        if (editModeBtn) {
            editModeBtn.addEventListener('change', () => {
                if (editModeBtn.checked) {
                    this.currentMode = 'edit';
                    this.clearSelection();
                    this.updateSelectionDisplay();
                    this.updateBitCursors();
                }
            });
        }
    }

    updateBitCursors() {
        // Update cursor style based on current mode
        this.bitElements.forEach(bitElement => {
            if (this.currentMode === 'edit') {
                bitElement.style.cursor = 'pointer';
                bitElement.title = 'Click to toggle bit value';
            } else {
                bitElement.style.cursor = 'default';
                bitElement.title = 'Click and drag to select bits';
            }
        });
    }

    handleBitClick(e, index) {
        if (this.currentMode === 'edit') {
            // Edit mode: toggle bit value immediately
            this.toggleBitValue(e.target);
        } else {
            // Selection mode: handled by mousedown/mouseup events
            // Only toggle if we didn't start a selection (quick click)
            if (!this.isSelecting && this.clickTimeout) {
                clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
            }
        }
    }

    handleBitMouseDown(e, index) {
        e.preventDefault();
        
        // Only handle selection in selection mode
        if (this.currentMode === 'selection') {
            // Use a small delay to distinguish between click and drag
            this.clickTimeout = setTimeout(() => {
                this.isSelecting = true;
                this.startBitIndex = index;
                this.currentDisplay = e.target.getAttribute('data-display');

                this.clearSelection();

                const bitElement = this.bitElements[index];
                const position = parseInt(bitElement.dataset.position);
                this.selectedBits.add(position);
                bitElement.classList.add('bit-selected');

                this.updateSelectionDisplay();
            }, 150); // 150ms delay
        }
    }

    handleBitMouseEnter(e, index) {
        // Only handle selection in selection mode
        if (this.currentMode === 'selection' && this.isSelecting && this.startBitIndex !== null) {
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

    toggleBitValue(bitElement) {
        const displayIndex = bitElement.getAttribute('data-display');
        const position = parseInt(bitElement.getAttribute('data-position'));
        
        // Determine which data source to modify
        let targetData;
        if (displayIndex === '2' && this.data2) {
            targetData = this.data2;
        } else {
            targetData = this.data1;
        }

        // Find and toggle the bit
        const bit = targetData.bits.find(b => b.position === position);
        if (bit) {
            // Toggle the bit value
            bit.value = bit.value === '1' ? '0' : '1';
            bit.set = bit.value === '1';

            // Update the visual element
            bitElement.textContent = bit.value;
            if (bit.set) {
                bitElement.classList.remove('bit-unset');
                bitElement.classList.add('bit-set');
            } else {
                bitElement.classList.remove('bit-set');
                bitElement.classList.add('bit-unset');
            }

            // Recalculate all values
            this.recalculateValues(targetData, displayIndex);
            
            // Update comparison highlighting if in comparison mode
            if (this.data1 && this.data2) {
                this.updateComparisonHighlighting();
            }
        }
    }

    recalculateValues(data, displayIndex) {
        // Reconstruct binary string from bits
        const sortedBits = [...data.bits].sort((a, b) => b.position - a.position); // MSB first
        data.binary = sortedBits.map(bit => bit.value).join('');
        
        // Calculate new decimal value
        data.parsed_value = parseInt(data.binary, 2);
        
        // Update formats
        data.formats.hex = `0x${data.parsed_value.toString(16).toUpperCase().padStart(data.bit_width / 4, '0')}`;
        data.formats.dec = data.parsed_value.toString();
        data.formats.oct = `0o${data.parsed_value.toString(8)}`;
        
        // Update the display
        this.updateValueDisplay(data, displayIndex);
        
        // Update the input field if it's the main value
        if (displayIndex === '1') {
            const format = document.getElementById('numberFormat').value;
            const input = document.getElementById('registerValue');
            switch (format) {
                case 'hex':
                    input.value = data.formats.hex;
                    break;
                case 'dec':
                    input.value = data.formats.dec;
                    break;
                case 'oct':
                    input.value = data.formats.oct;
                    break;
            }
        } else if (displayIndex === '2') {
            const format = document.getElementById('numberFormat').value;
            const input = document.getElementById('compareValue');
            switch (format) {
                case 'hex':
                    input.value = data.formats.hex;
                    break;
                case 'dec':
                    input.value = data.formats.dec;
                    break;
                case 'oct':
                    input.value = data.formats.oct;
                    break;
            }
        }
    }

    updateValueDisplay(data, displayIndex) {
        // Update value info display
        const selector = displayIndex === '2' ? '.comparison-register:nth-child(2) .value-info' : '.comparison-register:nth-child(1) .value-info';
        const valueInfoElement = document.querySelector(selector);
        if (valueInfoElement) {
            valueInfoElement.textContent = `${data.formats.hex} (${data.parsed_value})`;
        }
        
        // Update binary string display
        const binarySelector = displayIndex === '2' ? '.comparison-register:nth-child(2) .binary-string' : '.comparison-register:nth-child(1) .binary-string';
        const binaryElement = document.querySelector(binarySelector);
        if (binaryElement) {
            const binaryLabel = displayIndex === '2' ? 'Binary 2' : 'Binary 1';
            binaryElement.innerHTML = `<strong>${binaryLabel}:</strong> <code>${data.binary}</code>`;
        }
        
        // Update the main format display if this is register 1
        if (displayIndex === '1') {
            const formatDiv = document.getElementById('formatDisplay');
            if (formatDiv) {
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
            }
        }
    }

    updateComparisonHighlighting() {
        // Re-apply comparison highlighting to all bits
        this.bitElements.forEach(bitElement => {
            const displayIndex = bitElement.getAttribute('data-display');
            const position = parseInt(bitElement.getAttribute('data-position'));
            
            // Remove existing comparison classes
            bitElement.classList.remove('bit-different');
            
            // Get bits from both registers
            const bit1 = this.data1.bits.find(b => b.position === position);
            const bit2 = this.data2.bits.find(b => b.position === position);
            
            // Add comparison highlighting if bits are different
            if (bit1 && bit2 && bit1.value !== bit2.value) {
                bitElement.classList.add('bit-different');
            }
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RegisterBitFields();
});
