// Ruokasi v3.3.0.0 – UX/Product spec implementation (PWA)
const STORAGE_KEY = "ruokasi.v3";
const LEGACY_KEY = "ruokasi.v2";
const VERSION = "v3.3.0.0";
const MEAL_ORDER = ["aamiainen","lounas","välipala","päivällinen","iltapala"];

const todayKey = () => new Date().toISOString().slice(0,10);
const round1 = (x) => Math.round(x*10)/10;
const $ = (id) => document.getElementById(id);

function getCss(varName){
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || "#64748B";
}
const MEAL_COLORS = {
  aamiainen: getCss("--meal-aamiainen"),
  lounas: getCss("--meal-lounas"),
  "välipala": getCss("--meal-valipala"),
  "päivällinen": getCss("--meal-paivallinen"),
  iltapala: getCss("--meal-iltapala"),
  muut: getCss("--meal-muut")
};

function slug(s){ return (s||"").toLowerCase().replace(/[^a-z0-9äöå]+/gi,"-").replace(/^-|-$/g,""); }

function foodU(name, kcal, p, c, f, unit, gramsPerUnit, maxUnits=6, stepUnits=0.5){
  return {
    id: "preset:" + slug(name),
    name,
    per100:{kcal,p,c,f},
    unit,
    gramsPerUnit,
    defaultUnits: 1,
    maxUnits,
    stepUnits,
    category: null,
    isFavorite: false,
    isNew: false,
    ean: "",
    image: "",
    usageCount: 0
  };
}

const presetsByMeal = {
  aamiainen: [
    foodU("Puuro (kaurahiutaleet)", 380, 13, 60, 7, "dl hiutaleita", 40, 6, 0.25),
    foodU("Maustamaton rahka", 67, 12, 3.5, 0.2, "purkki", 200, 2, 0.25),
    foodU("Marjat", 50, 1, 12, 0.2, "dl", 60, 6, 0.5),
    foodU("Kananmuna", 155, 13, 1.1, 11, "kpl", 55, 6, 0.5),
    foodU("Ruisleipä", 220, 6, 40, 3, "viipale", 35, 6, 0.5),
    foodU("Paahtoleipä", 265, 8, 49, 3.5, "viipale", 30, 6, 0.5),
    foodU("Juusto 15%", 280, 27, 0, 15, "viipale", 10, 8, 0.5),
    foodU("Kinkku / leikkele", 110, 20, 2, 2, "siivu", 8, 8, 0.5),
    foodU("Maapähkinävoi", 600, 25, 20, 50, "rkl", 15, 6, 0.5),
    foodU("Voi", 717, 1, 0, 81, "rkl", 14, 4, 0.5),
    foodU("Mehu", 45, 0.5, 10, 0, "dl", 100, 6, 0.5),
    foodU("Kahvimaito", 50, 3, 4, 2, "rkl", 15, 6, 0.5)
  ],
  lounas: [
    foodU("Kanafile", 110, 23, 0, 2, "file", 120, 4, 0.25),
    foodU("Riisi (keitetty)", 130, 2.4, 28, 0.3, "dl", 70, 6, 0.5),
    foodU("Peruna", 77, 2, 17, 0.1, "kpl", 80, 6, 0.5),
    foodU("Kasvikset", 30, 2, 5, 0.2, "annos", 250, 3, 0.25),
    foodU("Öljy", 884, 0, 0, 100, "tl", 5, 10, 0.5),
    foodU("Ruisleipä", 220, 6, 40, 3, "viipale", 35, 6, 0.5)
  ],
  "välipala": [
    foodU("Rahka", 67, 12, 3.5, 0.2, "purkki", 200, 2, 0.25),
    foodU("Marjat", 50, 1, 12, 0.2, "dl", 60, 6, 0.5),
    foodU("Banaani", 89, 1.1, 23, 0.3, "kpl", 120, 3, 0.5),
    foodU("Pähkinät", 620, 18, 14, 55, "kourallinen", 30, 6, 0.5),
    foodU("Proteiinijuoma", 60, 10, 4, 1, "pullo", 250, 2, 0.25)
  ],
  "päivällinen": [
    foodU("Kanafile", 110, 23, 0, 2, "file", 120, 4, 0.25),
    foodU("Lohi", 200, 20, 0, 13, "file", 150, 3, 0.25),
    foodU("Jauheliha 10%", 176, 20, 0, 10, "annos", 150, 4, 0.25),
    foodU("Kasvikset", 30, 2, 5, 0.2, "annos", 250, 3, 0.25),
    foodU("Riisi (keitetty)", 130, 2.4, 28, 0.3, "dl", 70, 6, 0.5),
    foodU("Peruna", 77, 2, 17, 0.1, "kpl", 80, 6, 0.5),
    foodU("Öljy", 884, 0, 0, 100, "tl", 5, 10, 0.5),
    foodU("Ruisleipä", 220, 6, 40, 3, "viipale", 35, 6, 0.5),
    foodU("Kukkakaali", 25, 2, 3, 0.2, "kukkosiivu", 25, 10, 1)
  ],
  iltapala: [
    foodU("Ruisleipä", 220, 6, 40, 3, "viipale", 35, 6, 0.5),
    foodU("Paahtoleipä", 265, 8, 49, 3.5, "viipale", 30, 6, 0.5),
    foodU("Juusto 15%", 280, 27, 0, 15, "viipale", 10, 8, 0.5),
    foodU("Rahka", 67, 12, 3.5, 0.2, "purkki", 200, 2, 0.25),
    foodU("Marjat", 50, 1, 12, 0.2, "dl", 60, 6, 0.5),
    foodU("Kananmuna", 155, 13, 1.1, 11, "kpl", 55, 6, 0.5)
  ]
};

function presetsForMeal(meal){
  return (presetsByMeal[meal]||[]).map(p=>({ ...p, category: meal, isFavorite: isFavorite(p.id) }));
}

const VERSION_BADGE = VERSION;

