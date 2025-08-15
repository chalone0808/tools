from flask import jsonify


def parse_register(data):
    """Parse the register value and return binary representation with bit numbers"""
    try:
        value = data.get('value', '').strip()
        number_format = data.get('format', 'hex')
        bit_width = int(data.get('bit_width', 32))
        
        # Parse the input based on format
        if number_format == 'hex':
            # Remove 0x prefix if present
            value = value.replace('0x', '').replace('0X', '')
            parsed_value = int(value, 16)
        elif number_format == 'dec':
            parsed_value = int(value, 10)
        elif number_format == 'oct':
            # Remove 0o prefix if present
            value = value.replace('0o', '').replace('0O', '')
            parsed_value = int(value, 8)
        else:
            return jsonify({'error': 'Invalid format specified'}), 400
        
        # Check if value fits in the specified bit width
        max_value = (1 << bit_width) - 1
        if parsed_value > max_value:
            return jsonify({'error': f'Value {parsed_value} exceeds maximum for {bit_width}-bit ({max_value})'}), 400
        
        if parsed_value < 0:
            return jsonify({'error': 'Negative values are not supported'}), 400
        
        # Convert to binary and pad to the specified width
        binary_str = format(parsed_value, f'0{bit_width}b')
        
        # Create bit information for display
        bits = []
        for i, bit in enumerate(reversed(binary_str)):
            bits.append({
                'position': i,
                'value': bit,
                'set': bit == '1'
            })
        
        # Convert back to different formats for verification
        hex_value = f"0x{parsed_value:0{bit_width//4}X}"
        dec_value = str(parsed_value)
        oct_value = f"0o{parsed_value:o}"
        
        return jsonify({
            'success': True,
            'original_value': value,
            'parsed_value': parsed_value,
            'binary': binary_str,
            'bits': bits,
            'bit_width': bit_width,
            'formats': {
                'hex': hex_value,
                'dec': dec_value,
                'oct': oct_value
            }
        })
        
    except ValueError as e:
        return jsonify({'error': f'Invalid number format: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Error processing request: {str(e)}'}), 500
