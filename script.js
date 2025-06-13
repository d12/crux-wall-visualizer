class WallVisualizer {
  constructor() {
    this.canvas = document.getElementById('wallCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.holds = [];
    this.image = null;
    this.scale = 1;
    this.hoveredHold = null;
    this.selectedHold = null;
    this.externalIds = new Map();
    this.apiKey = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('loadGymsButton').addEventListener('click', () => this.loadGyms());
    document.getElementById('gymSelect').addEventListener('change', () => this.loadWalls());
    document.getElementById('wallSelect').addEventListener('change', () => this.loadWall());
    document.getElementById('loadNewButton').addEventListener('click', () => this.resetWall());
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseout', () => this.handleMouseOut());
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    document.getElementById('saveExternalId').addEventListener('click', () => this.saveExternalId());
    document.getElementById('copyMapping').addEventListener('click', () => this.copyMapping());
  }

  resetWall() {
    // Reset state
    this.holds = [];
    this.image = null;
    this.externalIds.clear();
    this.selectedHold = null;
    this.hoveredHold = null;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Reset UI
    document.getElementById('apiKeyContainer').style.display = 'block';
    document.getElementById('gymSelectionContainer').style.display = 'none';
    document.getElementById('wallSelectionContainer').style.display = 'none';
    document.getElementById('loadNewContainer').style.display = 'none';
    document.getElementById('visualizationSection').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('mappingJson').textContent = '';

    // Clear selections
    document.getElementById('gymSelect').value = '';
    document.getElementById('wallSelect').value = '';
  }

  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
  }

  async loadGyms() {
    try {
      this.hideError();
      this.apiKey = document.getElementById('apiKeyInput').value.trim();

      if (!this.apiKey) {
        throw new Error('Please enter an API key');
      }

      const response = await fetch('https://www.cruxapp.ca/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gyms. Please check your API key.');
      }

      const data = await response.json();

      if (!data.viewed_gyms || !Array.isArray(data.viewed_gyms)) {
        throw new Error('No gyms found in the response');
      }

      // Populate gym select
      const gymSelect = document.getElementById('gymSelect');
      gymSelect.innerHTML = '<option value="">Select a gym...</option>';

      data.viewed_gyms.forEach(gym => {
        const option = document.createElement('option');
        option.value = gym.url_slug;
        option.textContent = gym.name;
        gymSelect.appendChild(option);
      });

      // Show gym selection
      document.getElementById('gymSelectionContainer').style.display = 'block';
      document.getElementById('wallSelectionContainer').style.display = 'none';
      document.getElementById('visualizationSection').style.display = 'none';
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadWalls() {
    try {
      this.hideError();
      const gymSlug = document.getElementById('gymSelect').value;

      if (!gymSlug) {
        document.getElementById('wallSelectionContainer').style.display = 'none';
        return;
      }

      const response = await fetch(`https://www.cruxapp.ca/api/v1/gyms/${gymSlug}/gym_walls`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch walls');
      }

      const walls = await response.json();

      if (!Array.isArray(walls) || walls.length === 0) {
        throw new Error('No walls found for this gym');
      }

      // If there's only one wall, select it automatically
      if (walls.length === 1) {
        await this.loadWallData(walls[0]);
        return;
      }

      // Populate wall select
      const wallSelect = document.getElementById('wallSelect');
      wallSelect.innerHTML = '<option value="">Select a wall...</option>';

      walls.forEach(wall => {
        const option = document.createElement('option');
        option.value = JSON.stringify(wall);
        option.textContent = wall.name;
        wallSelect.appendChild(option);
      });

      // Show wall selection
      document.getElementById('wallSelectionContainer').style.display = 'block';
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadWall() {
    try {
      this.hideError();
      const wallData = document.getElementById('wallSelect').value;

      if (!wallData) {
        return;
      }

      await this.loadWallData(JSON.parse(wallData));
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadWallData(data) {
    try {
      // Validate the data
      this.validateWallData(data);

      // Load the image
      this.image = await this.loadImage(data.image_url);

      // Set canvas size based on image dimensions
      this.canvas.width = data.image_width;
      this.canvas.height = data.image_height;

      // Store holds data
      this.holds = data.holds;

      // Reset state
      this.externalIds.clear();
      this.selectedHold = null;
      this.hoveredHold = null;

      // Update UI
      document.getElementById('apiKeyContainer').style.display = 'none';
      document.getElementById('gymSelectionContainer').style.display = 'none';
      document.getElementById('wallSelectionContainer').style.display = 'none';
      document.getElementById('loadNewContainer').style.display = 'block';
      document.getElementById('visualizationSection').style.display = 'flex';

      // Draw the wall
      this.drawWall();
      this.updateMappingDisplay();
    } catch (error) {
      this.showError(error.message);
    }
  }

  validateWallData(data) {
    const requiredFields = ['image_url', 'image_width', 'image_height', 'holds'];
    const missingFields = requiredFields.filter(field => !(field in data));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(data.holds)) {
      throw new Error('Holds must be an array');
    }

    if (data.holds.length === 0) {
      throw new Error('No holds found in the data');
    }

    // Filter out invalid holds instead of throwing errors
    this.holds = data.holds.filter(hold => {
      if (!hold.id) {
        console.warn('Skipping hold with missing ID');
        return false;
      }
      if (!Array.isArray(hold.mask) || hold.mask.length < 3) {
        console.warn(`Skipping hold ${hold.id} with invalid mask`);
        return false;
      }
      return true;
    });

    if (this.holds.length === 0) {
      throw new Error('No valid holds found in the data');
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  drawWall() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the wall image
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

    // Draw all holds
    this.holds.forEach(hold => {
      const isHovered = hold === this.hoveredHold;
      const isSelected = hold === this.selectedHold;
      const hasExternalId = this.externalIds.has(hold.id);
      this.drawHold(hold, isHovered, isSelected, hasExternalId);
    });
  }

  drawHold(hold, isHovered, isSelected, hasExternalId) {
    const mask = hold.mask;
    if (!mask || mask.length < 3) return;

    try {
      this.ctx.beginPath();
      this.ctx.moveTo(mask[0][0], mask[0][1]);

      for (let i = 1; i < mask.length; i++) {
        this.ctx.lineTo(mask[i][0], mask[i][1]);
      }

      this.ctx.closePath();

      // Set hold style
      if (isSelected) {
        this.ctx.strokeStyle = '#0000ff';
        this.ctx.lineWidth = 3;
      } else if (isHovered) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
      } else if (hasExternalId) {
        this.ctx.strokeStyle = '#800080'; // Purple for holds with external IDs
        this.ctx.lineWidth = 1;
      } else {
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
      }

      this.ctx.stroke();

      if (isSelected || isHovered) {
        this.ctx.fillStyle = isSelected ? 'rgba(0, 0, 255, 0.1)' : 'rgba(255, 0, 0, 0.1)';
        this.ctx.fill();
      }
    } catch (error) {
      console.warn(`Error drawing hold ${hold.id}:`, error);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    // Convert mouse coordinates to canvas coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find the hold under the cursor
    const hold = this.findHoldAtPoint(x, y);

    if (hold !== this.hoveredHold) {
      this.hoveredHold = hold;
      this.drawWall();
    }
  }

  handleMouseOut() {
    this.hoveredHold = null;
    this.drawWall();
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedHold = this.findHoldAtPoint(x, y);
    this.selectedHold = clickedHold;

    this.drawWall();
    this.updateHoldInfo(clickedHold);

    // Show/hide external ID input
    const externalIdInput = document.getElementById('externalIdInput');
    const externalIdField = document.getElementById('externalIdField');

    if (clickedHold) {
      externalIdInput.style.display = 'block';
      externalIdField.value = this.externalIds.get(clickedHold.id) || '';
    } else {
      externalIdInput.style.display = 'none';
      externalIdField.value = '';
    }
  }

  findHoldAtPoint(x, y) {
    // Find all holds that contain the point
    const overlappingHolds = this.holds.filter(hold => this.isPointInHold(x, y, hold));

    if (overlappingHolds.length === 0) return null;
    if (overlappingHolds.length === 1) return overlappingHolds[0];

    // Calculate area for each hold and find the smallest one
    return overlappingHolds.reduce((smallest, current) => {
      const smallestArea = this.calculateHoldArea(smallest);
      const currentArea = this.calculateHoldArea(current);
      return currentArea < smallestArea ? current : smallest;
    });
  }

  calculateHoldArea(hold) {
    const mask = hold.mask;
    if (!mask || mask.length < 3) return Infinity;

    let area = 0;
    for (let i = 0; i < mask.length; i++) {
      const j = (i + 1) % mask.length;
      area += mask[i][0] * mask[j][1];
      area -= mask[j][0] * mask[i][1];
    }
    return Math.abs(area / 2);
  }

  isPointInHold(x, y, hold) {
    const mask = hold.mask;
    if (!mask || mask.length < 3) return false;

    let inside = false;
    let j = mask.length - 1;

    for (let i = 0; i < mask.length; i++) {
      const xi = mask[i][0], yi = mask[i][1];
      const xj = mask[j][0], yj = mask[j][1];

      // Check if point is on the edge
      if ((xi === x && yi === y) || (xj === x && yj === y)) {
        return true;
      }

      // Check if point is on a horizontal boundary
      if ((yi === y && yj === y) && ((xi > x) !== (xj > x))) {
        return true;
      }

      // Check if point is on a vertical boundary
      if ((xi === x && xj === x) && ((yi > y) !== (yj > y))) {
        return true;
      }

      // Ray casting algorithm for point in polygon
      if ((yi > y) !== (yj > y)) {
        const intersect = (xj - xi) * (y - yi) / (yj - yi) + xi;
        if (x < intersect) {
          inside = !inside;
        }
      }
      j = i;
    }

    return inside;
  }

  updateHoldInfo(hold) {
    const holdInfo = document.getElementById('holdInfo');
    if (hold) {
      holdInfo.innerHTML = `
                <h3>Hold Information</h3>
                <p>ID: ${hold.id}</p>
                <div id="externalIdInput" class="external-id-input" style="display: block;">
                    <div class="input-group">
                        <input type="text" id="externalIdField" placeholder="Enter external ID">
                        <button id="saveExternalId">Save</button>
                    </div>
                </div>
            `;

      // Reattach event listener to the new save button
      document.getElementById('saveExternalId').addEventListener('click', () => this.saveExternalId());

      // Set the external ID value if it exists
      const externalIdField = document.getElementById('externalIdField');
      externalIdField.value = this.externalIds.get(hold.id) || '';
    } else {
      holdInfo.innerHTML = `
                <h3>Hold Information</h3>
                <p>Click on a hold to select it</p>
            `;
    }
  }

  saveExternalId() {
    if (!this.selectedHold) return;

    const externalIdField = document.getElementById('externalIdField');
    const externalId = externalIdField.value.trim();

    if (externalId) {
      this.externalIds.set(this.selectedHold.id, externalId);
    } else {
      this.externalIds.delete(this.selectedHold.id);
    }

    this.drawWall();
    this.updateMappingDisplay();
  }

  updateMappingDisplay() {
    const mappingJson = document.getElementById('mappingJson');
    const mapping = {};

    this.externalIds.forEach((externalId, holdId) => {
      mapping[holdId] = externalId;
    });

    mappingJson.textContent = JSON.stringify(mapping, null, 2);
  }

  copyMapping() {
    const mappingJson = document.getElementById('mappingJson');
    navigator.clipboard.writeText(mappingJson.textContent)
      .then(() => {
        const button = document.getElementById('copyMapping');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy mapping:', err);
        alert('Failed to copy mapping to clipboard');
      });
  }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new WallVisualizer();
});
