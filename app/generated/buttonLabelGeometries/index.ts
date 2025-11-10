import * as spotify from "./spotify";
import * as appleMusic from "./apple-music";

export const buttonLabelGeometries = {
  "spotify": { positions: spotify.positions, uvs: spotify.uvs, indices: spotify.indices, width: spotify.width, height: spotify.height },
  "apple-music": { positions: appleMusic.positions, uvs: appleMusic.uvs, indices: appleMusic.indices, width: appleMusic.width, height: appleMusic.height }
};

export default buttonLabelGeometries;