// --- state ---
function defaultState(){
  return {
    selectedDay: todayKey(),
    goals: { minKcal: 1900, maxKcal: 2000, p: 140, c: 170, f: 70 },
    activity: { steps: 0, workoutKcal: 0, sleepH: 0 },
    days: {},
    draft: null,
    customFoods: [],
    mealPlan: { aamiainen:true, lounas:true, "välipala":true, "päivällinen":true, iltapala:true },
    productStats: {}
  };
}

function migrateLegacy(legacy){
  const s = defaultState();
  if(legacy.goals) s.goals = { ...s.goals, ...legacy.goals };
  if(legacy.activity) s.activity = { ...s.activity, ...legacy.activity };
  const day = (legacy.day && typeof legacy.day==="string") ? legacy.day : todayKey();
  s.selectedDay = day;
  s.days[day] = { log: Array.isArray(legacy.log) ? legacy.log : [] };
  s.draft = { date: day, log: JSON.parse(JSON.stringify(s.days[day].log)) };
  if(Array.isArray(legacy.customFoods)){
    s.customFoods = legacy.customFoods.map(cf=>({
      id: cf.id || ("c:" + slug(cf.name) + ":" + Math.random().toString(16).slice(2)),
      name: cf.name || "Tuote",
      per100: cf.per100 || {kcal:0,p:0,c:0,f:0},
      unit: cf.unit || "annos",
      gramsPerUnit: Number(cf.gramsPerUnit || 100) || 100,
      defaultUnits: Number(cf.defaultUnits || 1) || 1,
      maxUnits: Number(cf.maxUnits || 8) || 8,
      stepUnits: Number(cf.stepUnits || 0.5) || 0.5,
      category: cf.category || "aamiainen",
      isFavorite: !!cf.isFavorite,
      isNew: (cf.isNew !== undefined) ? !!cf.isNew : false,
      ean: cf.ean || "",
      image: cf.image || "",
      usageCount: Number(cf.usageCount || 0) || 0
    }));
  }
  return s;
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return { ...defaultState(), ...JSON.parse(raw) };
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if(legacyRaw){
      const migrated = migrateLegacy(JSON.parse(legacyRaw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return defaultState();
  }catch(e){
    return defaultState();
  }
}
let state = loadState();
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// --- day + draft ---
function ensureDay(date){ if(!state.days[date]) state.days[date] = { log: [] }; }
function loadDraftFor(date){
  ensureDay(date);
  state.selectedDay = date;
  const base = state.days[date]?.log || [];
  state.draft = { date, log: JSON.parse(JSON.stringify(base)) };
  saveState();
}
function isDirty(){
  if(!state.draft) return false;
  const committed = JSON.stringify(state.days[state.draft.date]?.log || []);
  const draft = JSON.stringify(state.draft.log || []);
  return committed !== draft;
}
function commitDraft(){
  if(!state.draft) return;
  state.days[state.draft.date] = { log: state.draft.log };
  saveState();
}
function discardDraft(){
  if(!state.draft) return;
  loadDraftFor(state.draft.date);
}

let currentMeal = "aamiainen";
let activeProduct = null;
let pendingDaySwitch = null;

function prettyDate(d){
  try{ const [y,m,dd] = d.split("-"); return `${dd}.${m}.${y}`; }catch(e){ return d; }
}

// --- calc ---
function calcTotals(per100, grams){
  const factor = grams/100;
  return {
    kcal: round1(per100.kcal*factor),
    p: round1(per100.p*factor),
    c: round1(per100.c*factor),
    f: round1(per100.f*factor)
  };
}
function gramsFor(product, units){
  const u = (product.unit || "annos").trim().toLowerCase();
  const amt = Number(units||0);
  if(u === "g") return Math.round(amt);
  if(u === "kg") return Math.round(amt*1000);
  const gpu = Number(product.gramsPerUnit||100) || 100;
  return Math.round(amt * gpu);
}
function totalsFor(product, units){
  const grams = gramsFor(product, units);
  const totals = calcTotals(product.per100, grams);
  return { grams, totals };
}
function draftTotals(){
  const log = state.draft?.log || [];
  return log.reduce((acc,it)=>({
    kcal: acc.kcal + (it.totals?.kcal||0),
    p: acc.p + (it.totals?.p||0),
    c: acc.c + (it.totals?.c||0),
    f: acc.f + (it.totals?.f||0)
  }),{kcal:0,p:0,c:0,f:0});
}
function totalsByMeal(){
  const out = {};
  MEAL_ORDER.forEach(m=> out[m] = {kcal:0,p:0,c:0,f:0});
  (state.draft?.log||[]).forEach(it=>{
    const m = it.meal || "muut";
    if(!out[m]) out[m] = {kcal:0,p:0,c:0,f:0};
    out[m].kcal += (it.totals?.kcal||0);
    out[m].p += (it.totals?.p||0);
    out[m].c += (it.totals?.c||0);
    out[m].f += (it.totals?.f||0);
  });
  return out;
}
function burnEstimate(){ return Math.round((state.activity.steps||0)*0.04 + (state.activity.workoutKcal||0)); }
function remainingKcal(){ return Math.max(0, Math.round(state.goals.maxKcal - draftTotals().kcal)); }

// --- OFF search ---
async function offFetchJSON(url){
  const res = await fetch(url, { headers: { "Accept":"application/json" } });
  if(!res.ok) throw new Error("HTTP "+res.status);
  return await res.json();
}
function offToPer100(nutr){
  const p = Number(nutr.proteins_100g ?? nutr.proteins) || 0;
  const c = Number(nutr.carbohydrates_100g ?? nutr.carbohydrates) || 0;
  const f = Number(nutr.fat_100g ?? nutr.fat) || 0;
  let kcal = Number(nutr["energy-kcal_100g"] ?? nutr["energy-kcal"]) || 0;
  if(!kcal){
    const kj = Number(nutr.energy_100g ?? nutr.energy) || 0;
    if(kj) kcal = Math.round(kj / 4.184);
  }
  if(!kcal && (p||c||f)) kcal = Math.round(p*4 + c*4 + f*9);
  if(!kcal && !(p||c||f)) return null;
  return {kcal, p, c, f};
}
async function offSearch(query){
  const q = (query||"").trim();
  if(!q) return [];
  const isBarcode = /^[0-9]{8,14}$/.test(q);
  if(isBarcode){
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(q)}.json`;
    const js = await offFetchJSON(url);
    if(js && js.status === 1 && js.product){
      const prod = js.product;
      const per100 = prod.nutriments ? offToPer100(prod.nutriments) : null;
      return [{
        name: prod.product_name || prod.generic_name || q,
        brands: prod.brands || "",
        code: prod.code || q,
        per100,
        image: prod.image_small_url || "",
        ean: prod.code || q
      }];
    }
    return [];
  }else{
    const url = "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=10&search_terms=" + encodeURIComponent(q);
    const js = await offFetchJSON(url);
    const prods = (js && js.products) ? js.products : [];
    return prods.slice(0,10).map(p=>({
      name: p.product_name || p.generic_name || "(nimetön tuote)",
      brands: p.brands || "",
      code: p.code || "",
      per100: p.nutriments ? offToPer100(p.nutriments) : null,
      image: p.image_small_url || "",
      ean: p.code || ""
    }));
  }
}
function renderOffResults(items){
  const box = $("offResults");
  const status = $("offStatus");
  box.innerHTML = "";
  if(!items || items.length===0){
    status.textContent = "Ei tuloksia";
    box.innerHTML = `<div class="muted">Ei tuloksia. Kokeile eri hakusanaa tai viivakoodia.</div>`;
    return;
  }
  status.textContent = `${items.length} tulosta`;
  items.forEach(it=>{
    const row = document.createElement("div");
    row.className = "item offItem";
    const per = it.per100;
    const meta = per ? `${Math.round(per.kcal)} kcal / 100g • P ${round1(per.p)} • H ${round1(per.c)} • R ${round1(per.f)}` : "Ravintotiedot puuttuvat osin";
    row.innerHTML = `
      <div class="offItem__main">
        <div class="offItem__title">${it.name}</div>
        <div class="offItem__meta">${(it.brands||"").trim()}${it.code? " • "+it.code:""}<br>${meta}</div>
      </div>
      <button class="ghost" type="button">Käytä</button>
    `;
    row.querySelector("button").addEventListener("click", ()=>{
      $("cfName").value = it.name;
      if(it.per100){
        $("cfKcal").value = Math.round(it.per100.kcal);
        $("cfP").value = round1(it.per100.p);
        $("cfC").value = round1(it.per100.c);
        $("cfF").value = round1(it.per100.f);
      }
      if(it.ean) $("cfEAN").value = it.ean;
      if(it.image) $("cfImg").value = it.image;
      // close only list
      box.innerHTML = "";
      status.textContent = "Valittu";
    });
    box.appendChild(row);
  });
}
async function runOffSearch(){
  const q = ($("offQuery").value||"").trim();
  $("offStatus").textContent = "Haetaan…";
  try{
    const items = await offSearch(q);
    renderOffResults(items);
  }catch(e){
    $("offStatus").textContent = "Virhe";
    $("offResults").innerHTML = `<div class="muted">Haku epäonnistui. Kokeile hetken päästä.</div>`;
  }
}

// --- categories ---
function allCategories(){
  const set = new Set(MEAL_ORDER);
  (state.customFoods||[]).forEach(p=>{ if(p.category) set.add(p.category); });
  return Array.from(set);
}
function populateCategoryLists(){
  const cats = allCategories();
  $("catList").innerHTML = cats.map(c=>`<option value="${c}"></option>`).join("");
  $("catList2").innerHTML = cats.map(c=>`<option value="${c}"></option>`).join("");
}

// --- stats/favorites ---
function getUsage(id){ return Number(state.productStats?.[id]?.usageCount || 0); }
function bumpUsage(id){
  if(!state.productStats) state.productStats = {};
  if(!state.productStats[id]) state.productStats[id] = { usageCount: 0 };
  state.productStats[id].usageCount += 1;
}
function toggleFavorite(pid){
  const c = (state.customFoods||[]).find(x=>x.id===pid);
  if(c){
    c.isFavorite = !c.isFavorite;
  }else{
    if(!state.productStats) state.productStats = {};
    if(!state.productStats[pid]) state.productStats[pid] = { usageCount: 0 };
    state.productStats[pid].isFavorite = !state.productStats[pid].isFavorite;
  }
  saveState();
}
function isFavorite(pid){
  const c = (state.customFoods||[]).find(x=>x.id===pid);
  if(c) return !!c.isFavorite;
  return !!(state.productStats?.[pid]?.isFavorite);
}
function isNewProduct(pid){
  const c = (state.customFoods||[]).find(x=>x.id===pid);
  return c ? !!c.isNew : false;
}
function clearNew(pid){
  const c = (state.customFoods||[]).find(x=>x.id===pid);
  if(c) c.isNew = false;
}

// --- products list ---
function productsForMeal(meal){
  const preset = presetsForMeal(meal);
  const custom = (state.customFoods||[]).filter(p=> (p.category||"aamiainen") === meal).map(p=>({ ...p }));
  const list = [...preset, ...custom];
  list.forEach(p=>{ p.usageCount = getUsage(p.id) || p.usageCount || 0; p.isFavorite = isFavorite(p.id) || p.isFavorite; });
  list.sort((a,b)=>{
    const af = !!a.isFavorite, bf = !!b.isFavorite;
    if(af!==bf) return bf-af;
    const au=a.usageCount||0, bu=b.usageCount||0;
    if(au!==bu) return bu-au;
    return (a.name||"").localeCompare(b.name||"","fi");
  });
  return list;
}
function renderProductList(){
  const box = $("productList");
  box.innerHTML = "";
  const items = productsForMeal(currentMeal);
  if(items.length===0){
    box.innerHTML = `<div class="muted">Ei tuotteita tälle kategorialle vielä. Lisää tuote yläpuolelta.</div>`;
    return;
  }
  items.forEach(p=>{
    const row = document.createElement("div");
    row.className = "productRow";
    row.dataset.pid = p.id;
    const star = p.isNew ? "⭐" : "";
    const heart = p.isFavorite ? "❤️" : "🤍";
    const defU = Number(p.defaultUnits || 1) || 1;
    const {grams, totals} = totalsFor(p, defU);
    const serving = `${defU} ${p.unit||"annos"}`;
    row.innerHTML = `
      <div class="productMain">
        <div class="productTop">
          <span class="star" aria-hidden="true">${star}</span>
          <button class="heart" type="button" aria-label="Suosikki">${heart}</button>
          <div class="productNameLine" title="${p.name}">${p.name}</div>
        </div>
        <div class="productSub">${serving} • ${grams} g</div>
      </div>
      <div class="productRight">
        <div class="kcalSmall">${Math.round(totals.kcal)} kcal</div>
        <div class="small">P ${Math.round(totals.p)} • H ${Math.round(totals.c)} • R ${Math.round(totals.f)}</div>
      </div>
    `;
    row.querySelector(".heart").addEventListener("click",(e)=>{
      e.stopPropagation();
      toggleFavorite(p.id);
      renderAll();
    });
    row.addEventListener("click", ()=> openProductModal(p.id));
    box.appendChild(row);
  });
}
function findProductById(pid){
  const c = (state.customFoods||[]).find(x=>x.id===pid);
  if(c) return c;
  for(const meal of Object.keys(presetsByMeal)){
    const p = (presetsByMeal[meal]||[]).find(x=>x.id===pid);
    if(p) return { ...p, category: meal, isFavorite: isFavorite(pid) };
  }
  return null;
}

// --- product modal ---
function openProductModal(pid){
  const p = findProductById(pid);
  if(!p) return;
  activeProduct = { ...p, isFavorite: isFavorite(pid), isNew: isNewProduct(pid) };
  $("pmName").textContent = activeProduct.name;
  $("productTitle").textContent = activeProduct.name;
  $("pmUnit").textContent = activeProduct.unit || "annos";
  $("pmUnits").textContent = String(activeProduct.defaultUnits || 1);
  $("pmHeart").textContent = activeProduct.isFavorite ? "❤️" : "🤍";
  $("pmMeta").textContent = `${activeProduct.category||currentMeal} • ${activeProduct.ean ? "EAN " + activeProduct.ean : "EAN –"}`;
  const img = $("pmImg");
  if(activeProduct.image){
    img.src = activeProduct.image;
    img.classList.remove("is-hidden");
  }else{
    img.classList.add("is-hidden");
  }
  $("pmNew").style.display = activeProduct.isNew ? "inline-flex" : "none";
  updateProductModalTotals();
  $("pmEditArea").classList.add("is-hidden");
  $("productModal").classList.remove("is-hidden");
}
function closeProductModal(){ $("productModal").classList.add("is-hidden"); activeProduct=null; }
function updateProductModalTotals(){
  if(!activeProduct) return;
  const units = Number($("pmUnits").textContent||1) || 1;
  const {grams, totals} = totalsFor(activeProduct, units);
  $("pmUnit").textContent = activeProduct.unit || "annos";
  $("pmGrams").textContent = grams;
  $("pmKcal").textContent = Math.round(totals.kcal);
  $("pmP").textContent = Math.round(totals.p);
  $("pmC").textContent = Math.round(totals.c);
  $("pmF").textContent = Math.round(totals.f);
}
function flashRow(pid){
  document.querySelectorAll(".productRow").forEach(r=>{
    if(r.dataset.pid === pid){
      r.classList.add("is-flash");
      setTimeout(()=>r.classList.remove("is-flash"), 700);
    }
  });
}
function addToEatenFromModal(){
  if(!activeProduct || !state.draft) return;
  const pid = activeProduct.id;
  const units = Number($("pmUnits").textContent||1) || 1;
  const {grams, totals} = totalsFor(activeProduct, units);
  const now = new Date().toISOString();
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
  state.draft.log.push({
    id,
    day: state.draft.date,
    meal: currentMeal,
    productId: pid,
    name: activeProduct.name,
    units,
    unit: activeProduct.unit || "annos",
    grams,
    totals,
    ts: now
  });
  bumpUsage(pid);
  clearNew(pid);
  saveState();
  closeProductModal();
  renderAll();
  flashRow(pid);
}

// --- product editing ---
function showEdit(){
  if(!activeProduct) return;
  $("pmEditArea").classList.remove("is-hidden");
  $("pmEName").value = activeProduct.name || "";
  $("pmECat").value = activeProduct.category || currentMeal;
  $("pmEKcal").value = activeProduct.per100?.kcal ?? "";
  $("pmEP").value = activeProduct.per100?.p ?? "";
  $("pmEC").value = activeProduct.per100?.c ?? "";
  $("pmEF").value = activeProduct.per100?.f ?? "";
  $("pmEUnit").value = activeProduct.unit || "";
  $("pmEGPU").value = activeProduct.gramsPerUnit || "";
  $("pmEEAN").value = activeProduct.ean || "";
  $("pmEImg").value = activeProduct.image || "";
}
function hideEdit(){ $("pmEditArea").classList.add("is-hidden"); }
function saveEdit(){
  if(!activeProduct) return;
  const name = ($("pmEName").value||"").trim();
  const cat = ($("pmECat").value||currentMeal).trim() || currentMeal;
  const kcal = Number($("pmEKcal").value||0);
  const p = Number($("pmEP").value||0);
  const c = Number($("pmEC").value||0);
  const f = Number($("pmEF").value||0);
  const unit = ($("pmEUnit").value||"annos").trim() || "annos";
  const gpu = Number($("pmEGPU").value||100) || 100;
  const ean = ($("pmEEAN").value||"").trim();
  const img = ($("pmEImg").value||"").trim();
  if(!name || !kcal){ alert("Täytä vähintään nimi ja kalorit / 100g."); return; }

  let target = (state.customFoods||[]).find(x=>x.id===activeProduct.id);
  if(!target && String(activeProduct.id||"").startsWith("preset:")){
    const id = crypto.randomUUID ? crypto.randomUUID() : ("c:" + Math.random().toString(16).slice(2));
    target = {
      id,
      name,
      per100:{kcal,p,c,f},
      unit,
      gramsPerUnit: gpu,
      defaultUnits: activeProduct.defaultUnits||1,
      maxUnits: activeProduct.maxUnits||10,
      stepUnits: activeProduct.stepUnits||0.5,
      category: cat,
      isFavorite: isFavorite(activeProduct.id),
      isNew: true,
      ean,
      image: img,
      usageCount: 0
    };
    state.customFoods.push(target);
    activeProduct.id = id;
  }else{
    target.name = name;
    target.category = cat;
    target.per100 = {kcal,p,c,f};
    target.unit = unit;
    target.gramsPerUnit = gpu;
    target.ean = ean;
    target.image = img;
  }
  saveState();
  activeProduct = { ...target, isFavorite: isFavorite(target.id), isNew: isNewProduct(target.id) };
  $("pmName").textContent = activeProduct.name;
  $("productTitle").textContent = activeProduct.name;
  hideEdit();
  updateProductModalTotals();
  renderAll();
}

// --- add product modal ---
function openCustomModal(){
  populateCategoryLists();
  $("cfCat").value = currentMeal;
  $("offStatus").textContent = "–";
  $("offResults").innerHTML = "";
  $("customModal").classList.remove("is-hidden");
}
function closeCustomModal(){ $("customModal").classList.add("is-hidden"); }
function saveNewProduct(){
  const name = ($("cfName").value||"").trim();
  const cat = ($("cfCat").value||currentMeal).trim() || currentMeal;
  const kcal = Number($("cfKcal").value||0);
  const p = Number($("cfP").value||0);
  const c = Number($("cfC").value||0);
  const f = Number($("cfF").value||0);
  const unit = ($("cfUnit").value||"annos").trim() || "annos";
  const gpu = Number($("cfGPU").value||100) || 100;
  const ean = ($("cfEAN").value||"").trim();
  const img = ($("cfImg").value||"").trim();
  if(!name || !kcal){ alert("Täytä vähintään nimi ja kalorit / 100g."); return; }
  const id = crypto.randomUUID ? crypto.randomUUID() : ("c:" + Math.random().toString(16).slice(2));
  state.customFoods.push({
    id,
    name,
    per100:{kcal,p,c,f},
    unit,
    gramsPerUnit: gpu,
    defaultUnits: 1,
    maxUnits: 10,
    stepUnits: 0.5,
    category: cat,
    isFavorite: false,
    isNew: true,
    ean,
    image: img,
    usageCount: 0
  });
  ["cfName","cfKcal","cfP","cfC","cfF","cfUnit","cfGPU","cfEAN","cfImg"].forEach(id=>{ const el=$(id); if(el) el.value=""; });
  $("cfCat").value = cat;
  saveState();
  closeCustomModal();
  renderAll();
}

// --- log render ---
function fmtTime(iso){ return new Date(iso).toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"}); }
function renderLog(){
  const list = $("logList");
  list.innerHTML = "";
  const log = state.draft?.log || [];
  if(log.length===0){ list.innerHTML = `<div class="muted">Ei kirjauksia vielä.</div>`; return; }
  [...log].reverse().forEach(it=>{
    const el=document.createElement("div");
    el.className="logrow";
    el.innerHTML = `<div class="logrow__left">
        <div class="logrow__meal">${(it.meal||"").toUpperCase()} • ${it.name}</div>
        <div class="logrow__meta">${it.units} ${it.unit} • ${it.grams} g • ${fmtTime(it.ts)}</div>
        <div class="logrow__meta">P ${Math.round(it.totals.p)} • H ${Math.round(it.totals.c)} • R ${Math.round(it.totals.f)}</div>
      </div>
      <div class="logrow__right">
        <div><strong>${Math.round(it.totals.kcal)}</strong> kcal</div>
        <button class="link danger" data-del="${it.id}">Poista</button>
      </div>`;
    el.querySelector("[data-del]").addEventListener("click", ()=>{
      state.draft.log = state.draft.log.filter(x=>x.id!==it.id);
      saveState();
      renderAll();
    });
    list.appendChild(el);
  });
}

// --- ring + bars ---
function setRingAndBars(){
  const totals = draftTotals();
  const perMeal = totalsByMeal();
  const ring = $("mealRing");
  const totalK = Math.max(0.0001, totals.kcal);
  let acc = 0;
  const segments = [];
  MEAL_ORDER.forEach(m=>{
    const k = perMeal[m]?.kcal || 0;
    const deg = (k/totalK)*360;
    const start = acc;
    const end = acc + deg;
    acc = end;
    if(deg > 0.5) segments.push(`${MEAL_COLORS[m]} ${start}deg ${end}deg`);
  });
  if(segments.length===0) segments.push(`${MEAL_COLORS.muut} 0deg 360deg`);
  ring.style.background = `conic-gradient(${segments.join(",")})`;

  function setSegBar(el, key){
    const total = Math.max(0.0001, totals[key]);
    let pos = 0;
    const stops = [];
    MEAL_ORDER.forEach(m=>{
      const v = perMeal[m]?.[key] || 0;
      const pct = (v/total)*100;
      const start = pos;
      const end = pos + pct;
      pos = end;
      if(pct > 0.2) stops.push(`${MEAL_COLORS[m]} ${start}% ${end}%`);
    });
    if(stops.length===0) stops.push(`var(--line) 0% 100%`);
    el.style.background = `linear-gradient(90deg, ${stops.join(",")})`;
  }
  setSegBar($("pBar"), "p");
  setSegBar($("cBar"), "c");
  setSegBar($("fBar"), "f");
}

function updateTop(){
  const t = draftTotals();
  $("todayLabel").textContent = (state.selectedDay === todayKey() ? "Tänään" : "Päivä") + " • " + prettyDate(state.selectedDay);
  $("dayPretty").textContent = prettyDate(state.selectedDay);
  $("kcalEaten").textContent = Math.round(t.kcal);
  $("kcalLeft").textContent = remainingKcal();
  $("kcalBurn").textContent = burnEstimate();
  $("pNow").textContent = Math.round(t.p);
  $("cNow").textContent = Math.round(t.c);
  $("fNow").textContent = Math.round(t.f);
  $("pGoal").textContent = state.goals.p;
  $("cGoal").textContent = state.goals.c;
  $("fGoal").textContent = state.goals.f;
  $("dayState").textContent = isDirty() ? "Muuttunut" : "Tallennettu";
  $("btnCalendar").classList.toggle("is-attn", state.selectedDay !== todayKey());
  setRingAndBars();
}

// --- breakdown modal ---
function openBreakdown(focusKey){
  const perMeal = totalsByMeal();
  const titleMap = {kcal:"Kalorit", p:"Proteiini", c:"Hiilarit", f:"Rasva"};
  $("breakTitle").textContent = titleMap[focusKey] || "Ateriat";
  const body = $("breakdownBody");
  body.innerHTML = "";
  const log = state.draft?.log || [];
  MEAL_ORDER.forEach(meal=>{
    const tot = perMeal[meal] || {kcal:0,p:0,c:0,f:0};
    const mealLog = log.filter(x=>x.meal===meal);
    const sumLine = focusKey==="kcal"
      ? `${Math.round(tot.kcal)} kcal • P ${Math.round(tot.p)} • H ${Math.round(tot.c)} • R ${Math.round(tot.f)}`
      : `${focusKey.toUpperCase()} ${Math.round(tot[focusKey])}`;
    const det = document.createElement("details");
    det.className = "details";
    det.innerHTML = `<summary style="display:flex;justify-content:space-between;gap:10px">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:99px;background:${MEAL_COLORS[meal]};margin-right:8px"></span>${meal.charAt(0).toUpperCase()+meal.slice(1)}</span>
        <span class="muted">${sumLine}</span>
      </summary>
      <div style="margin-top:10px;display:grid;gap:8px"></div>`;
    const inner = det.querySelector("div");
    if(mealLog.length===0){
      inner.innerHTML = `<div class="muted">Ei kirjauksia.</div>`;
    }else{
      mealLog.forEach(it=>{
        const r=document.createElement("div");
        r.className="logrow";
        r.innerHTML = `<div class="logrow__left">
            <div class="logrow__meal">${it.name}</div>
            <div class="logrow__meta">${it.units} ${it.unit} • ${it.grams} g</div>
          </div>
          <div class="logrow__right">
            <div><strong>${Math.round(it.totals.kcal)}</strong> kcal</div>
            <div class="muted" style="font-size:12px">P ${Math.round(it.totals.p)} • H ${Math.round(it.totals.c)} • R ${Math.round(it.totals.f)}</div>
          </div>`;
        inner.appendChild(r);
      });
    }
    body.appendChild(det);
  });
  $("breakdownModal").classList.remove("is-hidden");
}
function closeBreakdown(){ $("breakdownModal").classList.add("is-hidden"); }

// --- export/reset ---
function exportData(){
  const date = state.selectedDay;
  const payload = {
    exportedAt: new Date().toISOString(),
    date,
    goals: state.goals,
    activity: state.activity,
    day: state.days[date] || {log:[]},
    draft: state.draft
  };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`ruokasi-${date}.json`; a.click();
  URL.revokeObjectURL(url);
}
function resetDay(){
  if(!confirm("Nollataanko päivän kirjaukset?")) return;
  state.draft.log = [];
  saveState();
  renderAll();
}

// --- settings ---
function wireSettings(){
  $("goalMax").value = state.goals.maxKcal;
  $("goalMin").value = state.goals.minKcal;
  $("goalP").value = state.goals.p;
  $("goalC").value = state.goals.c;
  $("goalF").value = state.goals.f;
  $("steps").value = state.activity.steps||0;
  $("workoutKcal").value = state.activity.workoutKcal||0;
  $("sleepH").value = state.activity.sleepH||0;

  const onChange = ()=>{
    state.goals.maxKcal = Number($("goalMax").value||2000);
    state.goals.minKcal = Number($("goalMin").value||1900);
    state.goals.p = Number($("goalP").value||140);
    state.goals.c = Number($("goalC").value||170);
    state.goals.f = Number($("goalF").value||70);
    state.activity.steps = Number($("steps").value||0);
    state.activity.workoutKcal = Number($("workoutKcal").value||0);
    state.activity.sleepH = Number($("sleepH").value||0);
    saveState(); renderAll();
  };
  ["goalMax","goalMin","goalP","goalC","goalF","steps","workoutKcal","sleepH"].forEach(id=>$(id).addEventListener("input", onChange));
}

// --- recommendations (keep existing behavior; favorites preferred by name) ---
function foodByNamePreferFavorite(name){
  const fav = (state.customFoods||[]).find(x=>x.name===name && x.isFavorite);
  if(fav) return fav;
  const cf = (state.customFoods||[]).find(x=>x.name===name);
  if(cf) return cf;
  for(const meal of Object.keys(presetsByMeal)){
    const p = (presetsByMeal[meal]||[]).find(x=>x.name===name);
    if(p) return p;
  }
  return null;
}
function scoreMealOption(gaps, totals){
  const takeP = Math.min(Math.max(0,gaps.p), totals.p);
  const takeC = Math.min(Math.max(0,gaps.c), totals.c);
  const fatPenalty = (gaps.f < 0) ? totals.f * 2 : Math.max(0, totals.f - Math.max(0,gaps.f)) * 1.5;
  const kcalPenalty = Math.max(0, totals.kcal - Math.max(0,gaps.kcal)) * 0.5;
  return (takeP*2 + takeC) - fatPenalty - kcalPenalty;
}
function calcOptionTotals(items){
  let totals = {kcal:0,p:0,c:0,f:0};
  let outItems = [];
  for(const it of items){
    const f = foodByNamePreferFavorite(it.n);
    if(!f) return null;
    const grams = Math.round((f.gramsPerUnit||100) * it.u);
    const t = calcTotals(f.per100, grams);
    totals = {kcal:totals.kcal+t.kcal,p:totals.p+t.p,c:totals.c+t.c,f:totals.f+t.f};
    outItems.push({name: it.n, units: it.u, unit: f.unit||"annos", grams});
  }
  return {totals, items: outItems};
}
function computeBestForMeal(meal, gaps){
  const options = {
    lounas: [
      {name:"Kana + kasvikset", items:[{n:"Kanafile", u:1.5},{n:"Kasvikset", u:1.0}]},
      {name:"Kana + riisi + kasvikset", items:[{n:"Kanafile", u:1.2},{n:"Riisi (keitetty)", u:2.0},{n:"Kasvikset", u:1.0}]},
      {name:"Ruisleipä + juusto + kinkku", items:[{n:"Ruisleipä", u:2.0},{n:"Juusto 15%", u:2.0},{n:"Kinkku / leikkele", u:3.0}]}
    ],
    "välipala": [
      {name:"Rahka + marjat", items:[{n:"Rahka", u:1.0},{n:"Marjat", u:2.0}]},
      {name:"Rahka + banaani", items:[{n:"Rahka", u:1.0},{n:"Banaani", u:1.0}]},
      {name:"Proteiinijuoma", items:[{n:"Proteiinijuoma", u:1.0}]}
    ],
    "päivällinen": [
      {name:"Kana + kasvikset", items:[{n:"Kanafile", u:1.5},{n:"Kasvikset", u:1.2}]},
      {name:"Lohi + peruna + kasvikset", items:[{n:"Lohi", u:1.0},{n:"Peruna", u:3.0},{n:"Kasvikset", u:1.0}]},
      {name:"Jauheliha + kasvikset", items:[{n:"Jauheliha 10%", u:1.0},{n:"Kasvikset", u:1.2}]}
    ],
    iltapala: [
      {name:"Ruisleipä + juusto", items:[{n:"Ruisleipä", u:2.0},{n:"Juusto 15%", u:2.0}]},
      {name:"Rahka + marjat", items:[{n:"Rahka", u:1.0},{n:"Marjat", u:1.5}]},
      {name:"Kananmuna + ruisleipä", items:[{n:"Kananmuna", u:2.0},{n:"Ruisleipä", u:1.5}]}
    ],
    aamiainen: [
      {name:"Puuro + maapähkinävoi", items:[{n:"Puuro (kaurahiutaleet)", u:1.5},{n:"Maapähkinävoi", u:1.0}]},
      {name:"Kananmunat + ruisleipä", items:[{n:"Kananmuna", u:2.0},{n:"Ruisleipä", u:2.0}]},
      {name:"Rahka + marjat", items:[{n:"Maustamaton rahka", u:1.0},{n:"Marjat", u:2.0}]}
    ]
  };
  const cand = options[meal] || [];
  let best = null;
  cand.forEach(o=>{
    const res = calcOptionTotals(o.items);
    if(!res) return;
    const score = scoreMealOption(gaps, res.totals);
    if(!best || score > best.score) best = { meal, title:o.name, totals:res.totals, items:res.items, score };
  });
  return best;
}
function buildOptionLines(items){
  return items.map(it=>`- ${it.name} ${it.units} ${it.unit} (${it.grams} g)`).join("\n");
}
function applyOptionToGaps(gaps, totals){
  return { kcal:gaps.kcal - totals.kcal, p:gaps.p - totals.p, c:gaps.c - totals.c, f:gaps.f - totals.f };
}
function quickSuggestion(){
  const eaten = draftTotals();
  const leftKcal = remainingKcal();
  let gaps = {
    kcal: leftKcal,
    p: state.goals.p - eaten.p,
    c: state.goals.c - eaten.c,
    f: state.goals.f - eaten.f
  };
  const enabled = MEAL_ORDER.filter(m => state.mealPlan?.[m]);
  if(enabled.length === 0) return "Kaikki ateriat on poistettu tältä päivältä (täpät).";

  let out = [];
  out.push(`Syöty: ${Math.round(eaten.kcal)} kcal • P ${Math.round(eaten.p)} • H ${Math.round(eaten.c)} • R ${Math.round(eaten.f)}`);
  out.push(`Tavoite: ${state.goals.minKcal}–${state.goals.maxKcal} kcal • P ${state.goals.p} • H ${state.goals.c} • R ${state.goals.f}`);
  out.push(`Jäljellä (max): ${leftKcal} kcal`);
  out.push("");

  enabled.slice(0,3).forEach(meal=>{
    const best = computeBestForMeal(meal, gaps);
    if(!best){
      out.push(`${meal.toUpperCase()}: ei ehdotusta (puuttuu ruokia).\n`);
      return;
    }
    out.push(`${meal.toUpperCase()}: ${best.title}`);
    out.push(buildOptionLines(best.items));
    out.push(`Yhteensä: ${Math.round(best.totals.kcal)} kcal • P ${Math.round(best.totals.p)} • H ${Math.round(best.totals.c)} • R ${Math.round(best.totals.f)}`);
    out.push("");
    gaps = applyOptionToGaps(gaps, best.totals);
  });

  if(gaps.f < -5) out.push("Huom: rasvaa on jo reilusti – suositukset painottuvat vähärasvaisempiin vaihtoehtoihin.");
  if(gaps.p > 15) out.push("Huom: proteiinia puuttuu – priorisoi kana/rahka/proteiinijuoma.");

  return out.join("\n");
}
function renderMealPlan(){
  const box = $("mealPlan");
  box.innerHTML = "";
  if(!state.mealPlan) state.mealPlan = { aamiainen:true, lounas:true, "välipala":true, "päivällinen":true, iltapala:true };
  MEAL_ORDER.forEach(m=>{
    const chip = document.createElement("label");
    chip.className = "chip";
    chip.innerHTML = `<input type="checkbox" ${state.mealPlan[m] ? "checked":""} /> <span>${m.charAt(0).toUpperCase()+m.slice(1)}</span>`;
    chip.querySelector("input").addEventListener("change", (e)=>{
      state.mealPlan[m] = e.target.checked;
      saveState();
      $("suggestBox").textContent = quickSuggestion();
    });
    box.appendChild(chip);
  });
}

// --- day picker + save confirm ---
function openDayModal(){
  $("dayPicker").value = state.selectedDay;
  $("dayModal").classList.remove("is-hidden");
}
function closeDayModal(){ $("dayModal").classList.add("is-hidden"); }
function requestSwitchDay(targetDate){
  if(!targetDate) return;
  pendingDaySwitch = targetDate;
  if(isDirty()){
    $("saveConfirmDay").textContent = "Päivä: " + prettyDate(state.selectedDay);
    $("saveConfirmModal").classList.remove("is-hidden");
  }else{
    loadDraftFor(targetDate);
    renderAll();
  }
}
function onSaveYes(){
  commitDraft();
  $("saveConfirmModal").classList.add("is-hidden");
  const to = pendingDaySwitch;
  pendingDaySwitch = null;
  loadDraftFor(to);
  renderAll();
}
function onSaveNo(){
  discardDraft();
  $("saveConfirmModal").classList.add("is-hidden");
  const to = pendingDaySwitch;
  pendingDaySwitch = null;
  loadDraftFor(to);
  renderAll();
}
function onSaveCancel(){
  $("saveConfirmModal").classList.add("is-hidden");
  pendingDaySwitch = null;
}

// --- render ---
function setMeal(meal){
  currentMeal = meal;
  document.querySelectorAll(".seg__btn").forEach(b=>b.classList.toggle("is-on", b.dataset.meal===meal));
  renderProductList();
}
function renderAll(){
  if(!state.draft || state.draft.date !== state.selectedDay) loadDraftFor(state.selectedDay);
  populateCategoryLists();
  updateTop();
  renderProductList();
  renderLog();
  renderMealPlan();
  $("suggestBox").textContent = quickSuggestion();
  $("suggestUpdated").textContent = "Päivitetty " + new Date().toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"});
}

// --- service worker ---
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=> navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

// --- wire UI ---
window.addEventListener("load", ()=>{
  $("versionBadge").textContent = VERSION_BADGE;

  if(!state.draft) loadDraftFor(state.selectedDay);
  ensureDay(state.selectedDay);

  wireSettings();
  renderAll();

  document.querySelectorAll(".seg__btn").forEach(btn=>btn.addEventListener("click", ()=>setMeal(btn.dataset.meal)));

  $("btnCloseProduct").addEventListener("click", closeProductModal);
  $("pmCancel").addEventListener("click", closeProductModal);
  $("pmAccept").addEventListener("click", addToEatenFromModal);
  $("pmDec").addEventListener("click", ()=>{
    const step = Number(activeProduct?.stepUnits||0.5)||0.5;
    const cur = Number($("pmUnits").textContent||1)||1;
    const next = Math.max(0, roundToStep(cur - step, step));
    $("pmUnits").textContent = String(next);
    updateProductModalTotals();
  });
  $("pmInc").addEventListener("click", ()=>{
    const step = Number(activeProduct?.stepUnits||0.5)||0.5;
    const maxU = Number(activeProduct?.maxUnits||10)||10;
    const cur = Number($("pmUnits").textContent||1)||1;
    const next = Math.min(maxU, roundToStep(cur + step, step));
    $("pmUnits").textContent = String(next);
    updateProductModalTotals();
  });
  $("pmHeart").addEventListener("click", ()=>{
    if(!activeProduct) return;
    toggleFavorite(activeProduct.id);
    activeProduct.isFavorite = isFavorite(activeProduct.id);
    $("pmHeart").textContent = activeProduct.isFavorite ? "❤️" : "🤍";
    renderAll();
  });

  $("pmEdit").addEventListener("click", showEdit);
  $("pmCancelEdit").addEventListener("click", hideEdit);
  $("pmSaveEdit").addEventListener("click", saveEdit);

  $("btnOpenCustom").addEventListener("click", openCustomModal);
  $("btnCloseCustom").addEventListener("click", closeCustomModal);
  $("btnCancelCustom").addEventListener("click", closeCustomModal);
  $("btnSaveCustom").addEventListener("click", saveNewProduct);
  $("btnOffSearch").addEventListener("click", (e)=>{ e.preventDefault(); runOffSearch(); });

  $("btnCalendar").addEventListener("click", openDayModal);
  $("btnCloseDay").addEventListener("click", closeDayModal);
  $("btnToday").addEventListener("click", ()=>{ requestSwitchDay(todayKey()); closeDayModal(); });
  $("btnDayApply").addEventListener("click", ()=>{ requestSwitchDay($("dayPicker").value); closeDayModal(); });

  $("btnCloseSaveConfirm").addEventListener("click", onSaveCancel);
  $("btnSaveYes").addEventListener("click", onSaveYes);
  $("btnSaveNo").addEventListener("click", onSaveNo);
  $("btnSaveCancel").addEventListener("click", onSaveCancel);

  $("mealRing").addEventListener("click", ()=>openBreakdown("kcal"));
  $("pBar").addEventListener("click", ()=>openBreakdown("p"));
  $("cBar").addEventListener("click", ()=>openBreakdown("c"));
  $("fBar").addEventListener("click", ()=>openBreakdown("f"));
  $("btnCloseBreak").addEventListener("click", closeBreakdown);
  $("btnBreakClose").addEventListener("click", closeBreakdown);

  $("btnExport").addEventListener("click", exportData);
  $("btnReset").addEventListener("click", resetDay);
  $("btnSuggest").addEventListener("click", ()=>{
    $("suggestBox").textContent = quickSuggestion();
    $("suggestUpdated").textContent = "Päivitetty " + new Date().toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"});
  });

  setMeal(currentMeal);
});

function roundToStep(val, step){
  const s = Number(step||0.5);
  return Math.round(val/s)*s;
}
