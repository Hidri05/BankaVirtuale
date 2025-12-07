

const STORAGE_KEY = 'banka_advanced_v3'; 

/* ---------- MODELS ---------- */
class Account {
  constructor({ id, owner, type='Checking', balance=0, password='123', logs=[], history=[] }){
    this.id = id || Account.genId();
    this.owner = owner;
    this.type = type;
    this.balance = Number(balance) || 0;
    this.password = password || '123';
    this.logs = logs || [];
    this.history = history || [];
    if(this.history.length === 0){
      this.addHistory(); 
    }
    if(this.logs.length === 0){
      this.log(`Llogaria u krijua me ${this.balance.toFixed(2)} EUR`);
    }
  }
  static genId(){ return 'AC' + Math.random().toString(36).slice(2,9).toUpperCase(); }
  deposit(amount){
    amount = Number(amount);
    if(!(amount > 0)) throw new Error('Shuma duhet > 0');
    this.balance = Number((this.balance + amount).toFixed(2));
    this.log(`Depozitë +${amount.toFixed(2)} EUR — Balanca ${this.balance.toFixed(2)}`);
    this.addHistory();
  }
  withdraw(amount){
    amount = Number(amount);
    if(!(amount > 0)) throw new Error('Shuma duhet > 0');
    if(this.balance < amount){ this.log(`Tentativë tërheqje e pasuksesshme ${amount.toFixed(2)} EUR`); return false; }
    if(this.type === 'Savings' && (this.balance - amount) < 15){ this.log('Tërheqje e refuzuar: minima 15 EUR'); return false; }
    this.balance = Number((this.balance - amount).toFixed(2));
    this.log(`Tërheqje -${amount.toFixed(2)} EUR — Balanca ${this.balance.toFixed(2)}`);
    this.addHistory();
    return true;
  }
  applyInterest(ratePercent){
    const rate = Number(ratePercent) || 0;
    const interest = Number((this.balance * (rate/100)).toFixed(2));
    if(interest <= 0) return 0;
    this.balance = Number((this.balance + interest).toFixed(2));
    this.log(`Interes +${interest.toFixed(2)} EUR (${rate}%)`);
    this.addHistory();
    return interest;
  }
  log(msg){
    this.logs.unshift({ ts: new Date().toISOString(), msg });
    if(this.logs.length > 500) this.logs.pop();
  }
  addHistory(){
    this.history.unshift({ ts: new Date().toISOString(), balance: Number(this.balance.toFixed(2)) });
    if(this.history.length > 365) this.history.pop(); 
  }
  toJSON(){ return { id:this.id, owner:this.owner, type:this.type, balance:this.balance, password:this.password, logs:this.logs, history:this.history }; }
}

/* ---------- STATE ---------- */
let state = (function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return { users:[{username:'admin',password:'admin123',role:'admin'}], accounts:[], currentUser:null, theme:'light' };
    const s = JSON.parse(raw);
    s.accounts = (s.accounts||[]).map(a => new Account(a).toJSON());
    s.theme = s.theme || 'light';
    if(!s.users) s.users = [{username:'admin',password:'admin123',role:'admin'}];
    return s;
  } catch(e) {
    return { users:[{username:'admin',password:'admin123',role:'admin'}], accounts:[], currentUser:null, theme:'light' };
  }
})();
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ---------- HELPERS ---------- */
const $ = id => document.getElementById(id);
function toast(msg, type='info', ttl=3500){
  const container = $('toasts');
  const t = document.createElement('div'); t.className = `toast ${type}`; t.innerHTML = `<div>${msg}</div><div style="margin-left:12px;opacity:0.9">✕</div>`;
  t.addEventListener('click', ()=> t.remove());
  container.appendChild(t);
  setTimeout(()=> t.remove(), ttl);
}
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]); }
let chart = null;

