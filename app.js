const ADMIN_PASSWORD = "admin123"; // Demo only: use a secure server-side login before public launch.
const STORAGE_KEY = "everafter-invitations-v1";
const $ = (id) => document.getElementById(id);
let deferredInstallPrompt = null;
let activeInvite = null;

function getInvites(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}}
function saveInvites(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function dateLabel(value){if(!value)return "";return new Date(value+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"})}
function openAdmin(theme){$("adminDialog").showModal();if(theme)$("inviteForm").elements.theme.value=theme}
$("year").textContent=new Date().getFullYear();
$("adminOpen").addEventListener("click",()=>openAdmin());
document.querySelectorAll(".create-template").forEach(btn=>btn.addEventListener("click",()=>openAdmin(btn.dataset.theme)));
$("loginBtn").addEventListener("click",()=>{if($("adminPassword").value===ADMIN_PASSWORD){$("loginPanel").hidden=true;$("editorPanel").hidden=false;$("loginError").textContent="";renderAdmin()}else{$("loginError").textContent="Incorrect password. Please try again."}});
$("logoutBtn").addEventListener("click",()=>{$("editorPanel").hidden=true;$("loginPanel").hidden=false;$("adminPassword").value="";});
$("inviteForm").addEventListener("submit",event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget).entries());data.id=crypto.randomUUID?crypto.randomUUID():String(Date.now());data.createdAt=new Date().toISOString();const items=getInvites();items.unshift(data);saveInvites(items);event.currentTarget.reset();$("publishMessage").textContent="Invitation published successfully on this device.";renderAdmin();renderPublished()});
function renderAdmin(){$("adminList").innerHTML=getInvites().map(item=>'<div class="admin-row"><span>'+escapeHtml(item.name)+' · '+escapeHtml(dateLabel(item.date))+'</span><button class="text-btn delete-invite" data-id="'+escapeHtml(item.id)+'" type="button">Delete</button></div>').join("")||'<p class="muted">No invitations published yet.</p>';document.querySelectorAll(".delete-invite").forEach(btn=>btn.addEventListener("click",()=>{saveInvites(getInvites().filter(x=>x.id!==btn.dataset.id));renderAdmin();renderPublished()}))}
function renderPublished(){const items=getInvites();$("published").hidden=!items.length;$("publishedGrid").innerHTML=items.map(item=>'<article class="published-card"><span class="eyebrow">YOU’RE INVITED</span><h3>'+escapeHtml(item.name)+'’s Birthday</h3><p>📅 '+escapeHtml(dateLabel(item.date))+' · '+escapeHtml(item.time)+'</p><p>📍 '+escapeHtml(item.venue)+'</p><button class="text-btn view-invite-btn" data-id="'+escapeHtml(item.id)+'">View invitation ↗</button></article>').join("");document.querySelectorAll(".view-invite-btn").forEach(btn=>btn.addEventListener("click",()=>viewInvite(btn.dataset.id)))}
function viewInvite(id){activeInvite=getInvites().find(x=>x.id===id);if(!activeInvite)return;const item=activeInvite;$("invitationView").innerHTML='<div class="view-invite theme-'+escapeHtml(item.theme)+'"><div style="font-size:36px">🎂</div><span class="eyebrow">A SPECIAL INVITATION</span><h2>'+escapeHtml(item.name)+'’s Birthday</h2><p class="details">'+escapeHtml(item.message||"Join us for a day full of smiles!")+'<br><br>📅 '+escapeHtml(dateLabel(item.date))+'<br>🕒 '+escapeHtml(item.time)+'<br>📍 '+escapeHtml(item.venue)+'</p><strong>Can’t wait to celebrate with you! ♡</strong></div>';$("viewDialog").showModal()}
$("shareInvite").addEventListener("click",async()=>{if(!activeInvite)return;const item=activeInvite;const message="You're invited to "+item.name+"'s birthday!\n"+dateLabel(item.date)+" at "+item.time+"\nVenue: "+item.venue+"\n"+(item.message||"Join us for a day full of smiles!");if(navigator.share){try{await navigator.share({title:item.name+"'s Birthday Invitation",text:message})}catch(e){}}else if(navigator.clipboard){await navigator.clipboard.writeText(message);$("shareInvite").textContent="Invitation details copied ✓"}else{window.prompt("Copy your invitation details:",message)}});
renderPublished();
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;$("installBtn").hidden=false});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").hidden=true});
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(err=>console.warn("Service worker registration failed",err)))}
