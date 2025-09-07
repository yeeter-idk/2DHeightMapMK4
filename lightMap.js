let lightMap = {
  canvas: "error",
  ctx: "error",
  floorWater: true,
  sunVec: normalize3(vec3(-1, -1, 0.3)),
  lightAngle: 0,
  lightPitch: 1,
  colors: [
    color(0, 0, 0.3333),
    color(1, 1, 0.7333)
  ],
  previewCount: 0,
  initialize: function() {
    this.canvas = getElem("light");
    this.ctx = this.canvas.getContext("2d", {willReadFrequently: true});
    
    this.setup();
  },
  setup: function() {
    if(this.canvas.width != specs.width || this.canvas.height != specs.height){
      this.canvas.width = specs.width;
      this.canvas.height = specs.height;
    }
    
    this.lightAngle = parseFloat(getElem("lightAngle").value) * (Math.PI / 180);
    
    this.lightPitch = parseFloat(getElem("lightPitch").value);
    
    this.sunVec = normalize3(vec3(Math.cos(this.lightAngle), Math.sin(this.lightAngle), this.lightPitch));
    
    this.floorWater = getElem("lightFloorAtWater").checked;
    
  },
  generate: async function() {
    updateSpecs();
    
    let heightData = heightMap.heightData;
    
    let pixels = specs.width * specs.height;
    
    //let imageData = new ImageData(specs.width, specs.height);
    let imageData = this.ctx.getImageData(0, 0, specs.width, specs.height);
    let data = imageData.data;
    
    let index = 0;
    while(index < pixels){
      for(let j = 0; j < specs.ppf && index < pixels; j++){
        let x = index % specs.width;
        let y = Math.floor(index / specs.width);
        
        let elevation = heightData[index] / heightMap.heightDataFactor;                 
        if(this.floorWater) elevation = Math.max(elevation, specs.waterLevel);       
        elevation *= specs.elevationScale;
        
        let pos = vec3(x, y, elevation);
        let shaded = false;  
        while(true){
          pos.x += this.sunVec.x;
          pos.y += this.sunVec.y;
          pos.z += this.sunVec.z;
          if(!this.bounded(pos)) break;
          
          let posIndex = Math.floor(pos.x) + Math.floor(pos.y) * specs.width;
          let posElev = heightData[posIndex] / heightMap.heightDataFactor * specs.elevationScale;
          
          if(posElev > pos.z){
            shaded = true;
            break;
          }
        }
        
        let pixelColor;
        if(shaded){
          pixelColor = this.colors[0];
        }else{
          pixelColor = this.colors[1];
        }
        
        pixelColor = mixColor(this.colors[0], pixelColor, clamp(specs.waterLevel - elevation / specs.elevationScale, 0.0, 0.8) * specs.waterBlocking);     
                  
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
  },
  bounded: function(vec) {
    if(vec.x < 0 || vec.x >= specs.width || vec.y < 0 || vec.y >= specs.height || vec.z >= specs.elevationScale) return false;
    return true;
  },
  doPreview: function() {
    this.previewCount++;    
    if(this.previewCount >= specs.previewRate){
      this.previewCount = 0;
      return true;
    }    
    return false;
  }
};