/* ---------- INIT ---------- */
window.addEventListener('DOMContentLoaded', ()=>{
  // Auth
  $('btnLogin').addEventListener('click', doLogin);
  $('btnGuest').addEventListener('click', ()=>{ state.currentUser = { username:'Guest', isAdmin:false }; persist(); renderApp(); toast('Hyr si vizitor', 'info'); });
  $('btnLogout').addEventListener('click', doLogout);

  // admin
  $('btnCreate').addEventListener('click', handleCreateAccount);
  $('btnSeed').addEventListener('click', seedExamples);
  $('btnDelete').addEventListener('click', ()=> openModal('A doni të fshini llogarinë e zgjedhur?', confirmDelete));
  $('btnApplyInterest').addEventListener('click', ()=> applyInterestAll(true));

  // actions
  $('btnDeposit').addEventListener('click', handleDeposit);
  $('btnWithdraw').addEventListener('click', handleWithdraw);
  $('btnTransfer').addEventListener('click', handleTransfer);

  // export/import
  $('exportBtn').addEventListener('click', handleExport);
  $('importFile').addEventListener('change', handleImport);
  $('exportMyAccount').addEventListener('click', handleExportMyAccount);

  // modal
  $('modalCancel').addEventListener('click', closeModal);
  $('modalConfirm').addEventListener('click', ()=> { if(typeof modalConfirmAction === 'function') modalConfirmAction(); closeModal(); });

  // user change password
  $('userChangeBtn').addEventListener('click', handleUserChangePassword);

  // theme toggle
  $('themeToggle').addEventListener('click', toggleTheme);
  applyTheme(state.theme);

  // account select change -> update logs & chart
  $('accountSelect').addEventListener('change', ()=>{ renderLogs(); renderChart(); });

  // load previous session
  if(state.currentUser) renderApp();

  // auto-interest simulation (demo: every 60s). For real monthly: run on backend or set to 30*24*60*60*1000
  setInterval(()=> applyInterestAll(false), 60000);
});

/* ---------- AUTH ---------- */
function doLogin(){
  const u = $('loginUser').value.trim(); const p = $('loginPass').value.trim();
  $('loginMessage').innerText = '';
  if(!u || !p){ $('loginMessage').innerText = 'Plotëso përdorues dhe fjalëkalim'; return; }

  const usr = state.users.find(x => x.username === u && x.password === p);
  if(usr){ state.currentUser = { username: usr.username, isAdmin: usr.role === 'admin' }; persist(); renderApp(); toast('Mirë se vini në panelin e administratorit.', 'success'); return; }

  const acc = state.accounts.find(a => a.owner === u && a.password === p);
  if(acc){ state.currentUser = { username: acc.owner, isAdmin: false, accountId: acc.id }; persist(); renderApp(); toast('Mirë se vini! Hyrje e suksesshme në llogarinë tuaj.', 'success'); return; }

  $('loginMessage').innerText = 'Kredencialet gabim';
}
function doLogout(){ state.currentUser = null; persist(); renderApp(); toast('Keni dalë me sukses nga llogaria.', 'info'); }

/* ---------- RENDER ---------- */
function renderApp(){
  const auth = $('authArea'), dash = $('dashboard');
  if(!state.currentUser){ auth.style.display = 'block'; dash.style.display = 'none'; return; }
  auth.style.display = 'none'; dash.style.display = 'block';

  $('userLabel').innerText = `${state.currentUser.username} ${state.currentUser.isAdmin ? '(Admin)' : ''}`;
  // admin vs user
  $('adminPanel').style.display = state.currentUser.isAdmin ? 'block' : 'none';
  $('userPanel').style.display = state.currentUser.isAdmin ? 'none' : 'block';

  renderAccountsTable();
  renderSelects();
  renderDeleteSelect();
  renderTransferOptions();
  renderLogs();
  renderChart();
  renderReports();
}

