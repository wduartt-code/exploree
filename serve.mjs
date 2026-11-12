// Servidor estático sem dependências: node serve.mjs [porta]
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=+process.argv[2]||4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.txt':'text/plain'};
createServer(async(req,res)=>{
 try{
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname);
  if(p.endsWith('/'))p+='index.html';
  const f=normalize(join(root,p));
  if(!f.startsWith(root)){res.writeHead(403).end();return;}
  const d=await readFile(f);res.writeHead(200,{'Content-Type':types[extname(f).toLowerCase()]||'application/octet-stream'}).end(d);
 }catch{res.writeHead(404).end('404');}
}).listen(port,'127.0.0.1',()=>console.log(`Itapema Vista em http://127.0.0.1:${port}  (Ctrl+C para parar)`));
