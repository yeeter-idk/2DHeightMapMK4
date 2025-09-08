let heightMap = {
  canvas: "error",
  ctx: "error",
  btnElement: "error",
  generating: false,
  blurKernelSize: 11,
  noiseScale: 1,
  islandness: 0.5,
  flipValues: false,
  heightData: "error",
  heightDataFactor: 0,
  previewCount: 0,
  initialize: function() {
    this.canvas = getElem("height");
    this.ctx = this.canvas.getContext("2d", {willReadFrequently: true});
    this.btnElement = getElem("heightBtn");
    this.heightData = new Uint16Array(0);
    this.heightDataFactor = 2 ** 16 - 1;
    
    this.setup();
  },
  setup: function() {
    if(this.canvas.width != specs.width || this.canvas.height != specs.height){
      this.canvas.width = specs.width;
      this.canvas.height = specs.height;
      this.heightData = new Uint16Array(specs.width * specs.height);
    }
    this.noiseScale = parseFloat(getElem("heightScale").value);
    this.blurKernelSize = parseFloat(getElem("heightBlurKernelSize").value);
    this.islandness = parseFloat(getElem("heightIslandness").value);
    this.flipValues = getElem("heightFlipValues").checked;
    
  },
  doPreview: function() {
    this.previewCount++;    
    if(this.previewCount >= specs.previewRate){
      this.previewCount = 0;
      return true;
    }    
    return false;
  },
  pasteLayer: async function(width, height, strength) {
    width *= this.noiseScale;
    height *= this.noiseScale;
  
    this.ctx.globalAlpha = strength;
    this.ctx.globalCompositeOperation = "lighten";

    let nWidth = 0, nHeight = 0; // n = noise
    if(specs.width > specs.height){
      let ratio = specs.width / specs.height;
      nWidth = width * ratio;
      nHeight = height;
    }else{
      let ratio = specs.height / specs.width;
      nWidth = width;
      nHeight = height * ratio;
    }
    nWidth = Math.ceil(nWidth);
    nHeight = Math.ceil(nHeight);
    
    let cellWidth = specs.width / nWidth;
    let cellHeight = specs.height / nHeight;
    let dx = cellWidth * Math.random();
    let dy = cellHeight * Math.random();
     
    await noise.generateNoise(nWidth+1, nHeight+1);
    this.ctx.drawImage(noise.canvas, -dx, -dy, specs.width + cellWidth, specs.height + cellHeight);
    
    /*await voronoiNoise.generateNoise(specs.width, specs.height, nWidth);
    this.ctx.drawImage(voronoiNoise.canvas, -dx, -dy, specs.width + cellWidth, specs.height + cellHeight);*/

    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = "source-over";
  },
  generateNoiseMap: async function(a1, d) {
    let data = [];
    let sumStrength = 0;
    
    let layers = 10;
    
    for(let i = 0; i < layers; i++){
      let size = a1 + d * i;
      let strength = layers - i;
      sumStrength += strength;
      data.push({size, strength});
    }
    for(let {size, strength} of data){
      await this.pasteLayer(size, size, strength / sumStrength);
    }
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
    
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, specs.width, specs.height);
    
    await this.generateNoiseMap(8, 3);
    
    let kernel = this.createBlurKernel();
    
    let pixels = specs.width * specs.height;
    
    let inpData = this.ctx.getImageData(0, 0, specs.width, specs.height).data;
    
    //let imageData = new ImageData(specs.width, specs.height);
    let imageData = this.ctx.getImageData(0, 0, specs.width, specs.height);
    let data = imageData.data;
    
    let maxPixelData = 0;
    let minPixelData = 1000;
    
    let index = 0;
    while(index < pixels){
      for(let j = 0; j < specs.ppf && index < pixels; j++){
        let value = inpData[index * 4];
        maxPixelData = Math.max(value, maxPixelData);
        minPixelData = Math.min(value, minPixelData);
    
        index++;
      }
      await frameDelay();
    }  
    
    index = 0;
    while(index < pixels){
      for(let j = 0; j < specs.ppf && index < pixels; j++){
        let x = index % specs.width;
        let y = Math.floor(index / specs.width);
        
        let pixelValue = 0;
        
        
        let sum = 0;        
        for(let sample of kernel){
          let px = x + sample.x;
          let py = y + sample.y;
          if(px < 0 || px >= specs.width || py < 0 || py >= specs.height) continue;
          
          let value = lineStep(
            inpData[(px + py * specs.width) * 4],
            minPixelData,
            maxPixelData
          ) * 255;          
          pixelValue += value * sample.strength;          
          sum += sample.strength;
        }
        pixelValue /= sum;
        
        
        let islandScore = Math.sin((x / specs.width) * Math.PI);
        islandScore += Math.sin((y / specs.height) * Math.PI);
        islandScore /= 2;
        
        pixelValue = mix(islandScore * 255, pixelValue, this.islandness);
        
        
        if(this.flipValues) pixelValue = 255 - pixelValue;
        
        let uInt16 = Math.floor(pixelValue/255 * this.heightDataFactor);
        
        this.heightData[index] = uInt16;
        
        data[index * 4] = pixelValue;
        data[index * 4 + 1] = pixelValue;
        data[index * 4 + 2] = pixelValue;
        data[index * 4 + 3] = 255;
        
        index++;
      }
      
      if(this.doPreview()) this.ctx.putImageData(imageData, 0, 0);
      await frameDelay();
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    
    this.endedGenerating();    
  },
  createBlurKernel: function() {
    let kernelRad = (this.blurKernelSize - 1) / 2;
    let samples = [];
    
    for(let x = -kernelRad; x <= kernelRad; x++){
      for(let y = -kernelRad; y <= kernelRad; y++){
        let dist = Math.hypot(x, y);
        if(dist > kernelRad) continue;
        let strength = Math.cos((dist / kernelRad) * Math.PI / 2);
        if(kernelRad == 0) strength = 1;
        samples.push({x, y, strength});
      }
    }
    
    return samples;
  }
};