/* Accounts table */
function renderAccountsTable(){
  const container = $('accountsTable'); container.innerHTML = '';
  const header = document.createElement('div'); header.className='table-row head';
  header.innerHTML = `<div>Pronari</div><div>Tipi</div><div>Balanca</div>`;
  container.appendChild(header);

  state.accounts.forEach(aRaw => {
    if(state.currentUser && !state.currentUser.isAdmin){
      if(state.currentUser.accountId && state.currentUser.accountId !== aRaw.id) return;
      if(state.currentUser.username && state.currentUser.username !== aRaw.owner && !state.currentUser.accountId) return;
    }
    const row = document.createElement('div'); row.className='table-row';
    row.innerHTML = `<div class="owner">${escapeHtml(aRaw.owner)}</div><div>${escapeHtml(aRaw.type)}</div><div>${Number(aRaw.balance).toFixed(2)} EUR</div>`;
    container.appendChild(row);
  });
}


function renderSelects(){
  const sel = $('accountSelect'); sel.innerHTML = '';
  const visible = state.accounts.filter(a => {
    if(state.currentUser && !state.currentUser.isAdmin){
      if(state.currentUser.accountId) return state.currentUser.accountId === a.id;
      return state.currentUser.username === a.owner;
    }
    return true;
  });
  visible.forEach(a => {
    const o = document.createElement('option'); o.value = a.id; o.textContent = `${a.owner} — ${a.type} — ${Number(a.balance).toFixed(2)} EUR`;
    sel.appendChild(o);
  });
  if(sel.options.length) sel.selectedIndex = 0;
}

function renderDeleteSelect(){
  const d = $('deleteSelect'); d.innerHTML = '';
  state.accounts.forEach(a => {
    const o = document.createElement('option'); o.value = a.id; o.textContent = `${a.owner} — ${a.type} — ${Number(a.balance).toFixed(2)} EUR`;
    d.appendChild(o);
  });
}

function renderTransferOptions(){
  const t = $('transferTo'); t.innerHTML = '';
  state.accounts.forEach(a => {
    const o = document.createElement('option'); o.value = a.id; o.textContent = `${a.owner} — ${a.type}`;
    t.appendChild(o);
  });
}

function renderLogs(){
  const box = $('logs'); box.innerHTML = '';
  const sel = $('accountSelect');
  const targetId = sel && sel.value ? sel.value : (state.currentUser && state.currentUser.accountId ? state.currentUser.accountId : null);
  if(!targetId) return;
  const acc = state.accounts.find(a => a.id === targetId);
  if(!acc) return;
  acc.logs.forEach(l=>{
    const row = document.createElement('div'); row.style.marginBottom='6px';
    const time = new Date(l.ts).toLocaleString();
    row.innerText = `[${time}] ${l.msg}`; box.appendChild(row);
  });
}

function renderReports(){
  const total = state.accounts.reduce((s,a)=>s + Number(a.balance), 0);
  $('totalBalance').innerText = total.toFixed(2);
  $('numAccounts').innerText = state.accounts.length;
}

