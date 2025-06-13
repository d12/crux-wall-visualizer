# Climbing Wall Visualizer

A web application for visualizing climbing walls and managing hold mappings. This tool allows you to view climbing walls from your Crux gyms and create mappings between hold IDs and external IDs.

Shamelessly vibe-coded in ~30 minutes. Thanks Cursor 🫡

## Features

- View climbing walls from your Crux gyms
- Interactive hold selection and highlighting
- External ID management for holds
- JSON mapping export functionality

## Getting Started

1. Get your Crux API key:
   - Open the Crux app
   - Go to Profile -> Settings -> API Authentication
   - Copy the API key

2. Open the application in your web browser
   - Enter your API key
   - Select a gym from your viewed gyms
   - Select a wall to visualize

## Usage

1. **Selecting Holds**
   - Click on a hold to select it
   - Hover over holds to highlight them
   - The smallest hold is selected when multiple holds overlap

2. **Managing External IDs**
   - Click a hold to select it
   - Enter an external ID in the input field
   - Click "Save" to store the mapping
   - Holds with external IDs are highlighted in purple

3. **Exporting Mappings**
   - The current mapping is displayed in the ID Mapping section
   - Click "Copy Mapping" to copy the JSON to your clipboard

## Color Coding

- Green: Normal holds
- Purple: Holds with external IDs
- Red: Hovered holds
- Blue: Selected holds

## Privacy

Your API key is stored only in your browser's memory and is never sent to any server other than the Crux API. The application runs entirely in your browser.

## Development

This is a simple prototype built with vanilla HTML, CSS, and JavaScript. No build process or dependencies are required.

## Deployment

The application can be deployed to GitHub Pages by:

1. Creating a new repository
2. Pushing these files to the repository
3. Enabling GitHub Pages in the repository settings

## License

MIT License
