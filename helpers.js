function formatTime(v) {
   if (v === 0) {
      return {time: "12:00", half: "am" }
   } else if (v < 12) {
      return {time: `${v}:00`, half: "am"}
   } else if (v === 12) {
      return {time: `12:00`, half: "pm"}
   } else {
      return {time: `${v - 12}:00`, half: "pm" }
   }
}

const $ = q => document.querySelector(q);
const $$ = q => document.querySelector(qq);

export { formatTime, $, $$ }