/* chart: line chart for selected account history */
function renderChart(){
  const ctx = document.getElementById('balanceChart');
  if(!ctx) return;
  const sel = $('accountSelect');
  const id = sel && sel.value ? sel.value : (state.currentUser && state.currentUser.accountId ? state.currentUser.accountId : null);
  if(!id){ 
    if(chart){ chart.data.labels = []; chart.data.datasets[0].data = []; chart.update(); }
    return;
  }
  const acc = state.accounts.find(a => a.id === id);
  if(!acc) return;
  // prepare labels (reverse history to show oldest -> newest)
  const hist = (acc.history || []).slice().reverse();
  const labels = hist.map(h => new Date(h.ts).toLocaleDateString() + ' ' + new Date(h.ts).toLocaleTimeString());
  const data = hist.map(h => h.balance);
  if(chart){
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${acc.owner} — Balanca`,
        data,
        borderColor: 'rgba(11,99,216,0.9)',
        backgroundColor: 'rgba(11,99,216,0.12)',
        fill: true,
        tension: 0.25,
        pointRadius: 3
      }]
    },
    options:{
      responsive:true,
      plugins:{ legend:{ display:true } },
      scales:{ y:{ beginAtZero:false } }
    }
  });
}

/* ---------- HANDLERS ---------- */
function handleCreateAccount(){
  if(!state.currentUser || !state.currentUser.isAdmin){ toast('Vetëm admin', 'error'); return; }
  const owner = $('newOwner').value.trim(); const pwd = $('newPassword').value.trim();
  const type = $('newType').value; const bal = Number($('newBalance').value) || 0;
  if(!owner || !pwd){ toast('Vendos emrin dhe password', 'error'); return; }
  if(type === 'Savings' && bal < 15){ toast('Savings kërkon minimum 15 EUR', 'error'); return; }
  const acc = new Account({ owner, type, balance:bal, password:pwd });
  state.accounts.push(acc.toJSON()); persist(); renderApp(); toast('Llogaria u krijua', 'success');
  $('newOwner').value=''; $('newPassword').value=''; $('newBalance').value='15';
}

function seedExamples(){
  const a = new Account({ owner:'Elisa', type:'Savings', balance:250, password:'123' });
  const b = new Account({ owner:'Mark', type:'Checking', balance:90, password:'123' });
  state.accounts.push(a.toJSON(), b.toJSON()); persist(); renderApp(); toast('Shembuj u shtuan', 'info');
}

let modalConfirmAction = null;
function openModal(text, onConfirm){
  $('modalText').innerText = text; modalConfirmAction = onConfirm; $('modal').classList.remove('hidden');
}
function closeModal(){ $('modal').classList.add('hidden'); modalConfirmAction = null; }

function confirmDelete(){
  const id = $('deleteSelect').value;
  if(!id) return toast('Zgjidh llogarinë për fshirje', 'error');
  state.accounts = state.accounts.filter(a => a.id !== id);
  persist(); renderApp(); toast('Llogaria u fshi', 'success');
}

/* deposit */
function handleDeposit(){
  const id = $('accountSelect').value; const amt = Number($('opAmount').value) || 0;
  if(!id || amt <= 0) return toast('Shuma > 0 dhe zgjidh llogarinë', 'error');
  const raw = state.accounts.find(a => a.id === id);
  const acc = new Account(raw);
  try{ acc.deposit(amt); state.accounts[state.accounts.findIndex(a => a.id === id)] = acc.toJSON(); persist(); renderApp(); toast('Depozitë e suksesshme', 'success'); }catch(e){ toast(e.message, 'error'); }
}

/* withdraw */
function handleWithdraw(){
  const id = $('accountSelect').value; const amt = Number($('opAmount').value) || 0;
  if(!id || amt <= 0) return toast('Shuma > 0 dhe zgjidh llogarinë', 'error');
  const raw = state.accounts.find(a => a.id === id); const acc = new Account(raw);
  const ok = acc.withdraw(amt);
  state.accounts[state.accounts.findIndex(a => a.id === id)] = acc.toJSON(); persist(); renderApp();
  if(ok) toast('Tërheqje e kryer', 'success'); else toast('Tërheqje e refuzuar', 'error');
}

/* transfer */
function handleTransfer(){
  const fromId = $('accountSelect').value; const toId = $('transferTo').value; const amt = Number($('opAmount').value) || 0;
  if(!fromId || !toId || amt <= 0) return toast('Plotëso fushat për transferta', 'error');
  if(fromId === toId) return toast('Zgjidh llogari të ndryshme', 'error');
  const fromRaw = state.accounts.find(a => a.id === fromId); const toRaw = state.accounts.find(a => a.id === toId);
  const from = new Account(fromRaw); const to = new Account(toRaw);
  const ok = from.withdraw(amt);
  if(!ok){ toast('Transferimi dështoi (pamjaftueshmëri fondesh ose tejkalim i kufirit.)', 'error'); return; }
  to.deposit(amt);
  from.log(`Transfer -${amt.toFixed(2)} EUR tek ${to.owner}`); to.log(`Transfer +${amt.toFixed(2)} EUR nga ${from.owner}`);
  state.accounts[state.accounts.findIndex(a => a.id === fromId)] = from.toJSON();
  state.accounts[state.accounts.findIndex(a => a.id === toId)] = to.toJSON();
  persist(); renderApp(); toast('Transferte e kryer', 'success');
}

/* apply interest (1%) to all accounts */
function applyInterestAll(manual=true){
  if(manual && (!state.currentUser || !state.currentUser.isAdmin)){ toast('Vetëm admin', 'error'); return; }
  const RATE = 1; 
  state.accounts = state.accounts.map(raw => {
    const acc = new Account(raw);
    const interest = acc.applyInterest(RATE);
    return acc.toJSON();
  });
  persist(); renderApp(); if(manual) toast(`${RATE}% interes aplikuar`, 'info');
}

/* export/import */
function handleExport(){
  const data = JSON.stringify({ users: state.users, accounts: state.accounts }, null, 2);
  const blob = new Blob([data], { type:'application/json' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'banka_export.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('Eksport i kryer', 'info');
}
function handleImport(e){
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader(); r.onload = ev => {
    try{
      const obj = JSON.parse(ev.target.result);
      if(obj.accounts) state.accounts = obj.accounts.map(a => new Account(a).toJSON());
      if(obj.users) state.users = obj.users;
      persist(); renderApp(); toast('Import i suksesshëm', 'success');
    }catch(err){ toast('Gabim në import', 'error'); }
  }; r.readAsText(f);
}
function handleExportMyAccount(){
  if(!state.currentUser || state.currentUser.isAdmin) return toast('Vetëm përdorues normal', 'error');
  const acc = state.accounts.find(a => a.id === state.currentUser.accountId || a.owner === state.currentUser.username);
  if(!acc) return toast('Llogaria nuk u gjet', 'error');
  const blob = new Blob([JSON.stringify(acc, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${acc.owner}_account.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('Eksport i llogarisë suaj', 'info');
}

/* user change password */
function handleUserChangePassword(){
  if(!state.currentUser || state.currentUser.isAdmin) return toast('Vetëm përdorues normal', 'error');
  const oldP = $('userOldPass').value.trim(); const newP = $('userNewPass').value.trim(); const conf = $('userConfirmPass').value.trim();
  if(!oldP || !newP) return toast('Plotëso fushat', 'error'); if(newP !== conf) return toast('Konfirmimi nuk përputhet', 'error');
  const idx = state.accounts.findIndex(a => a.id === state.currentUser.accountId || a.owner === state.currentUser.username);
  if(idx < 0) return toast('Llogaria nuk u gjet', 'error'); if(state.accounts[idx].password !== oldP) return toast('Fjalëkalimi aktual gabim', 'error');
  state.accounts[idx].password = newP; persist(); toast('Fjalëkalimi u ndryshua me sukses', 'success'); $('userOldPass').value=''; $('userNewPass').value=''; $('userConfirmPass').value='';
}


/* seed example function */
function seedExamples(){
  const a = new Account({ owner:'Elisa', type:'Savings', balance:250, password:'123' });
  const b = new Account({ owner:'Mark', type:'Checking', balance:90, password:'123' });
  state.accounts.push(a.toJSON(), b.toJSON()); persist(); renderApp(); toast('Shembuj u shtuan', 'info');
}

/* expose selectAccount (used only if needed) */
window.selectAccount = function(id){ const sel = $('accountSelect'); for(let i=0;i<sel.options.length;i++){ if(sel.options[i].value===id){ sel.selectedIndex = i; break; } } renderLogs(); renderChart(); };

/* Theme */
function toggleTheme(){ state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(state.theme); persist(); }
function applyTheme(t){
  if(t === 'dark'){ document.documentElement.style.setProperty('--bg','#071021'); document.documentElement.style.setProperty('--card','#071827'); document.body.style.color = '#dbe9ff'; } 
  else { document.documentElement.style.removeProperty('--bg'); document.documentElement.style.removeProperty('--card'); document.body.style.color = '#092033'; }
}
