let noise = {
  canvas: document.createElement("canvas"),
  generateNoise: async function(width, height) {
    width = Math.floor(width);
    height = Math.floor(height);
    
    this.canvas.width = width;
    this.canvas.height = height;
    let pixels = width * height;
    
    let imageData = new ImageData(width, height);
    let data = imageData.data;
    
    let index = 0;
    while(index < pixels){
      for(let j = 0; j < specs.ppf && index < pixels; j++){
        let value = Math.random() < 0.5 ? 1 : 0;
        
        data[index * 4] = value * 255;
        data[index * 4 + 1] = value * 255;
        data[index * 4 + 2] = value * 255;
        data[index * 4 + 3] = 255;
        
        index++;
      }
      
      await frameDelay();
    }
    
    this.canvas.getContext("2d").putImageData(imageData, 0, 0);
  } 
};

let voronoiNoise = {
  canvas: document.createElement("canvas"),
  generateNoise: async function(width, height, scale) {
    scale = width / scale;
    let gridWidth = Math.ceil(width / scale);
    let gridHeight = Math.ceil(height / scale);
    let cells = gridWidth * gridHeight;
    let grid = new Array(cells);
    
    width = Math.floor(gridWidth * scale);
    height = Math.floor(gridHeight * scale);
    
    this.canvas.width = width;
    this.canvas.height = height;
    let pixels = width * height;
    
    let imageData = new ImageData(width, height);
    let data = imageData.data;
    
    for(let i = 0; i<cells; i++){
      grid[i] = vec2(Math.random(), Math.random());
    }
    
    let index = 0;
    while(index < pixels){
      for(let j = 0; j < specs.ppf && index < pixels; j++){
        let x = index % width;
        let y = Math.floor(index / width);
        let cx = Math.floor(x / scale);
        let cy = Math.floor(y / scale);
        let cellIndex = cx + cy * gridWidth;
        
        let value = 1000.0;
        for(let dx = -1; dx <= 1; dx++){
          for(let dy = -1; dy <= 1; dy++){
            let fx = cx + dx; // final x
            let fy = cy + dy; // final y 
            if(fx < 0 || fx >= gridWidth || fy < 0 || fy >= gridHeight) continue;
            
            value = Math.min(value, getDistFrom(x + 0.5, y + 0.5, fx, fy));
          }        
        }
        
        value = 255 - value;
        
        data[index * 4] = value;
        data[index * 4 + 1] = value;
        data[index * 4 + 2] = value;
        data[index * 4 + 3] = 255;
        
        index++;
      }
      
      await frameDelay();
    }
    
    this.canvas.getContext("2d").putImageData(imageData, 0, 0);
    
    function getDistFrom(x, y, cellX, cellY) {
      let cellIndex = cellX + cellY * gridWidth;
    
      let pos = grid[cellIndex];
    
      let px = (cellX + pos.x) * scale;
      let py = (cellY + pos.y) * scale;
      
      return Math.hypot(x - px, y - py);
    }
  }
};