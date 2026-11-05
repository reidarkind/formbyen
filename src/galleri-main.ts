import { galleriKort } from "./grafikk/galleri";
import "./style.css";

const rot = document.querySelector("#galleri");
if (!rot) throw new Error("mangler galleri");

rot.innerHTML = galleriKort()
  .map(
    (kort) =>
      `<article class="kort"><h2>${kort.tittel}${kort.referanse ? " · referanse" : ""}</h2>${kort.svg}</article>`,
  )
  .join("");
