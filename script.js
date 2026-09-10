/*
  IMPORTANT:
  Set API_URL to your deployed Google Apps Script Web App URL.
  Do not put a Google service-account key or private secret in this file.
*/
const API_URL = "https://script.google.com/macros/s/AKfycbw03pX8DcMlewhJ-owcTnY-DHpurvZFBbL-Ly_t8uClLIw1LmdE-sgHe2JemrES5uclDg/exec";
let session = null;
let products = [];
let movements = [];
let users = [];

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(n)||0);

function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function api(action,data={}){
  if(API_URL.includes("PASTE_")) throw new Error("Set API_URL in script.js first.");
  const body={action,...data};
  if(session?.token) body.token=session.token;
  const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)});
  const json=await res.json();
  if(!json.ok) throw new Error(json.message||"Request failed");
  return json;
}

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const btn=e.submitter;btn.disabled=true;btn.textContent="Signing in...";
  try{
    const r=await api("login",{username:$("username").value.trim(),password:$("password").value});
    session=r.session;localStorage.setItem("mrDIYSession",JSON.stringify(session));enterApp();
  }catch(err){toast(err.message)}finally{btn.disabled=false;btn.textContent="Sign in"}
});

async function enterApp(){
  $("loginScreen").classList.add("hidden");$("appScreen").classList.remove("hidden");
  $("currentUser").textContent=session.name;$("currentRole").textContent=session.role;
  $("avatar").textContent=(session.name||"A").charAt(0).toUpperCase();
  document.querySelectorAll(".admin-only").forEach(x=>x.style.display=session.role==="ADMIN"?"block":"none");
  try{await loadAll()}catch(e){toast(e.message);logout()}
}
async function loadAll(){
  const [p,m]=await Promise.all([api("products"),api("movements")]);
  products=p.products;movements=m.movements;renderAll();
  if(session.role==="ADMIN"){const u=await api("users");users=u.users;renderUsers()}
}
function status(p){if(Number(p.stock)<=0)return["Out","out"];if(Number(p.stock)<=Number(p.reorder))return["Low","low"];return["Healthy","ok"]}
function renderAll(){renderStats();renderProducts();renderMovements();fillMovementProducts();renderLowStock();renderReport()}
function renderStats(){
  $("totalProducts").textContent=products.length;
  $("totalUnits").textContent=products.reduce((a,p)=>a+Number(p.stock||0),0);
  $("lowStock").textContent=products.filter(p=>Number(p.stock)<=Number(p.reorder)).length;
  $("inventoryValue").textContent=money(products.reduce((a,p)=>a+Number(p.stock||0)*Number(p.price||0),0));
}
function renderLowStock(){
  $("lowStockTable").innerHTML=products.filter(p=>Number(p.stock)<=Number(p.reorder)).slice(0,8).map(p=>{
    const [s,c]=status(p);return `<tr><td>${esc(p.sku)}</td><td><strong>${esc(p.name)}</strong></td><td>${esc(p.category)}</td><td>${p.stock}</td><td><span class="badge ${c}">${s}</span></td></tr>`
  }).join("")||`<tr><td colspan="5">No low-stock products.</td></tr>`;
}
function renderProducts(){
  const q=($("searchInput")?.value||"").toLowerCase();
  const list=products.filter(p=>[p.sku,p.name,p.category].join(" ").toLowerCase().includes(q));
  $("productsTable").innerHTML=list.map(p=>{
    const [s,c]=status(p);return `<tr><td>${esc(p.sku)}</td><td><strong>${esc(p.name)}</strong></td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td>${p.reorder}</td><td><div class="actions"><button class="mini" onclick="editProduct('${esc(p.id)}')">Edit</button><button class="mini danger" onclick="deleteProduct('${esc(p.id)}')">Delete</button></div></td></tr>`
  }).join("")||`<tr><td colspan="7">No products found.</td></tr>`;
}
function renderMovements(){
  $("movementTable").innerHTML=movements.slice(0,30).map(m=>`<tr><td>${esc(m.date)}</td><td>${esc(m.sku)}</td><td><span class="badge ${m.type==="IN"?"ok":"low"}">${m.type}</span></td><td>${m.qty}</td><td>${esc(m.user)}</td><td>${esc(m.note)}</td></tr>`).join("")||`<tr><td colspan="6">No movements yet.</td></tr>`;
}
function fillMovementProducts(){$("movementProduct").innerHTML=products.map(p=>`<option value="${esc(p.id)}">${esc(p.sku)} — ${esc(p.name)} (stock: ${p.stock})</option>`).join("")}
function renderReport(){
  $("healthyStock").textContent=products.filter(p=>status(p)[1]==="ok").length;
  $("reportLowStock").textContent=products.filter(p=>status(p)[1]==="low").length;
  $("outStock").textContent=products.filter(p=>status(p)[1]==="out").length;
  $("outStock").textContent=products.filter(p=>Number(p.stock)<=0).length;
  $("categoriesCount").textContent=new Set(products.map(p=>p.category)).size;
}
function renderUsers(){
  $("usersTable").innerHTML=users.map(u=>`<tr><td>${esc(u.username)}</td><td>${esc(u.name)}</td><td>${esc(u.role)}</td><td><span class="badge ok">Active</span></td><td><button class="mini danger" onclick="deleteUser('${esc(u.id)}')">Delete</button></td></tr>`).join("");
}
function showPage(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));
  $(page+"Page").classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  $("pageTitle").textContent=page.charAt(0).toUpperCase()+page.slice(1);
}
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
$("searchInput").addEventListener("input",renderProducts);

