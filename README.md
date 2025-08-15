# Developer Tools Flask Application

A Flask web application providing various developer tools and utilities.

## Features

### Register Bits Parser
- Parse 32-bit or 64-bit register values
- Support for multiple input formats:
  - Hexadecimal (with or without 0x prefix)
  - Decimal
  - Octal (with or without 0o prefix)
- Visual binary representation with bit numbering
- Format conversion display

## Project Structure

```
tools/
├── app.py                              # Main Flask application
├── requirements.txt                    # Python dependencies
├── static/                             # Static assets
│   ├── css/
│   │   └── register_bits.css    # Styles for register tool
│   └── js/
│       └── register_bits.js     # JavaScript for register tool
├── templates/                          # HTML templates
│   ├── index.html                     # Main page
│   └── register_bits.html       # Register Bits tool
└── tools/                              # Tool modules
    ├── __init__.py                    # Package initialization
    └── register_bits.py         # Register parsing logic
```

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5100
```

## Usage

### Register Bits Tool
1. Navigate to the "Register Bits" tool from the main page
2. Select the bit width (32-bit or 64-bit)
3. Choose the input format (Hex, Decimal, or Octal)
4. Enter the register value
5. Click "Parse" to see the binary representation with bit positions

The tool will display:
- Format conversions (Hex, Decimal, Octal)
- Binary representation with bit numbering starting from 0
- Visual bit display with set bits highlighted

## Development

The application is built with:
- Flask web framework
- Bootstrap 5 for responsive UI
- Font Awesome for icons
- JavaScript for interactive functionality

## Adding New Tools

To add new tools:
1. Create a new route in `app.py`
2. Create the corresponding HTML template in `templates/`
3. Add the tool card to the main page (`templates/index.html`)
4. For complex logic, create a new module in the `tools/` package (like `tools/register_bits.py`)

## Architecture

The application follows a modular design with clear separation of concerns:
- **`app.py`**: Main Flask application with route definitions
- **`tools/` package**: Contains business logic for each tool
- **`templates/`**: HTML templates for the web interface
- **`static/`**: Static assets (CSS, JavaScript, images)
  - **`css/`**: Stylesheets for each tool
  - **`js/`**: JavaScript modules for interactive functionality
- **`requirements.txt`**: Python dependencies

This separation allows for:
- **Clean code organization**: Each component has a specific responsibility
- **Easy testing**: Business logic can be tested independently
- **Better maintainability**: Changes to one component don't affect others
- **Scalability**: Easy to add new tools and features