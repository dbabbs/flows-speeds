import { center, hereCredentials } from "./config.js";
import MapRotation from './MapRotation.js';
import { formatTime, $, $$} from './helpers.js';

const STATE = {
   type: 'flows',
   rotating: false,
   animationStarted: false,
   z: 0
}
const max = { speeds: 31.9444, flows: 13.3933 }

const hsl = h => h <= 360 ? `hsl(${h}, 100%, 44%)` : `hsl(${h}, 100%, 44%)`;

const colorRanges = {
   speeds: {
      start: 0,
      end: max.speeds * 4
   }, 
   flows: {
      start: 200,
      end: max.flows * 60 + 200
   }
}
const colors = {
   speeds: [
      hsl(colorRanges.speeds.start), hsl(colorRanges.speeds.end)
   ],
   flows: [
      hsl(colorRanges.flows.start), hsl(colorRanges.flows.end)
   ]
}

function calculateGradient(type) {
   const keyColors = [];
   const steps = 5;
   const hslMin = colorRanges[type].start;
   const hslMax = (colorRanges[type].end) > 360 ? 360 : (colorRanges[type].end);
   // console.log(hslMax);
   // const diff = hslMax - hslMin;
   // console.log(diff);
   // for (let i = 0; i < steps + 1; i++) {
   //    keyColors.push(
   //      hsl(( diff / steps) * i + hslMin)
   //    )
   // }
   // console.log(keyColors);

   // const squares = keyColors.map(x => `<div class="legend-square" style="background: ${x}"></div>`).join('');
   // console.log(squares);
   // document.querySelector('.color-legend').innerHTML = squares;
   const gradient = `linear-gradient(
      to right, 
      ${hsl(hslMin)}, 
      ${hsl((hslMax - hslMin) / 2 + hslMin)}, 
      ${hsl(hslMax)}
   )`;
   
   return gradient;
}


setTimeout(() => {
   $('.info').style.opacity = 0;
}, 5000)

const platform = new H.service.Platform({ apikey: hereCredentials.apikey });
const defaultLayers = platform.createDefaultLayers();
const map = new H.Map(
   document.querySelector(".map"),
   defaultLayers.vector.normal.map,
   {
      center,
      zoom: center.zoom,
      pixelRatio: window.devicePixelRatio || 1
   }
);

if (center.tilting) {
   map.getViewModel().setLookAtData({
      tilt: center.tilt,
      heading: center.heading
   }, true);
}

window.addEventListener('resize', () => map.getViewPort().resize());
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
const provider = map.getBaseLayer().getProvider();

const style = new H.map.Style("./scene.yaml");
provider.setStyle(style);

const service = platform.getXYZService({ token: "ASCBZnCcvEMa-vbk9JXixN8" });
const dataProvider = new H.service.xyz.Provider(service, 'ls1DGmar');
const dataLayer = new H.map.layer.TileLayer(dataProvider);
map.addLayer(dataLayer);

function setStyle(value) {
   console.log(value);
   $('.time').innerHTML = `
   <span class="hour">${formatTime(value).time}</span>
   <span class="half">${formatTime(value).half}</span>`
   
   const dataStyle = dataLayer.getProvider().getStyle();
   dataStyle.setProperty("global.type", STATE.type)
   dataStyle.setProperty("global.value", value)

   dataStyle.setProperty("layers.xyz.lines.draw.lines.color", function() {
      const v = feature[`properties.${global.type}.${global.value}`];
      let color = global.type === 'speeds' ? v * 4 : v * 60 + 200;
      if (color > 360) {
         color = 360;
      }
      
      return `hsl(${color}%, 100%, 44%)`
   });

   //This is for larger, zoomed out
   // dataStyle.setProperty("layers.xyz.lines.draw.lines.width", function() {
   //    const multiplier = global.type === 'speeds' ? 3 : 4; //6;
   //    if (global.type === 'speeds') {
   //       return "4"
   //    }
   //    return feature[`properties.speeds.${global.value}`] * multiplier;
   // });

   //this is for close ups
   dataStyle.setProperty("layers.xyz.lines.draw.lines.width", "16");

   dataStyle.setProperty("layers.xyz.lines.draw.lines.order", function() {
      return feature[`properties.speeds.${global.value}`];
   });
}

