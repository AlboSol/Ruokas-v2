/*
Ruokasi — PWA
- Presets per meal (checkbox + portion slider)
- Macros tracking (kcal, P/C/F)
- Daily targets (min/max + macro goals)
- LocalStorage per day
- Custom foods
- Steps/workout/sleep inputs
- Quick suggestion (A: choose best matching dinner/meal)
*/

const STORAGE_KEY = "ruokasi.v2";
const todayKey = () => new Date().toISOString().slice(0,10);

const round1 = (x) => Math.round(x*10)/10;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const defaultState = () => ({
  day: todayKey(),
  goals: { minKcal: 1900, maxKcal: 2000, p: 140, c: 170, f: 70 },
  activity: { steps: 0, workoutKcal: 0, sleepH: 0 },
  log: [],                 // {id, meal, name, grams, basePer100, totals, ts}
  customFoods: []          // {id, name, per100:{kcal,p,c,f}}
});

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const s = JSON.parse(raw);
    if(!s.day || s.day !== todayKey()){
      // rollover: keep custom foods & goals, reset log/activity
      const ns = defaultState();
      if(s.goals) ns.goals = {...ns.goals, ...s.goals};
      if(s.customFoods) ns.customFoods = s.customFoods;
      return ns;
    }
    return { ...defaultState(), ...s };
  }catch(e){
    return defaultState();
  }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
let currentMeal = "aamiainen";
let selected = new Map(); // key -> {food, grams}


