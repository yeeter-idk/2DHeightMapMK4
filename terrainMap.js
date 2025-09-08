let terrainMap = {
  canvas: "error",
  ctx: "error",
  btnElement: "error",
  generating: false,
  floorWater: false,
  styleBeaches: false,
  waterBlocking: 2,
  previewCount: 0,
  landColors: [
    color(1, 0.8745, 0.6667),
    
    //color(0, 0.5333, 0.0667),
    //color(0.3, 0.8, 0.3),
    color(0.35785, 0.73335, 0.15),
    
    //color(0.451, 0.4118, 0.451),
    //color(0.1, 0.7, 0.1),
    color(0.05, 0.61665, 0.08335),
    
    color(0.451, 0.4118, 0.451),
    color(0.8353, 0.9569, 1)
  ],
  getLandColor: function(ratio) {
    return this.landColors[clamp(Math.floor(this.landColors.length * ratio), 0, this.landColors.length - 1)];
  },
  waterColors: [
    color(0.0353, 0.0588, 0.4196),
    color(0.2039, 0.1882, 0.7451),
    color(0.2039, 0.3804, 1),
    color(0.3647, 0.5647, 0.9922),
    color(0.4588, 0.7216, 0.9922)    
  ],
  getWaterColor: function(ratio, dither) {
    let lastIndex = this.waterColors.length - 1
    let index = clamp(Math.floor(this.waterColors.length * ratio), 0, lastIndex);
    
    let mixValue = (this.waterColors.length * ratio) - lastIndex; 
    
    if(mixValue > 0 && this.styleBeaches){
      let alpha1 = mixValue ** 2 * (4/5);
      let alpha2 = mixValue ** 10 * dither;  
      return mixColor(
        color(1, 1, 1), 
        mixColor(
          this.landColors[0], 
          this.waterColors[lastIndex], 
          alpha1), 
        alpha2);    
    }
    
    if(this.floorWater && mixValue <= 0){
      return this.waterColors[lastIndex]; 
    }
    
    return this.waterColors[index];
  },
  initialize: function() {
    this.canvas = getElem("terrain");
    this.ctx = this.canvas.getContext("2d", {willReadFrequently: true});
    this.btnElement = getElem("terrainBtn");    
    
    this.setup();
  },
  setup: function() {
    if(this.canvas.width != specs.width || this.canvas.height != specs.height){
      this.canvas.width = specs.width;
      this.canvas.height = specs.height;
    }
    
    this.floorWater = getElem("terrainFloorAtWater").checked;
    this.styleBeaches = getElem("terrainStyleBeaches").checked;
    
  },
  doPreview: function() {
    this.previewCount++;    
    if(this.previewCount >= specs.previewRate){
      this.previewCount = 0;
      return true;
    }    
    return false;
  },
  startedGenerating: function() {
    this.btnElement.classList.add("currentlyGenerating");
    this.generating = true;
  },
  endedGenerating: function() {
    this.btnElement.classList.remove(
    "currentlyGenerating");
    this.generating = false;
  },
  generate: async function() {
    if(this.generating) return;
    
    updateSpecs();
    
    this.startedGenerating();
    
    let heightData = heightMap.ctx.getImageData(0, 0, specs.width, specs.height).data;
    
    let pixels = specs.width * specs.height;
    
    let imageData = this.ctx.getImageData(0, 0, specs.width, specs.height);
    let data = imageData.data;
    
    let index = 0;
    while(index < pixels){
      for(let j = 0; j < specs.ppf && index < pixels; j++){
        let x = index % specs.width;
        let y = Math.floor(index / specs.width);
        
        let elevation = heightData[index * 4] / 255;
        
        let pixelColor;
        if(elevation >= specs.waterLevel){
          let ratio = lineStep(elevation, specs.waterLevel, 1.0);
          pixelColor = this.getLandColor(ratio);
        }else{
          let ratio = lineStep(elevation, 0.0, specs.waterLevel); 
          
          pixelColor = this.getWaterColor(ratio, 0);
          if(!this.floorWater) pixelColor = mixColor(lightMap.colors[0], pixelColor, clamp(specs.waterLevel - elevation, 0.0, 0.8) * specs.waterBlocking);     
          
        }
        
        data[index * 4] = pixelColor.r * 255;
        data[index * 4 + 1] = pixelColor.g * 255;
        data[index * 4 + 2] = pixelColor.b * 255;
        data[index * 4 + 3] = 255;
        index++;
      }
      if(this.doPreview()) this.ctx.putImageData(imageData, 0, 0);
      await frameDelay();
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    
    updateOutputCanvas();
    
    this.endedGenerating();    
  }
};