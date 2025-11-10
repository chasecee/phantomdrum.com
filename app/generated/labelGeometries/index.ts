import * as ghostGrade from "./ghost-grade";
import * as farmFresh from "./farm-fresh";
import * as abstractYetFamiliar from "./abstract-yet-familiar";
import * as classicSundayDinner from "./classic-sunday-dinner";
import * as bigOlBeats from "./big-ol-beats";
import * as drums from "./drums";
import * as synths from "./synths";
import * as samples from "./samples";
import * as fx from "./fx";
import * as loops from "./loops";
import * as textures from "./textures";
import * as atmos from "./atmos";

export const labelGeometries = {
  "ghost-grade": { positions: ghostGrade.positions, uvs: ghostGrade.uvs, indices: ghostGrade.indices, width: ghostGrade.width, height: ghostGrade.height },
  "farm-fresh": { positions: farmFresh.positions, uvs: farmFresh.uvs, indices: farmFresh.indices, width: farmFresh.width, height: farmFresh.height },
  "abstract-yet-familiar": { positions: abstractYetFamiliar.positions, uvs: abstractYetFamiliar.uvs, indices: abstractYetFamiliar.indices, width: abstractYetFamiliar.width, height: abstractYetFamiliar.height },
  "classic-sunday-dinner": { positions: classicSundayDinner.positions, uvs: classicSundayDinner.uvs, indices: classicSundayDinner.indices, width: classicSundayDinner.width, height: classicSundayDinner.height },
  "big-ol-beats": { positions: bigOlBeats.positions, uvs: bigOlBeats.uvs, indices: bigOlBeats.indices, width: bigOlBeats.width, height: bigOlBeats.height },
  "drums": { positions: drums.positions, uvs: drums.uvs, indices: drums.indices, width: drums.width, height: drums.height },
  "synths": { positions: synths.positions, uvs: synths.uvs, indices: synths.indices, width: synths.width, height: synths.height },
  "samples": { positions: samples.positions, uvs: samples.uvs, indices: samples.indices, width: samples.width, height: samples.height },
  "fx": { positions: fx.positions, uvs: fx.uvs, indices: fx.indices, width: fx.width, height: fx.height },
  "loops": { positions: loops.positions, uvs: loops.uvs, indices: loops.indices, width: loops.width, height: loops.height },
  "textures": { positions: textures.positions, uvs: textures.uvs, indices: textures.indices, width: textures.width, height: textures.height },
  "atmos": { positions: atmos.positions, uvs: atmos.uvs, indices: atmos.indices, width: atmos.width, height: atmos.height }
};

export default labelGeometries;