const presets = {
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

function food(name, kcal, p, c, f){
  return { name, per100: {kcal, p, c, f} };
}

function foodU(name, kcal, p, c, f, unit, gramsPerUnit, maxUnits=6, stepUnits=0.5){
  return { name, per100: {kcal, p, c, f}, unit, gramsPerUnit, maxUnits, stepUnits };
}
(name, kcal, p, c, f){
  return { name, per100: {kcal, p, c, f} };
}

function calcTotals(per100, grams){
  const factor = grams / 100;
  return {
    kcal: round1(per100.kcal * factor),
    p: round1(per100.p * factor),
    c: round1(per100.c * factor),
    f: round1(per100.f * factor)
  };
}

function totalsFromLog(){
  return state.log.reduce((acc, it) => ({
    kcal: acc.kcal + it.totals.kcal,
    p: acc.p + it.totals.p,
    c: acc.c + it.totals.c,
    f: acc.f + it.totals.f
  }), {kcal:0,p:0,c:0,f:0});
}

// activity -> kcal burn estimate (very rough)
function burnEstimate(){
  const stepsKcal = state.activity.steps * 0.04;
  const workout = state.activity.workoutKcal || 0;
  return Math.round(stepsKcal + workout);
}

function remainingKcal(){
  // We keep intake goal as maxKcal, but show burn separately; user can adjust goal if desired.
  const eaten = totalsFromLog().kcal;
  return Math.max(0, Math.round(state.goals.maxKcal - eaten));
}

// UI helpers
const $ = (id) => document.getElementById(id);
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"});

function setMeal(meal){
  currentMeal = meal;
  document.querySelectorAll(".seg__btn").forEach(b => b.classList.toggle("is-on", b.dataset.meal === meal));
  selected.clear();
  renderPresets();
}

function renderPresets(){
  const list = $("presetList");
  list.innerHTML = "";
  const all = [...(presets[currentMeal]||[]), ...state.customFoods.map(cf => ({name: cf.name, per100: cf.per100, isCustom:true, id: cf.id}))];

  all.forEach((f, idx) => {
    const key = f.isCustom ? `c:${f.id}` : `p:${currentMeal}:${idx}`;
    const row = document.createElement("div");
    row.className = "item";

    const top = document.createElement("div");
    top.className = "item__top";

    const left = document.createElement("div");
    left.innerHTML = `<div class="item__name">${f.name}</div>
                      <div class="small">per 100g: ${f.per100.kcal} kcal • P ${f.per100.p} • H ${f.per100.c} • R ${f.per100.f}</div>`;
    const badges = document.createElement("div");
    badges.className = "badges";
    badges.innerHTML = `<span class="badge">kcal</span><span class="badge">P/H/R</span>`;

    top.appendChild(left); top.appendChild(badges);

    const controls = document.createElement("div");
    controls.className = "controls";

    const unit = f.unit || "g";
    const gramsPerUnit = Number(f.gramsPerUnit || 1);
    const maxUnits = Number(f.maxUnits || 6);
    const stepUnits = Number(f.stepUnits || 0.5);

    controls.innerHTML = `
      <input class="slider" type="range" min="0" max="${maxUnits}" step="${stepUnits}" value="0" aria-label="units" />
      <div class="minirow">
        <div class="qty"><span class="u">0</span> ${unit}</div>
        <div class="totalsline"><span class="g">0</span> g</div>
      </div>
      <div class="totalsline"><span class="k">0</span> kcal • P <span class="p">0</span> • H <span class="c">0</span> • R <span class="f">0</span></div>
    `;

    const slider = controls.querySelector("input");
    const uEl = controls.querySelector(".u");
    const gEl = controls.querySelector(".g");
    const kEl = controls.querySelector(".k");
    const pEl = controls.querySelector(".p");
    const cEl = controls.querySelector(".c");
    const fEl = controls.querySelector(".f");

    slider.addEventListener("input", () => {
      const units = Number(slider.value);
      const grams = Math.round(units * gramsPerUnit);
      uEl.textContent = units % 1 === 0 ? String(units) : String(units);
      gEl.textContent = grams;

      const t = calcTotals(f.per100, grams);
      kEl.textContent = t.kcal; pEl.textContent = t.p; cEl.textContent = t.c; fEl.textContent = t.f;

      if(grams > 0) selected.set(key, { food: f, grams, totals: t });
      else selected.delete(key);
    });

    row.appendChild(top);
    row.appendChild(controls);
    list.appendChild(row);
  });

  $("mealHint").textContent = `Ateria: ${currentMeal}. Valitse annoskoot (0–300 g) ja paina “Lisää valitut”.`;
}

function renderCustomList(){
  const list = $("customList");
  list.innerHTML = "";
  if(state.customFoods.length === 0){
    list.innerHTML = `<div class="muted">Ei omia ruokia vielä. Lisää vaikka “Hehku 5 dl” tai “0% olut”.</div>`;
    return;
  }
  state.customFoods.forEach(cf => {
    const el = document.createElement("div");
    el.className = "logrow";
    el.innerHTML = `
      <div class="logrow__left">
        <div class="logrow__meal">${cf.name}</div>
        <div class="logrow__meta">per 100g: ${cf.per100.kcal} kcal • P ${cf.per100.p} • H ${cf.per100.c} • R ${cf.per100.f}</div>
      </div>
      <div class="logrow__right">
        <button class="link" data-del="${cf.id}">Poista</button>
      </div>`;
    el.querySelector("[data-del]").addEventListener("click", () => {
      state.customFoods = state.customFoods.filter(x => x.id !== cf.id);
      saveState(); renderAll();
    });
    list.appendChild(el);
  });
}

function renderLog(){
  const list = $("logList");
  list.innerHTML = "";
  if(state.log.length === 0){
    list.innerHTML = `<div class="muted">Ei kirjauksia vielä.</div>`;
    return;
  }

  // newest first
  [...state.log].reverse().forEach(it => {
    const el = document.createElement("div");
    el.className = "logrow";
    el.innerHTML = `
      <div class="logrow__left">
        <div class="logrow__meal">${it.meal.toUpperCase()} • ${it.name}</div>
        <div class="logrow__meta">${it.grams} g • ${fmtTime(it.ts)}</div>
        <div class="logrow__meta">P ${it.totals.p} • H ${it.totals.c} • R ${it.totals.f}</div>
      </div>
      <div class="logrow__right">
        <div><strong>${it.totals.kcal}</strong> kcal</div>
        <button class="link danger" data-del="${it.id}">Poista</button>
      </div>
    `;
    el.querySelector("[data-del]").addEventListener("click", () => {
      state.log = state.log.filter(x => x.id !== it.id);
      saveState(); renderAll();
    });
    list.appendChild(el);
  });
}

function updateTop(){
  const t = totalsFromLog();
  const left = remainingKcal();
  const burn = burnEstimate();

  $("todayLabel").textContent = state.day;
  $("kcalEaten").textContent = Math.round(t.kcal);
  $("kcalLeft").textContent = left;
  $("kcalBurn").textContent = burn;

  $("pNow").textContent = Math.round(t.p);
  $("cNow").textContent = Math.round(t.c);
  $("fNow").textContent = Math.round(t.f);

  $("pGoal").textContent = state.goals.p;
  $("cGoal").textContent = state.goals.c;
  $("fGoal").textContent = state.goals.f;

  $("pBar").style.width = `${clamp((t.p/state.goals.p)*100, 0, 100)}%`;
  $("cBar").style.width = `${clamp((t.c/state.goals.c)*100, 0, 100)}%`;
  $("fBar").style.width = `${clamp((t.f/state.goals.f)*100, 0, 100)}%`;

  // status pill
  const pill = $("statusPill");
  pill.classList.remove("warn","bad");
  const max = state.goals.maxKcal;
  const min = state.goals.minKcal;

  if(t.kcal > max + 50){
    pill.textContent = "Yli";
    pill.style.color = "var(--red)";
    pill.style.background = "color-mix(in srgb, var(--red) 16%, transparent)";
    pill.style.borderColor = "color-mix(in srgb, var(--red) 35%, var(--line))";
  } else if(t.kcal < min - 250){
    pill.textContent = "Matala";
    pill.style.color = "var(--orange)";
    pill.style.background = "color-mix(in srgb, var(--orange) 16%, transparent)";
    pill.style.borderColor = "color-mix(in srgb, var(--orange) 35%, var(--line))";
  } else {
    pill.textContent = "OK";
    pill.style.color = "var(--green)";
    pill.style.background = "color-mix(in srgb, var(--green) 16%, transparent)";
    pill.style.borderColor = "color-mix(in srgb, var(--green) 35%, var(--line))";
  }
}

function quickSuggestion(){
  const t = totalsFromLog();
  const left = remainingKcal();
  const now = new Date();
  const h = now.getHours();

  // Macro gaps
  const gapP = Math.max(0, state.goals.p - t.p);
  const gapC = Math.max(0, state.goals.c - t.c);
  const gapF = Math.max(0, state.goals.f - t.f);

  // Determine slot based on time
  const slot = (h < 10) ? "aamiainen" : (h < 14) ? "lounas" : (h < 17) ? "välipala" : (h < 21) ? "päivällinen" : "iltapala";

  // Candidate templates (grams suggested), based on left kcal bands
  const templates = [
    {name:"Kana + kasvikset", meal:"päivällinen", items:[
      {food: findFood("Kanafile"), grams: 180},
      {food: findFood("Kasvikset"), grams: 300},
    ]},
    {name:"Rahka + marjat", meal:"välipala", items:[
      {food: findFood("Rahka"), grams: 250},
      {food: findFood("Marjat"), grams: 150},
    ]},
    {name:"Ruisleipä + juusto", meal:"iltapala", items:[
      {food: findFood("Ruisleipä"), grams: 70}, // ~1 slice
      {food: findFood("Juusto 15%"), grams: 25},
    ]},
    {name:"Lohi + peruna + kasvikset", meal:"päivällinen", items:[
      {food: findFood("Lohi"), grams: 160},
      {food: findFood("Peruna"), grams: 250},
      {food: findFood("Kasvikset"), grams: 250},
    ]},
    {name:"Puuro + kananmuna", meal:"aamiainen", items:[
      {food: findFood("Puuro (kaurahiutaleet)"), grams: 60}, // oats grams
      {food: findFood("Kananmuna"), grams: 100}, // ~2 eggs
    ]},
  ];

  // Score template: closeness to remaining kcal + fills protein gap
  const scored = templates.map(tpl => {
    const totals = tpl.items.reduce((acc, it) => {
      if(!it.food) return acc;
      const x = calcTotals(it.food.per100, it.grams);
      return {kcal: acc.kcal + x.kcal, p: acc.p + x.p, c: acc.c + x.c, f: acc.f + x.f};
    }, {kcal:0,p:0,c:0,f:0});

    const kcalDiff = Math.abs(left - totals.kcal);
    const pBonus = gapP > 0 ? Math.min(gapP, totals.p) : totals.p * 0.2;
    const score = kcalDiff - (pBonus*2); // lower is better
    return { tpl, totals, score };
  }).sort((a,b)=>a.score-b.score);

  const best = scored[0];
  if(!best || !best.tpl) return "Ei ehdotusta.";

  const sleepNote = state.activity.sleepH && state.activity.sleepH < 6 ? "\n\nHuomio: unta < 6h — pidä ilta kevyenä ja panosta proteiiniin + kuituun." : "";
  const slotNote = (slot !== best.tpl.meal) ? `\n(Arvioitu ajankohta: ${slot}, mutta tämä sopii hyvin nyt.)` : "";

  return `Jäljellä ${left} kcal.\n\nEhdotus: ${best.tpl.name}\n- ${best.tpl.items.filter(i=>i.food).map(i=>`${i.food.name} ${i.grams} g`).join("\n- ")}\n\nYhteensä: ${Math.round(best.totals.kcal)} kcal • P ${Math.round(best.totals.p)} • H ${Math.round(best.totals.c)} • R ${Math.round(best.totals.f)}${slotNote}${sleepNote}`;
}

function findFood(name){
  // Search presets + custom
  for(const meal of Object.keys(presets)){
    const f = presets[meal].find(x => x.name === name);
    if(f) return f;
  }
  const cf = state.customFoods.find(x => x.name === name);
  if(cf) return {name: cf.name, per100: cf.per100, isCustom:true, id: cf.id};
  return null;
}

function addSelected(){
  if(selected.size === 0) return;

  const now = new Date().toISOString();
  selected.forEach((v) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
    state.log.push({
      id,
      meal: currentMeal,
      name: v.food.name,
      grams: v.grams,
      basePer100: v.food.per100,
      totals: v.totals,
      ts: now
    });
  });

  // clear selection UI by rerendering
  selected.clear();
  saveState();
  renderAll();
}

