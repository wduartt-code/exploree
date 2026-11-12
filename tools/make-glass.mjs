// Gera as cópias desfocadas usadas como "vidro" dos marcadores (antes geradas no navegador a cada cena).
// renders/premium/<cena>-<dia|noite>-sm.webp → renders/premium/<cena>-<dia|noite>-glass.jpg (640px, blur ~ 18px de tela, saturação 1.2)
// Uso: node tools/make-glass.mjs   (requer ffmpeg no PATH)
import {execFileSync} from 'node:child_process';import {readdirSync} from 'node:fs';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('../dist/renders/premium/',import.meta.url));
for(const f of readdirSync(dir).filter(f=>f.endsWith('-sm.webp'))){const out=f.replace('-sm.webp','-glass.jpg');
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',dir+f,'-vf','scale=640:-2,gblur=sigma=8,eq=saturation=1.2','-q:v','4',dir+out]);console.log(out);}
