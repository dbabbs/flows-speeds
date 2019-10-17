import { center, hereCredentials } from "./config.js";
import MapRotation from './MapRotation.js';
import { formatTime, $, $$ } from './helpers.js';

const STATE = {
   type: 'flows',
   rotating: false,
   animationStarted: false,
   z: 1
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
   $('.time').innerHTML = `
   <span class="hour">${formatTime(value).time}</span>
   <span class="half">${formatTime(value).half}</span>`
   
   const dataStyle = dataLayer.getProvider().getStyle();
   dataStyle.setProperty("global.type", STATE.type)
   dataStyle.setProperty("global.value", value)

   dataStyle.setProperty("layers.xyz.lines.draw.lines.color", function() {
      const v = feature[`properties.${global.type}.${global.value}`];
      const color = global.type === 'speeds' ? v * 4 : v * 60 + 200;
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
   // dataStyle.setProperty("layers.xyz", {
   //    top: {
   //       filter: {
   //          '$zoom': {
   //             max: 15
   //          }
   //       },
   //       draw: {
   //          lines: {
   //             width: 16
   //          }
   //       }
   //    },
   //    bottom: {
   //       filter: {
   //          '$zoom': {
   //             min: 15
   //          }
   //       },
   //       draw: {
   //          lines: {
   //             width: 16
   //          }
   //       }
   //    }
   // });

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

function plot() {
   $('.type').innerText = STATE.type.substring(0, 1).toUpperCase() + STATE.type.substring(1, STATE.type.length);
   setStyle(0);
}
plot();

const STEP = 2000;
document.body.onkeydown = ({code}) => {   
   if (code === 'Space' && !STATE.animationStarted) {
      startAnimation();
      STATE.animationStarted = true;
   } else if (code === 'ArrowRight' || code === 'ArrowLeft') {
      rotate(code);
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
      setStyle(STATE.z)
      STATE.z++;
   }, STEP)
   $('.progress-fill').classList.add('progress');
}


map.addEventListener('mapviewchangestart', () => {
   // console.log('loading..');
   // $('.loading-outer-container').style.opacity = 1;
});
   
map.addEventListener('mapviewchangeend', () => {
   $('.loading-outer-container').style.opacity = 0;
   console.log(
      map.getViewModel().getLookAtData()
   )
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
