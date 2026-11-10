import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC59FLEDjEDj7Lm3AZwPsSihpI6fkKuqz4",
  authDomain: "everafter-779dd.firebaseapp.com",
  projectId: "everafter-779dd",
  storageBucket: "everafter-779dd.firebasestorage.app",
  messagingSenderId: "1021748697355",
  appId: "1:1021748697355:web:71102466d1d1f12dd16a0e",
  measurementId: "G-CHSBDXB6FP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
let deferredInstallPrompt = null;
let activeInvite = null;
let currentUser = null;

function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function resizePhoto(file,max=520,quality=.55){return new Promise((resolve,reject)=>{if(!file){resolve("");return}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",quality))};img.onerror=reject;img.src=reader.result};reader.onerror=reject;reader.readAsDataURL(file)})}
function openAdmin(){$("adminDialog").showModal()}
$("year").textContent=new Date().getFullYear();
$("adminOpen").addEventListener("click",openAdmin);

$("loginBtn").addEventListener("click",async()=>{
  $("loginError").textContent="";
  try{await signInWithEmailAndPassword(auth,$("adminEmail").value.trim(),$("adminPassword").value)}
  catch(e){$("loginError").textContent=e.code==="auth/invalid-credential"?"Email or password is incorrect.":e.message}
});
$("logoutBtn").addEventListener("click",()=>signOut(auth));
onAuthStateChanged(auth,user=>{
  currentUser=user;
  $("loginPanel").hidden=!!user;
  $("editorPanel").hidden=!user;
  if(user)renderAdmin();
});

$("inviteForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!currentUser){$("publishMessage").textContent="Please sign in first.";return}
  const f=e.currentTarget;
  const data=Object.fromEntries(new FormData(f).entries());
  const submit=f.querySelector('button[type="submit"]');
  submit.disabled=true;submit.textContent="Saving...";
  try{
    data.photo=await resizePhoto(f.elements.photo.files[0],520,.55);
    data.gallery=[];
    for(const file of [...$("galleryPhotos").files].slice(0,4))data.gallery.push(await resizePhoto(file,360,.48));
    data.name=String(data.name||"").trim();
    data.message=String(data.message||"").trim();
    data.createdAt=new Date().toISOString();
    const bytes=new Blob([JSON.stringify(data)]).size;
    if(bytes>850000)throw new Error("Photos are too large together. Use one main photo and up to 2 small gallery photos.");
    const ref=await addDoc(collection(db,"wishes"),data);
    f.reset();
    $("publishMessage").textContent="Birthday surprise saved online!";
    renderAdmin();
    const link=location.origin+location.pathname+"?wish="+ref.id;
    $("publishMessage").innerHTML='Saved! <a href="'+link+'" target="_blank" rel="noopener">Open surprise ↗</a> <button class="text-btn" id="copyNewLink" type="button">Copy share link</button>';
    $("copyNewLink").onclick=()=>navigator.clipboard.writeText(link);
  }catch(err){$("publishMessage").textContent=err.message||"Could not save. Check Firestore rules and try again."}
  finally{submit.disabled=false;submit.textContent="Create Birthday Surprise ✦"}
});

async function renderAdmin(){
  try{
    const snap=await getDocs(query(collection(db,"wishes"),orderBy("createdAt","desc")));
    const items=snap.docs.map(d=>({id:d.id,...d.data()}));
    $("adminList").innerHTML=items.map(x=>'<div class="admin-row"><span>'+escapeHtml(x.name)+'</span><button class="text-btn delete-invite" data-id="'+x.id+'" type="button">Delete</button><button class="text-btn preview-invite" data-id="'+x.id+'" type="button">Preview</button><button class="text-btn copy-invite" data-id="'+x.id+'" type="button">Copy link</button></div>').join("")||'<p class="muted">No surprises created yet.</p>';
    document.querySelectorAll(".delete-invite").forEach(b=>b.onclick=async()=>{if(confirm("Delete this birthday surprise?")){await deleteDoc(doc(db,"wishes",b.dataset.id));renderAdmin()}});
    document.querySelectorAll(".preview-invite").forEach(b=>b.onclick=()=>loadInvite(b.dataset.id));
    document.querySelectorAll(".copy-invite").forEach(b=>b.onclick=()=>navigator.clipboard.writeText(location.origin+location.pathname+"?wish="+b.dataset.id));
  }catch(e){$("adminList").innerHTML='<p class="error">Could not load wishes. Check Firestore security rules.</p>'}
}
const pages=[["Welcome","A little magic, made just for you."],["Open Your Surprise","Ready to discover something special?"],["Birthday Star","Today, the spotlight belongs to you."],["Special Wishes","A heartfelt personal message."],["Memory Gallery","Favourite moments together."],["Celebration","Confetti, balloons and joy!"],["Birthday Music","A soundtrack for the moment."],["Final Surprise","A sweet ending to remember."]];
function renderInvite(item){
  activeInvite=item;let page=0;
  const render=()=>{
    const photo=item.photo?'<img class="surprise-photo" src="'+item.photo+'" alt="Birthday photo">':'<div class="photo-placeholder">🎂</div>';
    const gallery=(item.gallery||[]).map(src=>'<img class="gallery-photo" src="'+src+'" alt="Memory photo">').join("");
    let body="";
    if(page===0)body='<div class="page-icon">✦</div><p class="eyebrow">A LITTLE MAGIC IS WAITING</p><h2>Something special is here for you.</h2><p>Made with love. Just for you.</p>';
    if(page===1)body='<div class="page-icon">🎁</div><p class="eyebrow">YOUR SURPRISE IS READY</p><h2>Open Your Surprise</h2><p>Take a deep breath and get ready to smile.</p>';
    if(page===2)body=photo+'<p class="eyebrow">TODAY\'S STAR</p><h2>Happy Birthday '+escapeHtml(item.name)+'! ❤️</h2>';
    if(page===3)body='<div class="page-icon">💌</div><p class="eyebrow">A NOTE FOR YOU</p><h2>Special Wishes</h2><p class="details">'+escapeHtml(item.message||"Wishing you happiness, love and beautiful memories today and always.")+'</p>';
    if(page===4)body='<p class="eyebrow">LITTLE MOMENTS, BIG MEMORIES</p><h2>Memory Gallery</h2><div class="memory-gallery">'+(gallery||photo)+'</div>';
    if(page===5)body='<div class="page-icon">🎉</div><p class="eyebrow">LET\'S CELEBRATE</p><h2>Make a wish, '+escapeHtml(item.name)+'!</h2><div class="confetti-line">🎈 ✨ 🎊 🎉 ✨ 🎈</div><p>May your year sparkle with joy.</p>';
    if(page===6)body='<div class="page-icon">🎵</div><p class="eyebrow">A SOUNDTRACK FOR YOU</p><h2>Birthday Music</h2><p>'+(item.music?'Music link added by the creator.':'Imagine your favourite birthday song playing just for you.')+'</p>'+(item.music?'<a class="btn btn-soft" href="'+escapeHtml(item.music)+'" target="_blank" rel="noopener">Open music ↗</a>':'');
    if(page===7)body='<div class="page-icon">♡</div><p class="eyebrow">UNTIL THE NEXT BEAUTIFUL MOMENT</p><h2>You are one of a kind, '+escapeHtml(item.name)+'.</h2><p>Never stop shining. Happy Birthday! ✨</p>';
    $("invitationView").innerHTML='<div class="journey-page theme-'+(item.theme||"violet")+'"><div class="journey-progress">'+pages.map((p,i)=>'<span class="'+(i<=page?'active':'')+'"></span>').join("")+'</div><small class="page-count">MOMENT '+(page+1)+' OF 8</small><div class="journey-content">'+body+'</div><div class="journey-controls">'+(page>0?'<button class="btn btn-soft" id="prevPage">← Back</button>':'<span></span>')+(page<7?'<button class="btn btn-primary" id="nextPage">'+(page===0?'Continue':page===1?'Open Your Surprise':'Next')+' →</button>':'<button class="btn btn-primary" id="finishPage">Start again ↻</button>')+'</div></div>';
    if(!$("viewDialog").open)$("viewDialog").showModal();
    if($("nextPage"))$("nextPage").onclick=()=>{page++;render()};
    if($("prevPage"))$("prevPage").onclick=()=>{page--;render()};
    if($("finishPage"))$("finishPage").onclick=()=>{page=0;render()};
  };render();
}
async function loadInvite(id){
  try{const snap=await getDoc(doc(db,"wishes",id));if(!snap.exists()){alert("This birthday surprise link is not available.");return}renderInvite({id:snap.id,...snap.data()})}
  catch(e){alert("Could not load this surprise. Please try again later.")}
}
$("shareInvite").addEventListener("click",async()=>{
  if(!activeInvite)return;
  const url=location.origin+location.pathname+"?wish="+activeInvite.id;
  if(navigator.share){try{await navigator.share({title:"A birthday surprise for "+activeInvite.name,url})}catch(e){}}
  else{await navigator.clipboard.writeText(url);$("shareInvite").textContent="Share link copied ✓"}
});
renderAdminIfLoggedIn();
function renderAdminIfLoggedIn(){if(currentUser)renderAdmin()}
const wishId=new URLSearchParams(location.search).get("wish");
if(wishId)loadInvite(wishId);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("installBtn").hidden=false});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").hidden=true});
if("serviceWorker"in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(e=>console.warn(e)));