const changeListener = () => {
   if (style.getState() === H.map.Style.State.READY) {
      style.removeEventListener('change', changeListener);
      const buildings = new H.map.Style(style.extractConfig('buildings'));
      const buildingsLayer = platform.getOMVService().createLayer(buildings);
      map.addLayer(buildingsLayer);
      const neighborhoodLabels = new H.map.Style(style.extractConfig('places'));
      // const neighborhoodLabelsLayer = platform.getOMVService().createLayer(neighborhoodLabels);
      // map.addLayer(neighborhoodLabelsLayer);
   }
}
style.addEventListener('change', changeListener);


$('.type').onclick = () => {
   STATE.type = STATE.type === 'speeds' ? 'flows' : 'speeds';
   plot();
}

function plot(ind) {
   document.querySelector('.legend-min').innerText = 0;
   document.querySelector('.legend-max').innerText = Math.round(10 * max[STATE.type]) / 10;
   document.querySelector('.color-legend').style.background = calculateGradient(STATE.type)
   $('.type').innerText = ' / ' + STATE.type.substring(0, 1).toUpperCase() + STATE.type.substring(1, STATE.type.length);
   setStyle(STATE.z);
}
plot();

const STEP = 2000;
document.body.onkeydown = ({code}) => {   
   if (code === 'Space' && !STATE.animationStarted) {
      startAnimation();
      STATE.animationStarted = true;
   } else if (code === 'ArrowRight' || code === 'ArrowLeft') {
      rotate(code);
   } else if (code === 'KeyD') {
      drive('101')
   }
}


function startAnimation() {
   const transitionSetting = `${24 * (STEP / 1000)}s all linear`;
   $('.progress-fill').style.transition = transitionSetting;
   $('.progress-fill').style.webkitAnimationPlayState = "running";
   // setStyle(0)
   setInterval(() => {
      if (STATE.z === 24) {
         STATE.z = 0;
      }
      STATE.z++;
      setStyle(STATE.z)
      
   }, STEP)
   $('.progress-fill').classList.add('progress');
}


map.addEventListener('mapviewchangestart', () => {
   // console.log('loading..');
   // $('.loading-outer-container').style.opacity = 1;
});
   
map.addEventListener('mapviewchangeend', () => {
   $('.loading-outer-container').style.opacity = 0;   
});

const rotation = new MapRotation(map);
function rotate(code) {
   STATE.rotating = !STATE.rotating;
   if (STATE.rotating) {
      rotation.start(code);
   } else {
      rotation.stop();
   }
}





async function drive(file) {
   let route = await fetch(`./resources/${file}.json`)
                  .then(res => res.json())
                  .then(res => res.map(x => [x[1], x[0]]));

   const extended = [];

   for (let i = 0; i < route.length - 1; i++) {

      const distance = turf.distance(
         [route[i][1], route[i][0]],
         [route[i+1][1], route[i+1][0]],
         {units: 'kilometers'}
      )
      // console.log(distance);
      const constant = 0.1


      const times =  distance * constant * 10;
      for (let x = 1; x < 10; x++) {

         
         
         


         const lat = lerp(route[i][0], route[i+1][0], x * .1)
         const lng = lerp(route[i][1], route[i+1][1], x * .1)
         extended.push([lat, lng]);

         // map.addObject(new H.map.Circle(
         //    { lat, lng },
         //    // The radius of the circle in meters
         //    1,
         //    {
         //      style: {
         //        strokeColor: 'white', // Color of the perimeter
         //        lineWidth: 2,
         //        fillColor: 'white'  // Color of the circle
         //      }
         //    }
         //  ));
      }
   }

   let v = 0; 

   route = extended;

   map.getEngine().setAnimationDuration(800)
   let interval = setInterval(() => {
      if (v === route.length) {
         clearInterval(interval);
      }
      v++;

      const heading = turf.bearing(
         [route[v][1], route[v][0]],
         [route[v + 10][1], route[v + 10][0]],
      )

      map.getViewModel().setLookAtData({
         tilt: 50,
         heading: heading - 180,
         position: { lat: route[v][0], lng: route[v][1]},
         zoom: map.getZoom()
      }, true);
      
   }, 100)
}

function lerp(v0, v1, t) {
   return v0*(1-t)+v1*t
}

const files = ['101', 'sf'];
