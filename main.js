/*

specs.width
specs.height
specs.ppf — pixels per frame

terrainMap.generate();

heightMap.generate();

lightMap.generate();

*/

let canvas = getElem("canvas");
let ctx = canvas.getContext("2d", {willReadFrequently: true});

let specs = {
  width: 600,
  height: 600,
  ppf: 1000, // pixels per frame
  elevationScale: 200,
  waterLevel: 0.7,
  waterBlocking: 2,
  previewRate: 10
};

function updateSpecs() {
  specs.waterLevel = parseFloat(getElem("waterLevel").value);
  specs.width = parseFloat(getElem("mapWidth").value);
  specs.height = parseFloat(getElem("mapHeight").value);
  specs.waterBlocking = parseFloat(getElem("waterBlocking").value);    
  
  if(specs.width != canvas.width || specs.height != canvas.height){
    canvas.width = specs.width;
    canvas.height = specs.height;
    specs.elevationScale = specs.width;
  }
  
  terrainMap.setup();
  heightMap.setup();
  lightMap.setup();
}

setup();
function setup() {
  let inputsToBuild = document.getElementsByClassName("INPUTRANGE");
  
  for(let elem of inputsToBuild) BUILDINPUTRANGE(elem);
  
  terrainMap.initialize();
  heightMap.initialize();
  lightMap.initialize();
  
  canvas.width = specs.width;
  canvas.height = specs.height;
}

function updateOutputCanvas() {
  ctx.drawImage(terrainMap.canvas, 0, 0);
  //ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.2;
  ctx.drawImage(lightMap.canvas, 0, 0);
  ctx.globalAlpha = 1;
  //ctx.globalCompositeOperation = "source-over";
}
  
async function runPresets() {
  if(false){
    await heightMap.generate();
    await terrainMap.generate();
    await lightMap.generate();
    download(canvas, "Composite");
  }else if(true){
    let stepSize = 2;
    
    var gif = new GIF({
      workers: 2,
      quality: 10
    });
    
    for(let i = 0; i < 360 / stepSize; i++){
      await lightMap.generate();
      getElem("lightAngle").value = Math.floor(parseInt(getElem("lightAngle").value) + stepSize) % 360;

      gif.addFrame(canvas, {copy: true, delay: 200});      
    }
    
    gif.on('finished', function(blob) {
      alert("finished rednering")
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = "my-animation.gif";
      a.click();
    });

    
    alert("done the animation")
    gif.render();
    
  }else{
    let stepSize = 2;
    for(let i = 0; i < 360 / stepSize; i++){
      await heightMap.generate();
      await terrainMap.generate();
      await lightMap.generate();
      
      getElem("lightAngle").value = Math.floor(parseInt(getElem("lightAngle").value) + stepSize) % 360;
    }
  }
}
