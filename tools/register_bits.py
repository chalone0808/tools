from flask import jsonify


def parse_register(data):
    """Parse the register value and return binary representation with bit numbers"""
    try:
        value = data.get("value", "").strip()
        compare_value = data.get("compare_value", "").strip()
        number_format = data.get("format", "hex")
        bit_width = int(data.get("bit_width", 32))

        def parse_single_value(val, fmt):
            """Helper function to parse a single value"""
            if fmt == "hex":
                # Remove 0x prefix if present
                val = val.replace("0x", "").replace("0X", "")
                return int(val, 16)
            elif fmt == "dec":
                return int(val, 10)
            elif fmt == "oct":
                # Remove 0o prefix if present
                val = val.replace("0o", "").replace("0O", "")
                return int(val, 8)
            else:
                raise ValueError("Invalid format specified")

        def create_bit_data(parsed_val, width):
            """Helper function to create bit data structure"""
            # Check if value fits in the specified bit width
            max_value = (1 << width) - 1
            if parsed_val > max_value:
                raise ValueError(f"Value {parsed_val} exceeds maximum for {width}-bit ({max_value})")
            
            if parsed_val < 0:
                raise ValueError("Negative values are not supported")

            # Convert to binary and pad to the specified width
            binary_str = format(parsed_val, f"0{width}b")

            # Create bit information for display
            bits = []
            for i, bit in enumerate(reversed(binary_str)):
                bits.append({"position": i, "value": bit, "set": bit == "1"})

            # Convert back to different formats for verification
            hex_value = f"0x{parsed_val:0{width//4}X}"
            dec_value = str(parsed_val)
            oct_value = f"0o{parsed_val:o}"

            return {
                "parsed_value": parsed_val,
                "binary": binary_str,
                "bits": bits,
                "formats": {"hex": hex_value, "dec": dec_value, "oct": oct_value}
            }

        # Parse the main value
        parsed_value = parse_single_value(value, number_format)
        main_data = create_bit_data(parsed_value, bit_width)

        # Prepare response
        response_data = {
            "success": True,
            "original_value": value,
            "parsed_value": main_data["parsed_value"],
            "binary": main_data["binary"],
            "bits": main_data["bits"],
            "bit_width": bit_width,
            "formats": main_data["formats"],
            "comparison": None
        }

        # Parse comparison value if provided
        if compare_value:
            try:
                compare_parsed_value = parse_single_value(compare_value, number_format)
                compare_data = create_bit_data(compare_parsed_value, bit_width)
                
                response_data["comparison"] = {
                    "compare_value": compare_value,
                    "parsed_value": compare_data["parsed_value"],
                    "binary": compare_data["binary"],
                    "bits": compare_data["bits"],
                    "bit_width": bit_width,
                    "formats": compare_data["formats"]
                }
            except Exception as e:
                # If comparison value is invalid, continue without comparison
                response_data["comparison"] = {
                    "error": f"Invalid comparison value: {str(e)}"
                }

        return jsonify(response_data)

    except ValueError as e:
        return jsonify({"error": f"Invalid number format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500
