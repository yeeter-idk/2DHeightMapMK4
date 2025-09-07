function frameDelay() {
  return new Promise(resolve => {
    window.requestAnimationFrame(resolve);
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function mix(value1, value2, bias) {
  return value1 * bias + value2 * (1 - bias);
}

function mixColor(color1, color2, bias) {
  return color(
    mix(color1.r, color2.r, bias),
    mix(color1.g, color2.g, bias),
    mix(color1.b, color2.b, bias)
  );
}

function vec2(x, y) {
  return {x, y};
}

function vec3(x, y, z) {
  return {x, y, z};
}
function normalize3(vec) {
  let magnitude = Math.hypot(vec.x, vec.y, vec.z);
  return vec3(vec.x / magnitude, vec.y / magnitude, vec.z / magnitude);
}

function color(r, g, b) {
  return {r, g, b}
}

function lineStep(value, floor, ceiling) {
  return (value - floor) / (ceiling - floor);
}

function getElem(id) {
  return document.getElementById(id);
}

function BUILDINPUTRANGE(elem) {
  let specifications = elem.innerText.split(" ");
  elem.innerText = "";
  
  let keys = [];
  for(let pairs of specifications){
    keys.push(pairs.split("=")[0]);
  }
  
  let inputElem = document.createElement("input");
  for(let key of keys){
    inputElem[key] = getValOf(key);
  }
  
  let labelElem = document.createElement("span");
  labelElem.classList.add("INPUTRANGEDISPLAY");
  let inputFunc = ()=>{
    labelElem.innerText = inputElem.value;
  };
  inputFunc();
  inputElem.addEventListener("input", inputFunc);
  
  elem.appendChild(inputElem);
  elem.appendChild(labelElem);
  
  console.log("id of input: " + getValOf("id"));
  
  function getValOf(property) {
    for(let spec of specifications){
      let parts = spec.split("=");
      if(parts[0] == property){
        if(isNaN(+parts[1])){
          return parts[1];
        }else{
          return parseFloat(parts[1]);
        }
      }
    }
  }
}

function download(canv, data) {
  return new Promise((resolve, reject) => {
    canv.toBlob(function(blob) {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `2DTerrainMK4_(${data})_${canv.width}x${canv.height}_${Math.floor(Math.random() * 1000)}.png`;
       
      document.body.appendChild(link);
      link.click();

      URL.revokeObjectURL(url);
      link.remove();

      resolve();
    }, 'image/png');
  });
}
