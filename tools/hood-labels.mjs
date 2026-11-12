// Posição do nome de cada bairro: centralizado na área, na horizontal e na vertical.
// Começa no ponto mais folgado (polo de inacessibilidade, com o espaço horizontal pesando menos porque o nome é largo)
// e então centraliza: x = meio da faixa horizontal que passa pelo ponto; y = meio da faixa vertical; repete até estabilizar.
// Bairros com posição definida pelo usuário ficam em scene.hoodLabelFixed[nome].
// Uso: node tools/hood-labels.mjs
import {readFileSync,writeFileSync} from 'node:fs';
const f=new URL('../dist/renders/scenes.json',import.meta.url),S=JSON.parse(readFileSync(f,'utf8'));
const fillPoly=(poly,W,H)=>{const o=new Uint8Array(W*H),ys=poly.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<=Math.min(H-1,Math.ceil(Math.max(...ys)));y++){const xs=[];for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(W-1,Math.floor(xs[k+1]-.5));x++)o[y*W+x]=1;}return o;};
const AX=.3; // custo de um passo horizontal no polo (vertical = 1)
export function labelPoint(m,W,H){
 const d=new Float32Array(W*H);for(let i=0;i<W*H;i++)d[i]=m[i]?1e9:0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!d[i])continue;let v=d[i];v=Math.min(v,x>0?d[i-1]+AX:AX,y>0?d[i-W]+1:1);d[i]=v;}
 for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;if(!d[i])continue;let v=d[i];v=Math.min(v,x<W-1?d[i+1]+AX:AX,y<H-1?d[i+W]+1:1);d[i]=v;}
 let b=0;for(let i=0;i<W*H;i++)if(d[i]>d[b])b=i;let x=b%W,y=b/W|0;
 const inM=(X,Y)=>X>=0&&Y>=0&&X<W&&Y<H&&m[Y*W+X];
 for(let k=0;k<12;k++){let l=x,r=x;while(inM(l-1,y))l--;while(inM(r+1,y))r++;const nx=Math.round((l+r)/2);
  let t=y,bt=y;while(inM(nx,t-1))t--;while(inM(nx,bt+1))bt++;const ny=Math.round((t+bt)/2);
  if(!inM(nx,ny))break;if(nx===x&&ny===y)break;x=nx;y=ny;}
 return [x+.5,y+.5];}
for(const [id,sc] of Object.entries(S.scenes)){if(!sc.hoods)continue;const W=sc.width,H=sc.height,fixed=sc.hoodLabelFixed||{};
 for(const h of sc.hoods){if(h.part){delete h.label;continue;}if(fixed[h.name]){h.label=fixed[h.name];continue;}
  const [x,y]=labelPoint(fillPoly(h.area.map(([x,y])=>[x*W,y*H]),W,H),W,H);h.label=[+(x/W).toFixed(4),+(y/H).toFixed(4)];}
 console.log(id,sc.hoods.filter(h=>h.label).map(h=>h.name+' '+h.label).join(' | '));}
writeFileSync(f,JSON.stringify(S,null,2));
