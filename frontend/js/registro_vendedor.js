(()=>{
const form=document.querySelector('#formVendedor'),steps=[...document.querySelectorAll('.step')],heads=[...document.querySelectorAll('.steps span')],prev=document.querySelector('#anterior'),next=document.querySelector('#siguiente'),send=document.querySelector('#enviar'),msg=document.querySelector('#mensaje');
let i=0;
const tipo=form.elements.tipo_vendedor,iva=form.elements.contribuyente_iva,nit=form.elements.nit,nrc=form.elements.nrc,actividad=form.elements.actividad_economica,nitDoc=form.elements.nit_documento,nrcDoc=form.elements.nrc_documento,negocioDoc=form.elements.negocio_documento,banco=form.elements.banco;
const bancos=[
 'Banco Apoyo Integral, S.A.','Banco Agrícola, S.A.','Banco Atlántida El Salvador, S.A.','Banco ABANK, S.A.','Banco Azul de El Salvador, S.A.','Banco Cuscatlán de El Salvador, S.A.','Banco Davivienda Salvadoreño, S.A.','Banco de América Central, S.A.','Banco de Fomento Agropecuario','Banco Hipotecario de El Salvador, S.A.','Banco Industrial El Salvador, S.A.','Banco Promerica, S.A.','Citibank, N.A. Sucursal El Salvador'
];
const aliasBanco={
 'bac':'Banco de América Central, S.A.','banco america central':'Banco de América Central, S.A.','agricola':'Banco Agrícola, S.A.','cuscatlan':'Banco Cuscatlán de El Salvador, S.A.','davivienda':'Banco Davivienda Salvadoreño, S.A.','promerica':'Banco Promerica, S.A.','hipotecario':'Banco Hipotecario de El Salvador, S.A.','bfa':'Banco de Fomento Agropecuario','fomento agropecuario':'Banco de Fomento Agropecuario','atlantida':'Banco Atlántida El Salvador, S.A.','azul':'Banco Azul de El Salvador, S.A.','abank':'Banco ABANK, S.A.','industrial':'Banco Industrial El Salvador, S.A.','apoyo integral':'Banco Apoyo Integral, S.A.','citibank':'Citibank, N.A. Sucursal El Salvador','citi':'Citibank, N.A. Sucursal El Salvador'
};
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function fiscal(){
 const empresa=tipo.value==='Comercial',esIva=iva.value==='si';
 document.querySelector('#fiscal_persona_natural').hidden=tipo.value!=='Emprendedor';
 document.querySelector('#campo_nit').hidden=!empresa; document.querySelector('#doc_nit').hidden=!empresa; document.querySelector('#doc_negocio').hidden=!empresa;
 document.querySelector('#nota_docs_emprendedor').hidden=tipo.value!=='Emprendedor';
 document.querySelector('#campo_nrc').hidden=!esIva; document.querySelector('#doc_nrc').hidden=!esIva; document.querySelector('#campo_actividad').hidden=!esIva;
 nit.required=empresa; nitDoc.required=empresa; negocioDoc.required=empresa; nrc.required=esIva; nrcDoc.required=esIva; actividad.required=esIva;
 if(!empresa){nit.value='';nitDoc.value='';negocioDoc.value=''}
 if(!esIva){nrc.value='';nrcDoc.value='';actividad.value=''}
}
function show(){fiscal();steps.forEach((x,n)=>x.classList.toggle('active',n===i));heads.forEach((x,n)=>x.classList.toggle('active',n<=i));prev.hidden=i===0;next.hidden=i===steps.length-1;send.hidden=i!==steps.length-1;if(i===steps.length-1)summary()}
function valid(){fiscal();validarBanco();for(const el of steps[i].querySelectorAll('input,select,textarea'))if(!el.checkValidity()){el.reportValidity();return false}return true}
function summary(){fiscal();const d=new FormData(form),esEmpresa=d.get('tipo_vendedor')==='Comercial',esIva=d.get('contribuyente_iva')==='si';document.querySelector('#resumen').innerHTML=`<b>Responsable:</b> ${esc(d.get('nombre'))}<br><b>Correo:</b> ${esc(d.get('correo'))}<br><b>Tienda:</b> ${esc(d.get('tienda'))}<br><b>Tipo:</b> ${esc(esEmpresa?'Negocio o empresa formal':'Emprendedor / Persona natural')}<br><b>Contribuyente de IVA:</b> ${esIva?'Sí':'No'}${esEmpresa?`<br><b>NIT empresa:</b> ${esc(d.get('nit'))}`:'<br><b>Identificador tributario:</b> DUI del responsable'}${esIva?`<br><b>NRC:</b> ${esc(d.get('nrc'))}<br><b>Actividad económica:</b> ${esc(d.get('actividad_economica'))}`:''}<br><b>Banco:</b> ${esc(d.get('banco')||'No indicado')}<br><b>DUI:</b> Frente y reverso adjuntos${esEmpresa?'<br><b>Documento legal del negocio:</b> Adjunto':''}<br><b>Estado al enviar:</b> Pendiente de revisión`}
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

const suggestions=document.querySelector('#bankSuggestions');
function coincidenciasBanco(q){const n=norm(q);if(!n)return bancos;const alias=Object.entries(aliasBanco).filter(([a])=>norm(a).includes(n)||n.includes(norm(a))).map(([,v])=>v);return [...new Set([...bancos.filter(b=>norm(b).includes(n)),...alias])].slice(0,10)}
function renderBancos(){const arr=coincidenciasBanco(banco.value);suggestions.innerHTML=arr.map(b=>`<button type="button" class="bank-option" role="option" data-bank="${esc(b)}">${esc(b)}</button>`).join('')||'<div class="bank-empty">No se encontraron bancos relacionados.</div>';suggestions.hidden=false}
function validarBanco(){if(!banco.value.trim()){banco.setCustomValidity('');return true}const n=norm(banco.value);const exact=bancos.find(b=>norm(b)===n)||aliasBanco[n];if(exact){banco.value=exact;banco.setCustomValidity('');return true}banco.setCustomValidity('Selecciona un banco de la lista sugerida.');return false}
banco.addEventListener('focus',renderBancos); banco.addEventListener('input',()=>{banco.setCustomValidity('');renderBancos()}); banco.addEventListener('blur',()=>setTimeout(()=>{validarBanco();suggestions.hidden=true},140));
suggestions.addEventListener('mousedown',e=>{const btn=e.target.closest('[data-bank]');if(!btn)return;e.preventDefault();banco.value=btn.dataset.bank;banco.setCustomValidity('');suggestions.hidden=true});

tipo.addEventListener('change',fiscal);iva.addEventListener('change',fiscal);next.onclick=()=>{if(valid()){i++;show()}};prev.onclick=()=>{i--;show()};
form.onsubmit=async e=>{e.preventDefault();if(!valid())return;send.disabled=true;send.textContent='Enviando...';msg.innerHTML='';try{const r=await fetch('http://localhost:3000/api/vendedores/registro/solicitud',{method:'POST',body:new FormData(form)});const j=await r.json();if(!r.ok)throw new Error(j.mensaje||'No se pudo enviar');msg.innerHTML=`<div class="ok">Solicitud enviada correctamente. Código: <b>${esc(j.codigo||('SOL-'+j.solicitudId))}</b>. Quedó pendiente de revisión.</div>`;form.reset();i=0;show()}catch(err){msg.innerHTML=`<div class="error">${esc(err.message)}</div>`}finally{send.disabled=false;send.textContent='Enviar solicitud'}};
show();
})();
