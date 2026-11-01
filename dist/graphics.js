const paths={
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
 home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
 layers:'<path d="m3 7 9-4 9 4-9 4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
 moon:'<path d="M20 14a8 8 0 0 1-10-10A9 9 0 1 0 20 14Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',minus:'<path d="M4 12h16"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 play:'<path d="m8 4 12 8-12 8Z"/>',chevron:'<path d="m6 9 6 6 6-6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 arrow:'<path d="M19 12H5m6-6-6 6 6 6"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 wave:'<path d="M2 8c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 14c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 20c3-4 5 4 8 0s5 4 8 0 4 0 4 0"/>',
 bridge:'<path d="M2 9h20M3 20V5m18 15V5M3 17c5-10 13-10 18 0M7 9v4m5-4v1m5-1v4M1 20h22"/>',
 view:'<path d="M3 20h18M9 20V9h6v11M7 9h10V5H7Zm5-4V2"/><path d="M10 13h4m-4 3h4"/>',
 leaf:'<path d="M20 3C6 1 1 10 7 17s16 0 13-14Z"/><path d="M4 21 16 8M9 16V9m0 7h7"/>',
 building:'<path d="M5 21V3h14v18M3 21h18M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-3h4v3"/>',
 cube:'<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10v10M3 7l9 5 9-5M7 4.8l9 5"/>',
 route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h6"/>',
 external:'<path d="M14 3h7v7M21 3l-12 12M11 3H3v18h18v-8"/>',
 drag:'<path d="M8 13V7a2 2 0 0 1 4 0v5-9a2 2 0 0 1 4 0v10-5a2 2 0 0 1 4 0v8c0 5-4 6-7 6s-5-2-7-5l-3-4a2 2 0 0 1 3-2l2 2Z"/>'
};
export function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.pin}</svg>`;}
export function fillIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
export function towerArt(b){let floors='';const n=15+b.shape*2;const h=125/n;for(let i=0;i<n;i++){const y=32+i*h;const shift=b.shape===2?Math.sin(i*.4)*3:0;floors+=`<path d="M${27+shift} ${y} 66 ${y+10} 96 ${y-1}v3L66 ${y+13} ${27+shift} ${y+3}Z" fill="${b.color}" opacity=".85"/><path d="M66 ${y+4}v5m9-8v5m10-9v5" stroke="#b1d0cd" stroke-width=".6"/>`;}
 return `<svg viewBox="0 0 124 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="62" cy="177" rx="53" ry="9" fill="#0a242d" opacity=".45"/><path d="m12 167 54 16 46-19-52-15Z" fill="#70877b"/><path d="M27 31 66 42v128l-39-12Z" fill="#37565d"/><path d="m66 42 30-11v127l-30 12Z" fill="#163943"/>${floors}<path d="m27 31 39 11 30-11-39-10Z" fill="${b.color}"/><path d="M28 32v124m38-114v127m28-136v123" stroke="${b.color}" stroke-width="2"/><path d="m22 151 44 14 37-13v11l-37 14-44-14Z" fill="${b.color}"/><path d="m37 161 29 9 22-9v6l-22 8-29-9Z" fill="#204047"/><path d="m15 166 15 4 11-4-14-4Z" fill="#81b2b2"/><g fill="#7c9b78"><circle cx="17" cy="162" r="5"/><circle cx="103" cy="158" r="5"/><circle cx="100" cy="170" r="4"/></g></svg>`;
}
