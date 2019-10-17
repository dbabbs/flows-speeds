class MapRotation {
   constructor(map) {
      this.map = map;
      this.interval;
   }

   start(code) {
      const direction = code === 'ArrowLeft' ? 0.015 : -0.015
      this.map.getViewModel().setLookAtData({
         tilt: this.map.getViewModel().getLookAtData().tilt,
         heading: this.map.getViewModel().getLookAtData().heading += direction
      }, true);

      setTimeout(() => {
         this.interval = setInterval(() => {
            this.map.getViewModel().setLookAtData({
               tilt: this.map.getViewModel().getLookAtData().tilt,
               heading: this.map.getViewModel().getLookAtData().heading += direction
            });
         }, 10)
      }, 300)
   }

   stop() {
      clearInterval(this.interval);
      // this.map.getViewModel().setLookAtData({
      //    tilt: 0,
      //    heading: 180
      // }, true);
   }
}

export default MapRotation;