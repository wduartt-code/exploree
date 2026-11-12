// Distância e tempo de carro (OSRM/OpenStreetMap) de cada ponto turístico até cada empreendimento.
// Gera dist/drive.json. Uso: node tools/drive-matrix.mjs  (rodar de novo ao mudar coordenadas)
import {writeFileSync} from 'node:fs';
import {buildings,places} from '../dist/data.js';
const pts=[...places,...buildings],c=pts.map(p=>p.coords.join(',')).join(';');
const src=places.map((_,i)=>i).join(';'),dst=buildings.map((_,i)=>places.length+i).join(';');
const r=await (await fetch(`https://router.project-osrm.org/table/v1/driving/${c}?sources=${src}&destinations=${dst}&annotations=distance,duration`)).json();
if(r.code!=='Ok')throw new Error(JSON.stringify(r));
const out={};places.forEach((p,i)=>{out[p.id]={};buildings.forEach((b,j)=>out[p.id][b.id]=[Math.round(r.distances[i][j]),Math.round(r.durations[i][j])]);});
writeFileSync(new URL('../dist/drive.json',import.meta.url),JSON.stringify(out));console.log(JSON.stringify(out));
