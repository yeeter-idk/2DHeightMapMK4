
async function maxContrastFilter(canv) {
  let tCtx = canv.getContext("2d");
  
  let imageData = tCtx.getImageData(0, 0, canv.width, canv.height);
  let data = imageData.data;
  
  let pixels = canv.width * canv.height;
  
  let highestValue = 0;
  let lowestValue = 1000;
  
  let index = 0;
  while(index < pixels){
    for(let j = 0; j < specs.ppf && index < pixels; j++){
      let value = data[index * 4];
      highestValue = Math.max(highestValue, value);
      lowestValue = Math.min(lowestValue, value);      
      index++;
    }    
    await frameDelay();
  }
  
  index = 0;
  while(index < pixels){
    for(let j = 0; j < specs.ppf && index < pixels; j++){
      let value = data[index * 4];
      let output = lineStep(value, lowestValue, highestValue) * 255;
      
      data[index * 4] = data[index * 4 + 1] = data[index * 4 + 2] = output;
      
      index++;
    }    
    await frameDelay();
  }
  
  tCtx.putImageData(imageData, 0, 0);
}