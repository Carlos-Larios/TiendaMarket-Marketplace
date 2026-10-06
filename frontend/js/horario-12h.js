(()=>{
function parse(value){const s=String(value||'').trim(),m=s.match(/^(\d{1,2}):(\d{2})\s*([ap])?\s*\.?\s*m?\.?$/i);if(!m)return null;let hour=Number(m[1]),minute=Number(m[2]);if(minute>59)return null;let period=m[3]?.toUpperCase();if(period){if(hour<1||hour>12)return null;period+='M';}else{if(hour>23)return null;period=hour>=12?'PM':'AM';hour=hour%12||12;}return {time:String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'),period};}
function range(value){if(/cerrado/i.test(value||''))return 'Cerrado';const parts=String(value||'').split(/\s*[–—]\s*|\s+-\s+/);if(parts.length!==2)return value||'Sin indicar';const a=parse(parts[0]),b=parse(parts[1]);return a&&b?a.time+' '+a.period+' – '+b.time+' '+b.period:value;}
window.TiendaProHorario={parse,range};
})();
