// Gera os renders aéreos (dia e noite) de cada cena e o arquivo dist/renders/scenes.json com a posição
// dos pinos. Abre dist/render.html no Google Chrome sem interface, pelo protocolo DevTools.
// Uso: npm run render            (todas as cenas)
//      npm run render -- itapema (só uma cena)
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {scenes} from '../dist/data.js';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','dist');
const out=join(root,'renders');
const CHROME=process.env.CHROME||['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
const WIDTH=1920,HEIGHT=1080,SCALE=2; // imagem final 3840×2160 e versão leve 1920×1080
const only=process.argv.slice(2);
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};

const server=createServer(async(req,res)=>{try{const path=join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!path.startsWith(root))throw 0;const body=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;

if(!CHROME){console.error('Google Chrome não encontrado. Defina CHROME=/caminho/do/chrome.');process.exit(1);}
const port=9300+Math.floor(Math.random()*500);
const chrome=spawn(CHROME,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${join(tmpdir(),'itapema-render-'+port)}`,'--ignore-gpu-blocklist','--enable-webgl','--hide-scrollbars','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore'});
const cleanup=()=>{chrome.kill();server.close();};
process.on('exit',cleanup);

async function json(path,method='GET'){for(let i=0;i<60;i++){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,{method});if(r.ok)return r.json();}catch{}await new Promise(r=>setTimeout(r,250));}throw Error('Chrome não respondeu');}
const target=await json('/json/new?about:blank','PUT');
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let seq=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const {r,j}=pending.get(m.id);pending.delete(m.id);m.error?j(Error(m.error.message)):r(m.result);}};
const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,{r,j});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expr=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result.value;

await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:WIDTH,height:HEIGHT,deviceScaleFactor:SCALE,mobile:false});
await mkdir(out,{recursive:true});
const manifestPath=join(out,'scenes.json');
const manifest=existsSync(manifestPath)?JSON.parse(await readFile(manifestPath,'utf8')):{scenes:{}};

for(const scene of scenes.filter(s=>!only.length||only.includes(s.id))){
 for(const night of [false,true]){
  const variant=night?'night':'day';
  process.stdout.write(`${scene.id} · ${variant}… `);
  await send('Page.navigate',{url:`${base}/render.html?scene=${scene.id}${night?'&night=1':''}`});
  let ready=false;
  for(let i=0;i<240&&!ready;i++){await new Promise(r=>setTimeout(r,500));ready=await evaluate("document.title==='ready'").catch(()=>false);}
  if(!ready)throw Error(`A cena ${scene.id} não terminou de carregar (internet ou WebGL).`);
  const data=await evaluate('window.__render');
  for(const [suffix,scale] of [['',1],['-sm',.5]]){
   const shot=await send('Page.captureScreenshot',{format:'webp',quality:88,clip:{x:0,y:0,width:WIDTH,height:HEIGHT,scale}});
   await writeFile(join(out,`${scene.id}-${variant}${suffix}.webp`),Buffer.from(shot.data,'base64'));
  }
  const {night:_,...hotspots}=data;
  manifest.scenes[scene.id]={...hotspots,images:{day:`renders/${scene.id}-day.webp`,night:`renders/${scene.id}-night.webp`,daySm:`renders/${scene.id}-day-sm.webp`,nightSm:`renders/${scene.id}-night-sm.webp`}};
  console.log('ok');
 }
}
manifest.generated=new Date().toISOString();
await writeFile(manifestPath,JSON.stringify(manifest,null,1));
console.log(`Renders salvos em ${out}`);
ws.close();cleanup();process.exit(0);
