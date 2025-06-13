# Climbing Wall Visualizer

A simple web application that helps visualize climbing wall holds and their IDs. This tool makes it easy to identify holds on a climbing wall by hovering over them.

## Features

- Paste JSON wall data to visualize the climbing wall
- Interactive hold highlighting on hover
- Display hold IDs when hovering over holds
- Responsive design that works on different screen sizes

## Usage

1. Open `index.html` in a web browser
2. Paste your wall JSON data into the text area
3. Click "Load Wall" to visualize the wall
4. Hover over holds to see their IDs

## JSON Format

The application expects JSON data in the following format:

```json
{
  "image_url": "URL to wall image",
  "image_width": number,
  "image_height": number,
  "holds": [
    {
      "id": "hold_id",
      "mask": [[x1, y1], [x2, y2], ...]
    },
    ...
  ]
}
```

## Development

This is a simple prototype built with vanilla HTML, CSS, and JavaScript. No build process or dependencies are required.

## Deployment

The application can be deployed to GitHub Pages by:

1. Creating a new repository
2. Pushing these files to the repository
3. Enabling GitHub Pages in the repository settings

## License

MIT License