function clearSelected(){
  selected.clear();
  renderPresets();
}

function wireSettings(){
  // Goals inputs
  $("goalMax").value = state.goals.maxKcal;
  $("goalMin").value = state.goals.minKcal;
  $("goalP").value = state.goals.p;
  $("goalC").value = state.goals.c;
  $("goalF").value = state.goals.f;

  $("steps").value = state.activity.steps || 0;
  $("workoutKcal").value = state.activity.workoutKcal || 0;
  $("sleepH").value = state.activity.sleepH || 0;

  const onChange = () => {
    state.goals.maxKcal = Number($("goalMax").value || 2000);
    state.goals.minKcal = Number($("goalMin").value || 1900);
    state.goals.p = Number($("goalP").value || 140);
    state.goals.c = Number($("goalC").value || 170);
    state.goals.f = Number($("goalF").value || 70);

    state.activity.steps = Number($("steps").value || 0);
    state.activity.workoutKcal = Number($("workoutKcal").value || 0);
    state.activity.sleepH = Number($("sleepH").value || 0);

    saveState();
    renderAll();
  };

  ["goalMax","goalMin","goalP","goalC","goalF","steps","workoutKcal","sleepH"].forEach(id => {
    $(id).addEventListener("input", onChange);
  });
}

function openCustomDialog(){
  const dlg = $("customDlg");
  $("cfName").value = "";
  $("cfKcal").value = "";
  $("cfP").value = "";
  $("cfC").value = "";
  $("cfF").value = "";
  dlg.showModal();

  dlg.addEventListener("close", () => {
    if(dlg.returnValue !== "ok") return;
    const name = $("cfName").value.trim();
    if(!name) return;

    const per100 = {
      kcal: Number($("cfKcal").value || 0),
      p: Number($("cfP").value || 0),
      c: Number($("cfC").value || 0),
      f: Number($("cfF").value || 0)
    };

    const id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
    state.customFoods.push({id, name, per100});
    saveState();
    renderAll();
  }, { once:true });
}

