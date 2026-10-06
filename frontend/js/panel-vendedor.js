const API = "http://localhost:3000/api";
const token = localStorage.getItem("token");

function salir() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("portalSesion");
  window.location.replace("login-vendedor.html");
}

if (!token) salir();

(async () => {
  try {
    const res = await axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const u = res.data?.usuario || {};
    if (u.portal !== "tienda" || String(u.rol || "").toLowerCase() !== "vendedor") {
      salir();
      return;
    }

    const guardado = JSON.parse(localStorage.getItem("usuario") || "{}");
    const nombre = guardado.nombre || u.nombre || "Vendedor";
    const email = guardado.email || u.email || "";
    document.getElementById("sellerName").textContent = nombre;
    document.getElementById("sellerEmail").textContent = email;
    document.getElementById("welcomeName").textContent = nombre;
  } catch (_) {
    salir();
  }
})();

document.getElementById("logoutBtn").addEventListener("click", salir);


const navMisProductos = document.getElementById("navMisProductos");
if (navMisProductos) {
  navMisProductos.style.cursor = "pointer";
  navMisProductos.addEventListener("click", () => {
    window.location.href = "catalogo-vendedor.html";
  });
}


// FASE 58 — logo de la tienda. El avatar funciona como selector de imagen.
const sellerLogoAvatar=document.getElementById('sellerLogoAvatar');
const sellerLogoInput=document.getElementById('sellerLogoInput');
function pintarLogoTienda(ruta,tienda){
  if(!sellerLogoAvatar)return;
  if(ruta){const src=/^(https?:|data:|blob:)/i.test(ruta)?ruta:`http://localhost:3000${ruta.startsWith('/')?'':'/'}${ruta}`;sellerLogoAvatar.innerHTML=`<img src="${src}" alt="Logo" style="width:100%;height:100%;object-fit:cover">`;}
  else sellerLogoAvatar.textContent=(tienda||'TP').trim().charAt(0).toUpperCase();
}
(async()=>{try{const r=await fetch(`${API}/vendedores/mi-tienda/perfil`,{headers:{Authorization:`Bearer ${token}`}});if(r.ok){const d=await r.json();pintarLogoTienda(d.tienda?.logo_tienda,d.tienda?.tienda)}}catch(_){}})();
sellerLogoAvatar?.addEventListener('click',()=>sellerLogoInput?.click());
sellerLogoInput?.addEventListener('change',async()=>{const f=sellerLogoInput.files?.[0];if(!f)return;const fd=new FormData();fd.append('logo_tienda',f);try{const r=await fetch(`${API}/vendedores/mi-tienda/logo`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.mensaje||'No se pudo actualizar el logo');pintarLogoTienda(d.logo_tienda,'');window.TiendaProVendorTheme?.refreshAccentFromSellerLogo?.();alert('Logo de la tienda actualizado.');}catch(e){alert(e.message)}finally{sellerLogoInput.value=''}});


const navAjustes=document.getElementById('navAjustes');
if(navAjustes){navAjustes.style.cursor='pointer';navAjustes.addEventListener('click',()=>{window.location.href='ajustes-vendedor.html';});}

const navInventario=document.getElementById('navInventario'); if(navInventario) navInventario.addEventListener('click',()=>location.href='inventario-vendedor.html');

const menuBtn=document.querySelector('.menu-btn');
const sidebar=document.querySelector('.sidebar');
menuBtn?.addEventListener('click',()=>document.body.classList.toggle('vendor-menu-open'));
document.addEventListener('click',(event)=>{
  if(!document.body.classList.contains('vendor-menu-open'))return;
  if(sidebar?.contains(event.target)||menuBtn?.contains(event.target))return;
  document.body.classList.remove('vendor-menu-open');
});
document.addEventListener('keydown',(event)=>{
  if(event.key==='Escape')document.body.classList.remove('vendor-menu-open');
});
