(function(){
  const THEME_KEY='tiendapro_vendor_theme';
  const ACCENT_KEY='tiendapro_vendor_accent';
  const DEFAULT_ACCENT='#2563eb';
  const API='http://localhost:3000/api';

  function normalizeTheme(value){ return value==='dark'?'dark':'light'; }
  function hexToRgb(hex){
    const m=String(hex||'').trim().match(/^#([0-9a-f]{6})$/i);
    if(!m)return null;
    const n=parseInt(m[1],16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
  }
  function rgbToHex(r,g,b){
    return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  }
  function srgb(v){
    v/=255; return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
  }
  function luminance(rgb){
    return .2126*srgb(rgb.r)+.7152*srgb(rgb.g)+.0722*srgb(rgb.b);
  }
  function contrastRatio(a,b){
    const l1=luminance(a),l2=luminance(b),hi=Math.max(l1,l2),lo=Math.min(l1,l2);
    return (hi+.05)/(lo+.05);
  }
  function mix(rgb,target,amount){
    return {
      r:rgb.r+(target.r-rgb.r)*amount,
      g:rgb.g+(target.g-rgb.g)*amount,
      b:rgb.b+(target.b-rgb.b)*amount
    };
  }
  function tuneAccent(r,g,b){
    let rgb={r,g,b};
    const max=Math.max(r,g,b), min=Math.min(r,g,b), spread=max-min;
    if(spread<24) return DEFAULT_ACCENT;

    /* Evita colores extremos que pierden identidad o contraste. */
    if(luminance(rgb)<.055) rgb=mix(rgb,{r:255,g:255,b:255},.28);
    if(luminance(rgb)>.80) rgb=mix(rgb,{r:0,g:0,b:0},.22);
    return rgbToHex(rgb.r,rgb.g,rgb.b);
  }
  function bestTextOn(rgb){
    const white={r:255,g:255,b:255}, dark={r:15,g:23,b:42};
    return contrastRatio(rgb,white)>=contrastRatio(rgb,dark)?'#ffffff':'#0f172a';
  }
  function ensureActiveContrast(rgb){
    const target=bestTextOn(rgb)==='#ffffff'?{r:0,g:0,b:0}:{r:255,g:255,b:255};
    let current={...rgb};
    let text=bestTextOn(current);
    for(let i=0;i<12;i++){
      if(contrastRatio(current,hexToRgb(text))>=4.5) break;
      current=mix(current,target,.08);
      text=bestTextOn(current);
    }
    return {accent:rgbToHex(current.r,current.g,current.b),contrast:text};
  }
  function setAccent(hex,persist=true){
    const parsed=hexToRgb(hex)||hexToRgb(DEFAULT_ACCENT);
    const tuned=hexToRgb(tuneAccent(parsed.r,parsed.g,parsed.b));
    const safe=ensureActiveContrast(tuned);
    const s=hexToRgb(safe.accent);
    const root=document.documentElement.style;
    root.setProperty('--tp-accent',safe.accent);
    root.setProperty('--tp-accent-rgb',`${s.r},${s.g},${s.b}`);
    root.setProperty('--tp-accent-contrast',safe.contrast);
    root.setProperty('--tp-accent-soft',`rgba(${s.r},${s.g},${s.b},.14)`);
    if(persist){try{localStorage.setItem(ACCENT_KEY,safe.accent)}catch{}}
    document.dispatchEvent(new CustomEvent('vendorAccentChanged',{detail:{accent:safe.accent,contrast:safe.contrast}}));
    return safe.accent;
  }
  function setTheme(theme,persist=true){
    const value=normalizeTheme(theme); document.documentElement.dataset.vendorTheme=value;
    if(persist){try{localStorage.setItem(THEME_KEY,value)}catch{}}
    document.dispatchEvent(new CustomEvent('vendorThemeChanged',{detail:{theme:value}}));
    return value;
  }
  async function dominantFromImage(url){
    if(!url)return null;
    try{
      const res=await fetch(url,{mode:'cors',cache:'no-store'}); if(!res.ok)throw new Error('image');
      const blob=await res.blob(); const bmp=await createImageBitmap(blob);
      const canvas=document.createElement('canvas'); canvas.width=48;canvas.height=48;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bmp,0,0,48,48);
      const data=ctx.getImageData(0,0,48,48).data; const buckets=new Map();
      for(let i=0;i<data.length;i+=16){
        if(data[i+3]<180)continue;
        let r=data[i],g=data[i+1],b=data[i+2]; const max=Math.max(r,g,b),min=Math.min(r,g,b);
        if(max>245||max<24||max-min<18)continue;
        r=Math.min(255,Math.round(r/32)*32);g=Math.min(255,Math.round(g/32)*32);b=Math.min(255,Math.round(b/32)*32);
        const k=`${r},${g},${b}`; buckets.set(k,(buckets.get(k)||0)+1);
      }
      if(!buckets.size)return null;
      const key=[...buckets.entries()].sort((a,b)=>b[1]-a[1])[0][0];
      const [r,g,b]=key.split(',').map(Number); return tuneAccent(r,g,b);
    }catch(_){return null;}
  }
  async function refreshAccentFromSellerLogo(){
    const token=localStorage.getItem('token');
    if(!token)return setAccent(localStorage.getItem(ACCENT_KEY)||DEFAULT_ACCENT,false);
    try{
      const r=await fetch(`${API}/vendedores/mi-tienda/perfil`,{headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok)throw new Error('perfil');
      const d=await r.json(); const logo=d?.tienda?.logo_tienda;
      if(!logo)return setAccent(localStorage.getItem(ACCENT_KEY)||DEFAULT_ACCENT,false);
      const url=/^(https?:|data:|blob:)/i.test(logo)?logo:`http://localhost:3000${logo.startsWith('/')?'':'/'}${logo}`;
      const accent=await dominantFromImage(url);
      return setAccent(accent||localStorage.getItem(ACCENT_KEY)||DEFAULT_ACCENT,true);
    }catch(_){
      return setAccent(localStorage.getItem(ACCENT_KEY)||DEFAULT_ACCENT,false);
    }
  }

  const initialTheme=normalizeTheme(localStorage.getItem(THEME_KEY)||'light');
  setTheme(initialTheme,false);
  setAccent(localStorage.getItem(ACCENT_KEY)||DEFAULT_ACCENT,false);

  window.TiendaProVendorTheme={
    setTheme,
    setAccent,
    refreshAccentFromSellerLogo,
    getTheme:()=>normalizeTheme(localStorage.getItem(THEME_KEY)||'light'),
    getAccent:()=>getComputedStyle(document.documentElement).getPropertyValue('--tp-accent').trim()||DEFAULT_ACCENT
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshAccentFromSellerLogo,{once:true});
  else refreshAccentFromSellerLogo();
})();
