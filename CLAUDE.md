# FHIR Resource Viewer

A lightweight HTML/CSS/JavaScript application for viewing FHIR R4 Resources and US Core modifications with a large font, easy-to-navigate interface.

## Project Overview

This application provides an intuitive way to browse and explore FHIR R4 specifications and US Core implementation guides. The app stores FHIR specifications locally as JSON files for offline access and features a large font UI optimized for readability and easy navigation.

## Features

- **Universal compatibility** - runs on any device with a web browser
- **No installation required** - just open the HTML file
- **Large font UI** for improved readability
- **Local JSON storage** of FHIR R4 and US Core specifications
- **Collapsible tree navigation** through resource hierarchies
- **Offline access** to specifications
- **Search and filter** functionality for resources and fields
- **Responsive design** adapts to any screen size
- **Progressive Web App** capabilities for app-like experience

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data Format**: JSON files for FHIR specifications
- **Optional Framework**: Alpine.js for reactive components
- **Styling**: CSS Grid/Flexbox for responsive layout
- **Storage**: LocalStorage for user preferences

## Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor or IDE (VS Code recommended)
- Optional: Local web server for development (Python, Node.js, or VS Code Live Server)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fhir_resource_viewer
   ```

2. Download FHIR specifications:
   ```bash
   # Script to download and process FHIR R4 and US Core specs
   node scripts/download_specs.js
   # or
   python scripts/download_specs.py
   ```

3. Open the application:
   ```bash
   # Option 1: Direct file access
   open index.html
   
   # Option 2: Local server (recommended for development)
   python -m http.server 8000
   # Then visit: http://localhost:8000
   
   # Option 3: VS Code Live Server
   # Install Live Server extension and right-click index.html -> "Open with Live Server"
   ```

### Project Structure

```
├── index.html                # Main application file
├── css/
│   ├── styles.css           # Main stylesheet
│   └── themes.css           # Color themes and fonts
├── js/
│   ├── app.js               # Main application logic
│   ├── fhir-loader.js       # FHIR data loading and parsing
│   ├── search.js            # Search and filter functionality
│   └── navigation.js        # Tree navigation and UI
├── data/
│   ├── fhir-r4/            # FHIR R4 resource definitions (JSON)
│   ├── us-core/            # US Core profiles (JSON)
│   └── index.json          # Resource index for quick loading
├── scripts/
│   ├── download_specs.js    # Node.js script to fetch specs
│   └── download_specs.py    # Python script to fetch specs
└── assets/
    └── fonts/              # Custom fonts for large text display
```

## Data Sources

- **FHIR R4**: https://hl7.org/fhir/R4/
- **US Core**: https://hl7.org/fhir/us/core/

## Usage

### Running the Application

1. **Direct file access**: Double-click `index.html` to open in your default browser
2. **Local development server**: Run `python -m http.server 8000` and visit `http://localhost:8000`
3. **VS Code**: Use the Live Server extension for hot reload during development

### Deployment Options

- **File sharing**: Zip the entire folder and share
- **Static hosting**: Upload to GitHub Pages, Netlify, or any static host
- **Local network**: Run local server and access from other devices
- **Offline usage**: Works completely offline once loaded

## Commands

### Development
- `python -m http.server 8000` - Start local development server
- `node scripts/download_specs.js` - Update FHIR specifications
- `python scripts/download_specs.py` - Update FHIR specifications (Python version)

### Validation
- Open browser developer tools to check for JavaScript errors
- Test in multiple browsers for compatibility
- Validate HTML/CSS with W3C validators

### Maintenance
- Run download scripts to update FHIR specifications
- Check browser console for any loading errors
- Update dependencies if using package managers