function exportData(){
  const payload = {
    exportedAt: new Date().toISOString(),
    day: state.day,
    goals: state.goals,
    activity: state.activity,
    totals: totalsFromLog(),
    log: state.log,
    customFoods: state.customFoods
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ruokasi-${state.day}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetDay(){
  if(!confirm("Nollataanko päivän kirjaukset? (Omat ruoat ja tavoitteet säilyvät)")) return;
  const keepGoals = state.goals;
  const keepCustom = state.customFoods;
  state = defaultState();
  state.goals = keepGoals;
  state.customFoods = keepCustom;
  saveState();
  renderAll();
}

function renderAll(){
  updateTop();
  renderPresets();
  renderCustomList();
  renderLog();
  $("suggestBox").textContent = quickSuggestion();
}

// Service worker registration
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}

window.addEventListener("load", () => {
  // meal tabs
  document.querySelectorAll(".seg__btn").forEach(btn => btn.addEventListener("click", () => setMeal(btn.dataset.meal)));

  $("btnAddSelected").addEventListener("click", addSelected);
  $("btnClearSelected").addEventListener("click", clearSelected);
  $("btnSuggest").addEventListener("click", () => $("suggestBox").textContent = quickSuggestion());
  $("btnOpenCustom").addEventListener("click", openCustomDialog);
  $("btnExport").addEventListener("click", exportData);
  $("btnReset").addEventListener("click", resetDay);

  wireSettings();
  setMeal(currentMeal);
  renderAll();
});
