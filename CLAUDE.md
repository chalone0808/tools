# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flask web application serving developer tools via a browser UI. Currently has one tool: a register bit-field parser/visualizer for 32-bit and 64-bit hardware register values.

## Commands

```bash
pip install -r requirements.txt        # Install dependencies
python app.py                          # Run dev server on http://0.0.0.0:5100
./service.sh start|stop|restart|status # Manage as background service
```

No test framework is configured.

## Architecture

- **`app.py`** — Flask app entry point. All routes defined here. Each tool gets a page route (renders template) and an API route (POST, returns JSON).
- **`tools/`** — Python package with backend logic for each tool (e.g., `register_bits.py`). Tool modules receive request data and return `jsonify()` responses.
- **`templates/`** — Jinja2 HTML templates. `index.html` is the landing page; each tool has its own template.
- **`static/js/`**, **`static/css/`** — Per-tool JS and CSS files. The JS handles all client-side interactivity (no framework, vanilla JS classes).

## Adding a New Tool

1. Create backend logic in `tools/<name>.py` — function takes parsed JSON, returns `jsonify()` response.
2. Add a page route and a POST API route in `app.py`.
3. Create `templates/<name>.html` for the UI.
4. Add a card linking to the tool on `templates/index.html`.
5. Add per-tool JS/CSS in `static/js/` and `static/css/` as needed.

## Key Details

- The frontend uses Bootstrap 5 and Font Awesome (loaded via CDN), no npm/bundler.
- The register bits tool supports hex/dec/oct input, comparison of two register values with diff highlighting, bit selection (drag to select range), and edit mode (click to toggle individual bits).
- The JS class `RegisterBitFields` in `static/js/register_bits.js` manages all client-side state including two interaction modes (selection vs. edit) with live recalculation.
