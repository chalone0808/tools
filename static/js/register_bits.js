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
            this.initializeBitSelection(data.bits, data.bit_width);
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
        let bitHtml = '<div class="bit-display"><h5>Binary Representation:</h5>';
        bitHtml += '<p class="text-muted">Click and drag to select bits for analysis</p>';
        
        const bitsPerRow = 16; // Show 16 bits per row for better readability
        const bits = data.bits.reverse(); // Reverse to show MSB first
        
        // Calculate number of rows needed
        const numRows = Math.ceil(data.bit_width / bitsPerRow);
        
        for (let row = 0; row < numRows; row++) {
            const startBit = data.bit_width - 1 - (row * bitsPerRow);
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
                const bitIndex = data.bit_width - 1 - i;
                const bit = bits[bitIndex];
                const className = bit.set ? 'bit-set' : 'bit-unset';
                bitHtml += `<div class="bit-value ${className}" data-position="${bit.position}" data-bit-index="${bitIndex}">${bit.value}</div>`;
            }
            bitHtml += '</div>';
            
            // Add some spacing between rows
            if (row < numRows - 1) {
                bitHtml += '<div style="margin-bottom: 10px;"></div>';
            }
        }
        
        // Add binary string
        bitHtml += `<div class="mt-3"><strong>Binary:</strong> <code>${data.binary}</code></div>`;
        
        // Add selection display area
        bitHtml += '<div id="selectionDisplay" style="display: none;"></div>';
        
        bitHtml += '</div>';
        
        return bitHtml;
    }

    updatePlaceholderText() {
        const format = document.getElementById('numberFormat').value;
        const input = document.getElementById('registerValue');
        
        switch(format) {
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

    initializeBitSelection(bitsData, bitWidth) {
        this.bitsData = bitsData;
        this.bitWidth = bitWidth;
        this.bitElements = document.querySelectorAll('.bit-value');
        this.selectionDisplay = document.getElementById('selectionDisplay');
        
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
        
        this.clearSelection();
        
        const bitElement = this.bitElements[index];
        const position = parseInt(bitElement.dataset.position);
        this.selectedBits.add(position);
        bitElement.classList.add('bit-selected');
        
        this.updateSelectionDisplay();
    }

    handleBitMouseEnter(e, index) {
        if (this.isSelecting && this.startBitIndex !== null) {
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
        
        // Convert selected bits to value - treat as new number starting from bit 0
        const sortedPositions = Array.from(this.selectedBits).sort((a, b) => b - a); // MSB first
        let selectedValue = 0;
        let binaryStr = '';
        
        // Build binary string from MSB to LSB
        for (const position of sortedPositions) {
            const bitValue = this.bitsData.find(b => b.position === position).value;
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
                    <strong>Selected ${rangeText}</strong> (${this.selectedBits.size} bit${this.selectedBits.size > 1 ? 's' : ''})
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
            if (bitElement) {
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