function openProductModal(p=null){
  $("productModalTitle").textContent=p?"Edit Product":"Add Product";$("productId").value=p?.id||"";
  $("productSku").value=p?.sku||"";$("productName").value=p?.name||"";$("productCategory").value=p?.category||"";
  $("productPrice").value=p?.price??"";$("productStock").value=p?.stock??0;$("productReorder").value=p?.reorder??5;
  $("productModal").classList.remove("hidden");
}
function editProduct(id){const p=products.find(x=>String(x.id)===String(id));if(p)openProductModal(p)}
function closeModal(id){$(id).classList.add("hidden")}
$("productForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const data={id:$("productId").value,sku:$("productSku").value.trim(),name:$("productName").value.trim(),category:$("productCategory").value.trim(),price:Number($("productPrice").value),stock:Number($("productStock").value),reorder:Number($("productReorder").value)};
  try{await api(data.id?"updateProduct":"addProduct",{product:data});toast("Product saved");closeModal("productModal");await loadAll()}catch(err){toast(err.message)}
});
async function deleteProduct(id){if(!confirm("Delete this product?"))return;try{await api("deleteProduct",{id});toast("Product deleted");await loadAll()}catch(e){toast(e.message)}}
async function saveMovement(){
  const qty=Number($("movementQty").value);if(!qty||qty<1)return toast("Enter a valid quantity");
  try{await api("movement",{productId:$("movementProduct").value,type:$("movementType").value,qty,note:$("movementNote").value.trim()});toast("Movement saved");$("movementQty").value="";$("movementNote").value="";await loadAll()}catch(e){toast(e.message)}
}
function openUserModal(){$("userModal").classList.remove("hidden")}
$("userForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{await api("addUser",{username:$("newUsername").value.trim(),name:$("newName").value.trim(),password:$("newPassword").value,role:$("newRole").value});toast("User created");closeModal("userModal");e.target.reset();await loadAll()}catch(err){toast(err.message)}
});
async function deleteUser(id){if(!confirm("Delete this user?"))return;try{await api("deleteUser",{id});toast("User deleted");await loadAll()}catch(e){toast(e.message)}}
function exportCSV(){
  const rows=[["SKU","Product","Category","Price","Stock","Reorder"],...products.map(p=>[p.sku,p.name,p.category,p.price,p.stock,p.reorder])];
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="mr-diy-inventory.csv";a.click();
}
$("logoutBtn").onclick=logout;
function logout(){session=null;localStorage.removeItem("mrDIYSession");$("appScreen").classList.add("hidden");$("loginScreen").classList.remove("hidden");$("password").value=""}
(async()=>{try{const saved=JSON.parse(localStorage.getItem("mrDIYSession")||"null");if(saved?.token){session=saved;const r=await api("me");if(r.user)enterApp();else logout()}}catch(e){logout()}})();
