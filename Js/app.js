(() => {
  'use strict';

  const ROOT = document.body?.dataset?.root || './';
  const MAX_CHARACTERS = 2;
  const GLOBAL_COMMON_BUFF_CAP = 1000;
  const LS = {
    ACTIVE: 'opa_active_character',
    LAST_SUMMARY: 'opa_last_whatsapp_summary',
    ADMIN_SELECTED_USER: 'opa_admin_selected_user',
    ADMIN_SELECTED_CHAR: 'opa_admin_selected_char',
  };

  const ATTRS = [
    ['for', 'Força', 'FOR', 'attr_for', 'buff_for'],
    ['res', 'Resistência', 'RES', 'attr_res', 'buff_res'],
    ['agi', 'Agilidade', 'AGI', 'attr_agi', 'buff_agi'],
    ['pre', 'Precisão', 'PRE', 'attr_pre', 'buff_pre'],
    ['int', 'Inteligência', 'INT', 'attr_int', 'buff_int'],
    ['esp', 'Espírito', 'ESP', 'attr_esp', 'buff_esp'],
  ];

  const MARINE_RANKS = [
    ['Aprendiz de Marinheiro', 0], ['Marinheiro', 5000], ['Cabo', 15000], ['Sargento', 30000],
    ['Sargento-Mor', 50000], ['Segundo-Tenente', 80000], ['Primeiro-Tenente', 115000],
    ['Tenente-Comandante', 155000], ['Comandante', 205000], ['Capitão East Blue', 260000],
    ['Capitão West Blue', 320000], ['Capitão South Blue', 380000], ['Capitão North Blue', 440000],
    ['Comodoro', 510000], ['Contra-Almirante', 590000], ['Vice-Almirante', 680000],
    ['Diretor do Alto Comando', 760000], ['Almirante', 850000], ['Inspetor-Chefe', 930000],
    ['Almirante de Frota', 1000000],
  ];

  const FACTION_CONFIG = {
    Padrao: { themeClass: '', logo: `${ROOT}Icons/logo-op-ascension.png`, avatar: `${ROOT}Icons/hero-placeholder.svg`, label: 'Central do Mar' },
    Pirata: { themeClass: 'theme-pirata', logo: `${ROOT}Icons/piratas.svg`, avatar: `${ROOT}Icons/piratas.svg`, label: 'Piratas' },
    Marinha: { themeClass: 'theme-marinha', logo: `${ROOT}Icons/marinha-ascension.png`, avatar: `${ROOT}Icons/marinha.svg`, label: 'Marinha' },
    Mafia: { themeClass: 'theme-mafia', logo: `${ROOT}Icons/mafia-ascension.png`, avatar: `${ROOT}Icons/mafia.svg`, label: 'Máfia' },
    Cacador: { themeClass: 'theme-cacador', logo: `${ROOT}Icons/cacadores-ascension.png`, avatar: `${ROOT}Icons/cacadores.svg`, label: 'Caçadores' },
    Revolucionario: { themeClass: 'theme-revolucionario', logo: `${ROOT}Icons/revolucionarios-ascension.png`, avatar: `${ROOT}Icons/revolucionarios.svg`, label: 'Revolucionários' },
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const esc = (v) => (v ?? '').toString().trim();
  const n = (v) => Number(v) || 0;
  const html = (v) => (v ?? '').toString().replace(/[&<>'"]/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[m]));
  const fmt = (v) => new Intl.NumberFormat('pt-BR').format(n(v));
  const dateFmt = (v) => {
    if (!v) return '—';
    try { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(v)); }
    catch { return v; }
  };
  const normalizeFaction = (value) => {
    const map = { pirata:'Pirata', marinha:'Marinha', mafia:'Mafia', 'máfia':'Mafia', cacador:'Cacador', 'caçador':'Cacador', revolucionario:'Revolucionario', 'revolucionário':'Revolucionario' };
    return map[esc(value).toLowerCase()] || esc(value) || 'Padrao';
  };
  const factionIcon = (f) => ({ Pirata:'🏴‍☠️', Marinha:'⚓', Mafia:'🕶️', Cacador:'⚔️', Revolucionario:'🚩', Padrao:'🌊' }[normalizeFaction(f)] || '🌊');
  const isStaffRole = (role) => role === 'admin' || role === 'owner';
  const isOwnerRole = (role) => role === 'owner';

  const config = window.OPA_SUPABASE_CONFIG || {};
  const configured = /^https:\/\/.+\.supabase\.co$/i.test(esc(config.url)) && esc(config.anonKey).length > 20 && !esc(config.url).includes('COLE_AQUI') && !esc(config.anonKey).includes('COLE_AQUI');
  const sb = configured && window.supabase?.createClient ? window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) : null;

  const state = {
    authUser: null,
    profile: null,
    characters: [],
    logs: [],
    adminProfiles: [],
    adminCharacters: [],
    adminLogs: [],
    ownerTeamStatus: null,
    realtime: null,
  };

  function showToast(message, type = 'info') {
    const host = $('#toast-host');
    if (!host) return window.alert(message);
    const cls = { info:'badge-accent', success:'badge-gold', danger:'badge-danger', warning:'badge-gold' }[type] || 'badge-accent';
    const el = document.createElement('div');
    el.className = `surface-card reveal ${cls}`;
    el.style.maxWidth = '420px';
    el.innerHTML = `<strong class="d-block mb-1">One Piece Ascension</strong><span class="text-muted">${html(message)}</span>`;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(8px)'; el.style.transition='all .35s ease'; }, 3200);
    setTimeout(() => el.remove(), 3700);
  }

  function showBackendBanner() {
    if (configured || $('#backend-config-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'backend-config-banner';
    banner.className = 'alert alert-warning rounded-0 mb-0 text-center';
    banner.innerHTML = `<strong>Banco compartilhado ainda não configurado.</strong> Execute <code>Supabase/schema.sql</code> e preencha <code>Js/supabase-config.js</code>. O conteúdo público do site continua disponível.`;
    document.body.prepend(banner);
  }

  function ensureUtilityModals() {
    const host = document.body;
    if (!$('#loginModal')) host.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="loginModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Acessar conta</h5><button class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><form id="login-form"><label class="form-label">E-mail</label><input id="loginUser" type="email" class="form-control input-rpg mb-3" autocomplete="email"><label class="form-label">Senha</label><input id="loginSenha" type="password" class="form-control input-rpg mb-3" autocomplete="current-password"><label class="form-label">Código da Equipe <span class="text-muted">(opcional)</span></label><div class="input-group mb-2"><input id="loginCodigo" type="password" class="form-control input-rpg" autocomplete="off" placeholder="Só use para ativar ADM"><button class="btn btn-rpg-outline" id="toggle-login-team-code" type="button"><i class="bi bi-eye"></i></button></div><div class="small text-muted mb-3">Depois que a conta virar ADM, não é necessário informar o código novamente.</div><div id="loginErro" class="text-danger small d-none mb-2"></div><button class="btn btn-rpg w-100" type="submit">Entrar</button></form></div></div></div></div>`);
    if (!$('#cadastroModal')) host.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="cadastroModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Criar conta</h5><button class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><form id="cadastro-form"><label class="form-label">Nome de usuário</label><input id="cadUser" class="form-control input-rpg mb-3" maxlength="40"><label class="form-label">E-mail</label><input id="cadEmail" type="email" class="form-control input-rpg mb-3" autocomplete="email"><label class="form-label">Senha</label><input id="cadSenha" type="password" class="form-control input-rpg mb-3" minlength="6" autocomplete="new-password"><label class="form-label">Código da Equipe <span class="text-muted">(opcional)</span></label><div class="input-group mb-2"><input id="cadCodigo" type="password" class="form-control input-rpg" autocomplete="off" placeholder="Deixe vazio se for player"><button class="btn btn-rpg-outline" id="toggle-team-code" type="button"><i class="bi bi-eye"></i></button></div><div class="small text-muted mb-3">O código é validado no Supabase e nunca fica gravado no GitHub.</div><div id="cadErro" class="text-danger small d-none mb-2"></div><button class="btn btn-rpg w-100" type="submit">Cadastrar</button></form></div></div></div></div>`);
    if (!$('#criarPersonagemModal')) host.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="criarPersonagemModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Criar personagem</h5><button class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><form id="character-form"><div class="system-note warning mb-3"><i class="bi bi-people"></i><div>Máximo de <strong>2 personagens ativos</strong> por conta, validado pelo banco.</div></div><label class="form-label">Nome</label><input id="newCharNome" class="form-control input-rpg mb-3"><label class="form-label">Facção inicial</label><select id="newCharFaccao" class="form-select input-rpg mb-3"><option value="Pirata">Pirata</option><option value="Marinha">Marinha</option><option value="Mafia">Máfia</option><option value="Cacador">Caçador</option><option value="Revolucionario">Revolucionário</option></select><label class="form-label">Recompensa / cargo inicial</label><input id="newCharRecompensa" class="form-control input-rpg mb-3"><button class="btn btn-rpg w-100" type="submit">Registrar personagem</button></form></div></div></div></div>`);

    // Adapta os modais que já vieram escritos no index.html.
    const loginInput = $('#loginUser');
    if (loginInput) {
      loginInput.type = 'email';
      loginInput.setAttribute('autocomplete','email');
      const label = loginInput.previousElementSibling;
      if (label?.classList.contains('form-label')) label.textContent = 'E-mail';
    }
    if ($('#cadUser') && !$('#cadEmail')) {
      $('#cadUser').insertAdjacentHTML('afterend', '<label class="form-label">E-mail</label><input id="cadEmail" type="email" class="form-control input-rpg mb-3" autocomplete="email"/>');
    }
    // Código da equipe: permanece no formulário, mas é validado APENAS no backend.
    const teamCode = $('#cadCodigo');
    if (teamCode) {
      const wrap = teamCode.closest('.input-group') || teamCode;
      const label = wrap.previousElementSibling;
      wrap.style.display = '';
      if (label?.classList.contains('form-label')) label.style.display='';
      const hint = wrap.nextElementSibling;
      if (hint?.classList.contains('small')) hint.textContent = 'Opcional. O código é enviado por HTTPS e comparado com um hash privado no Supabase; ele não existe no código público do GitHub.';
    }
    if ($('#loginSenha') && !$('#loginCodigo')) {
      $('#loginSenha').insertAdjacentHTML('afterend', '<label class="form-label">Código da Equipe <span class="text-muted">(opcional)</span></label><div class="input-group mb-2"><input id="loginCodigo" type="password" class="form-control input-rpg" autocomplete="off" placeholder="Só use para ativar ADM"><button class="btn btn-rpg-outline" id="toggle-login-team-code" type="button"><i class="bi bi-eye"></i></button></div><div class="small text-muted mb-3">Se sua conta já é ADM, deixe vazio.</div>');
    }
    const photo = $('#cadFoto');
    if (photo) {
      photo.style.display='none';
      const label = photo.previousElementSibling;
      if (label?.classList.contains('form-label')) label.style.display='none';
    }
  }

  const openModal = (id) => {
    ensureUtilityModals();
    if (!configured && (id === 'loginModal' || id === 'cadastroModal' || id === 'criarPersonagemModal')) return showToast('Configure o Supabase antes de usar contas e fichas compartilhadas.', 'warning');
    const el = document.getElementById(id);
    if (el && window.bootstrap) bootstrap.Modal.getOrCreateInstance(el).show();
  };
  const closeModal = (id) => {
    const el = document.getElementById(id);
    if (el && window.bootstrap) bootstrap.Modal.getInstance(el)?.hide();
  };

  function setTheme(factionKey='Padrao') {
    document.body.classList.remove('theme-pirata','theme-marinha','theme-mafia','theme-cacador','theme-revolucionario');
    const cfg = FACTION_CONFIG[normalizeFaction(factionKey)] || FACTION_CONFIG.Padrao;
    if (cfg.themeClass) document.body.classList.add(cfg.themeClass);
    if ($('#navbar-logo')) $('#navbar-logo').src = cfg.logo;
    if ($('#current-faction-badge')) $('#current-faction-badge').textContent = cfg.label;
    if ($('#avatar-display')) $('#avatar-display').src = state.profile?.avatar_url || cfg.avatar;
  }

  function rowToCharacter(row, logs = []) {
    if (!row) return null;
    const c = {
      ...row,
      faccao: normalizeFaction(row.faccao),
      recompensa: row.cargo || '',
      atributos: {}, buffs: {},
      haki: { bonusPercent: n(row.haki_bonus) },
      akuma: { nome: row.akuma_nome || '', bonusPercent: n(row.akuma_bonus) },
      historico: logs.filter((l) => l.character_id === row.id),
    };
    ATTRS.forEach(([key,, , attrCol, buffCol]) => { c.atributos[key] = n(row[attrCol]); c.buffs[key] = n(row[buffCol]); });
    return c;
  }

  function getActiveCharacter() {
    const active = localStorage.getItem(LS.ACTIVE);
    let c = state.characters.find((x) => x.status === 'Ativo' && String(x.id) === String(active));
    if (!c) c = state.characters.find((x) => x.status === 'Ativo') || null;
    if (c) localStorage.setItem(LS.ACTIVE, c.id);
    return c ? rowToCharacter(c, state.logs) : null;
  }

  function getTotalBruto(c) { return ATTRS.reduce((s,[key]) => s + n(c?.atributos?.[key]), 0); }
  function getCommonBuffTotal(c) { return ATTRS.reduce((s,[key]) => s + n(c?.buffs?.[key]), 0); }
  function getMarineEligibleRank(c) {
    if (normalizeFaction(c?.faccao) !== 'Marinha') return null;
    const total = getTotalBruto(c);
    return [...MARINE_RANKS].reverse().find(([,req]) => total >= req)?.[0] || MARINE_RANKS[0][0];
  }

  async function loadOwnData() {
    state.profile = null; state.characters = []; state.logs = [];
    if (!sb || !state.authUser) return;
    const [{ data: profile, error: pe }, { data: chars, error: ce }, { data: logs, error: le }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', state.authUser.id).maybeSingle(),
      sb.from('characters').select('*').eq('owner_id', state.authUser.id).order('created_at', { ascending:true }),
      sb.from('change_log').select('*').eq('owner_id', state.authUser.id).order('created_at', { ascending:true }),
    ]);
    if (pe) throw pe; if (ce) throw ce; if (le) throw le;
    state.profile = profile; state.characters = chars || []; state.logs = logs || [];
  }

  async function loadAdminData() {
    state.adminProfiles=[]; state.adminCharacters=[]; state.adminLogs=[];
    if (!state.profile || !isStaffRole(state.profile.role)) return;
    const [{ data:p,error:pe },{ data:c,error:ce },{ data:l,error:le }] = await Promise.all([
      sb.from('profiles').select('*').order('username'),
      sb.from('characters').select('*').order('created_at'),
      sb.from('change_log').select('*').order('created_at',{ascending:false}).limit(5000),
    ]);
    if (pe) throw pe; if (ce) throw ce; if (le) throw le;
    state.adminProfiles=p||[]; state.adminCharacters=c||[]; state.adminLogs=l||[];
    state.ownerTeamStatus = null;
    if (isOwnerRole(state.profile.role)) {
      const { data: ts, error: te } = await sb.rpc('owner_team_status');
      if (!te) state.ownerTeamStatus = ts;
    }
  }

  function renderAuthArea() {
    const authButtons=$('#area-auth-botoes'), authUser=$('#area-auth-usuario'), menuAdmin=$('#menu-restrito');
    if (!authButtons || !authUser) return;
    if (!state.profile) {
      authButtons.classList.remove('d-none'); authUser.classList.add('d-none'); authUser.classList.remove('d-flex');
      menuAdmin?.classList.add('d-none'); setTheme('Padrao'); return;
    }
    authButtons.classList.add('d-none'); authUser.classList.remove('d-none'); authUser.classList.add('d-flex');
    const c=getActiveCharacter(); setTheme(c?.faccao || 'Padrao');
    if (menuAdmin) {
      if (isStaffRole(state.profile.role)) { menuAdmin.innerHTML=`<a class="nav-link text-warning fw-bold" data-nav="admin" href="${ROOT}Pages/admin.html">Auditoria ADM</a>`; menuAdmin.classList.remove('d-none'); }
      else { menuAdmin.innerHTML=''; menuAdmin.classList.add('d-none'); }
    }
  }

  function renderHomeData() {
    const c=getActiveCharacter();
    if ($('#home-username')) $('#home-username').textContent=state.profile?.username || 'Viajante';
    if ($('#home-character')) $('#home-character').textContent=c?.nome || 'Nenhum ativo';
    if ($('#home-players')) $('#home-players').textContent=String(state.characters.filter(x=>x.status==='Ativo').length);
  }

  function renderCharacterSelector() {
    const sel=$('#select-personagem-ativo'); if (!sel) return;
    const activeRows=state.characters.filter(c=>c.status==='Ativo'); sel.innerHTML='';
    if (!activeRows.length) { sel.innerHTML='<option value="">Nenhum personagem</option>'; return; }
    const current=getActiveCharacter();
    activeRows.forEach(row=>{ const o=document.createElement('option'); o.value=row.id; o.textContent=`${factionIcon(row.faccao)} ${row.nome}`; o.selected=row.id===current?.id; sel.appendChild(o); });
  }

  const auditBadgeClass=(s)=>({Pendente:'badge-gold',Conferido:'badge-accent',Sinalizado:'badge-danger',Dispensado:'badge-soft'}[s]||'badge-soft');
  const FIELD_LABELS = {
    attr_for:'Força',attr_res:'Resistência',attr_agi:'Agilidade',attr_pre:'Precisão',attr_int:'Inteligência',attr_esp:'Espírito',
    buff_for:'Buff FOR',buff_res:'Buff RES',buff_agi:'Buff AGI',buff_pre:'Buff PRE',buff_int:'Buff INT',buff_esp:'Buff ESP',
    haki_bonus:'Bônus Haki',akuma_bonus:'Bônus Akuma',faccao:'Facção',cargo:'Cargo / Recompensa',berries:'Berries',raca:'Raça',linhagem:'Linhagem',profissao:'Profissão',subprofissao:'Subprofissão',edl:'EDL',akuma_nome:'Akuma no Mi',localizacao:'Localização',navio:'Navio',status:'Status',slot:'Slot'
  };
  const NUM_FIELDS = new Set(['attr_for','attr_res','attr_agi','attr_pre','attr_int','attr_esp','berries']);
  const PCT_FIELDS = new Set(['buff_for','buff_res','buff_agi','buff_pre','buff_int','buff_esp','haki_bonus','akuma_bonus']);

  function diffStates(before={}, after={}) {
    const order=Object.keys(FIELD_LABELS); const out=[];
    order.forEach(k=>{
      const b=before?.[k] ?? ''; const a=after?.[k] ?? '';
      if (String(b)===String(a)) return;
      out.push({ key:k,label:FIELD_LABELS[k],before:b,after:a,type:NUM_FIELDS.has(k)||PCT_FIELDS.has(k)?'number':'text',unit:PCT_FIELDS.has(k)?'%':'' });
    });
    return out;
  }
  function changeText(ch) {
    const bv=ch.type==='number'?`${fmt(ch.before)}${ch.unit}`:(ch.before||'—');
    const av=ch.type==='number'?`${fmt(ch.after)}${ch.unit}`:(ch.after||'—');
    return `${ch.label}: ${bv} → ${av}`;
  }

  function renderHistory(character, target='#character-history', limit=50) {
    const host=$(target); if (!host) return;
    const list=[...(character?.historico||[])].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,limit);
    if (!list.length) { host.innerHTML='<div class="system-note"><i class="bi bi-clock-history"></i><div>Nenhuma atualização registrada ainda.</div></div>'; return; }
    host.innerHTML=list.map(h=>{
      const changes=diffStates(h.before_state,h.after_state);
      return `<div class="history-entry"><div class="history-meta"><strong>${html(h.origin)}</strong><span>${dateFmt(h.created_at)} • ${html(h.actor_role)}</span></div><div class="d-flex gap-2 flex-wrap mb-2"><span class="badge-soft ${auditBadgeClass(h.audit_status)}">${html(h.audit_status)}</span>${h.actor_role==='player'?'<span class="badge-soft badge-accent">Alteração do player</span>':''}</div>${changes.length?`<div class="small text-muted">${changes.map(c=>html(changeText(c))).join('<br>')}</div>`:''}${h.reference?`<div class="small text-muted mt-2"><strong>Referência:</strong> ${html(h.reference)}</div>`:''}${h.audit_note?`<div class="small mt-2"><strong>ADM:</strong> ${html(h.audit_note)}</div>`:''}</div>`;
    }).join('');
  }

  function fillMetaForm(c) {
    const vals={ '#player-meta-faccao':c.faccao,'#player-meta-cargo':c.cargo,'#player-meta-berries':c.berries,'#player-meta-raca':c.raca,'#player-meta-linhagem':c.linhagem,'#player-meta-profissao':c.profissao,'#player-meta-subprofissao':c.subprofissao,'#player-meta-edl':c.edl,'#player-meta-akuma':c.akuma?.nome,'#player-meta-localizacao':c.localizacao,'#player-meta-navio':c.navio };
    Object.entries(vals).forEach(([sel,v])=>{ if ($(sel)) $(sel).value=v??''; });
  }

  function renderPlayerPage() {
    if (document.body.dataset.page!=='player') return;
    const logged=!!state.profile, activeRows=state.characters.filter(c=>c.status==='Ativo'), c=getActiveCharacter();
    if ($('#btn-player-login')) $('#btn-player-login').classList.toggle('d-none',logged);
    if ($('#btn-player-cadastro')) $('#btn-player-cadastro').classList.toggle('d-none',logged);
    if ($('#player-state-title')) $('#player-state-title').textContent=logged?state.profile.username:'Sem sessão';
    if ($('#player-state-body')) $('#player-state-body').textContent=logged?`Banco compartilhado ativo • ${activeRows.length}/${MAX_CHARACTERS} personagens.`:'Faça login para acessar seus personagens.';
    if ($('#char-slot-counter')) $('#char-slot-counter').textContent=`${activeRows.length}/${MAX_CHARACTERS}`;
    if ($('#player-empty-state')) $('#player-empty-state').classList.toggle('d-none',!!c);
    if ($('#player-character-content')) $('#player-character-content').classList.toggle('d-none',!c);
    if ($('#status-criados')) $('#status-criados').textContent=String(state.characters.length);
    if ($('#status-mortos')) $('#status-mortos').textContent=String(state.characters.filter(x=>x.status==='Falecido').length);
    if (!c) return;
    renderCharacterSelector();
    const total=getTotalBruto(c), buffs=getCommonBuffTotal(c), rank=getMarineEligibleRank(c);
    const map={ '#viewRecompensa':c.cargo||'','#viewFaccao':c.faccao,'#viewPoder':c.akuma?.nome||'Nenhuma','#char-total-bruto':fmt(total),'#char-buff-total':`${buffs}% / ${GLOBAL_COMMON_BUFF_CAP}%`,'#char-haki-extra':`+${fmt(c.haki?.bonusPercent)}%`,'#char-akuma-extra':`+${fmt(c.akuma?.bonusPercent)}%`,'#char-patente-elegivel':rank||'—','#char-berries':`${fmt(c.berries)} ₿`,'#char-raca':c.raca||'—','#char-linhagem':c.linhagem||'—','#char-profissao':c.profissao||'—','#char-subprofissao':c.subprofissao||'—','#char-edl':c.edl||'—','#status-maior-cargo':c.cargo||'Nenhum' };
    Object.entries(map).forEach(([sel,v])=>{ if ($(sel)) { if ('value' in $(sel) && $(sel).tagName==='INPUT') $(sel).value=v; else $(sel).textContent=v; } });
    ATTRS.forEach(([key,,short])=>{ if ($(`#attr-${key}`)) $(`#attr-${key}`).textContent=fmt(c.atributos[key]); });
    if ($('#char-buff-bar')) $('#char-buff-bar').style.width=`${Math.min(100,(buffs/GLOBAL_COMMON_BUFF_CAP)*100)}%`;
    if ($('#buff-breakdown')) $('#buff-breakdown').innerHTML=ATTRS.map(([key,,short])=>`<div class="buff-pill"><span>${short}</span><strong>+${fmt(c.buffs[key])}%</strong></div>`).join('');
    fillMetaForm(c); renderHistory(c);
    const last=localStorage.getItem(LS.LAST_SUMMARY); if (last && $('#player-whatsapp-summary')) $('#player-whatsapp-summary').value=last;
  }

  function buildWhatsApp(c, log) {
    const changes=diffStates(log.before_state,log.after_state); const totalBefore=ATTRS.reduce((s,[,,,col])=>s+n(log.before_state?.[col]),0); const totalAfter=ATTRS.reduce((s,[,,,col])=>s+n(log.after_state?.[col]),0);
    const buffAfter=ATTRS.reduce((s,[,,,,col])=>s+n(log.after_state?.[col]),0);
    return `⚓ ONE PIECE ASCENSION — ALTERAÇÃO DE FICHA\n👤 ${c.nome} (${state.profile?.username||'Player'})\n📌 Origem: ${log.origin}\n📈 Alteração:\n${changes.map(x=>`• ${changeText(x)}`).join('\n') || '• Atualização registrada'}\n📊 Pontos Brutos: ${fmt(totalBefore)} → ${fmt(totalAfter)}\n🧩 Buff comum: ${buffAfter}%/${GLOBAL_COMMON_BUFF_CAP}%\n📝 Referência: ${log.reference}\n🕵️ Status no site: ${log.audit_status}\n📱 Alteração registrada no site e informada no WhatsApp.`;
  }

  async function submitPlayerMechanicalUpdate() {
    const c=getActiveCharacter(); if (!c) return;
    const attr={},buff={}; ATTRS.forEach(([key])=>{ attr[key]=n($(`#player-delta-${key}`)?.value); buff[key]=n($(`#player-buff-delta-${key}`)?.value); });
    const reference=esc($('#player-update-note')?.value), origin=esc($('#player-update-origin')?.value)||'Atualização';
    if (!reference) return showToast('Informe a referência para a ADM conferir.', 'warning');
    const any=Object.values(attr).some(Boolean)||Object.values(buff).some(Boolean)||n($('#player-delta-haki')?.value)||n($('#player-delta-akuma')?.value);
    if (!any) return showToast('Nenhuma alteração foi informada.', 'warning');
    const { data,error }=await sb.rpc('player_mechanical_update',{ p_character_id:c.id,p_attr_delta:attr,p_buff_delta:buff,p_haki_delta:n($('#player-delta-haki')?.value),p_akuma_delta:n($('#player-delta-akuma')?.value),p_origin:origin,p_reference:reference });
    if (error) return showToast(error.message,'danger');
    const summary=buildWhatsApp(rowToCharacter(data.character),data.log); localStorage.setItem(LS.LAST_SUMMARY,summary);
    ATTRS.forEach(([key])=>{ if($(`#player-delta-${key}`)) $(`#player-delta-${key}`).value=0; if($(`#player-buff-delta-${key}`)) $(`#player-buff-delta-${key}`).value=0; });
    if($('#player-delta-haki')) $('#player-delta-haki').value=0; if($('#player-delta-akuma')) $('#player-delta-akuma').value=0; if($('#player-update-note')) $('#player-update-note').value='';
    await refreshOwn(); if($('#player-whatsapp-summary')) $('#player-whatsapp-summary').value=summary; showToast('Alteração salva no banco compartilhado e enviada para auditoria.','success');
  }

  async function submitPlayerMetadata() {
    const c=getActiveCharacter(); if (!c) return;
    const reference=esc($('#player-meta-note')?.value), origin=esc($('#player-meta-origin')?.value)||'Atualização cadastral'; if(!reference) return showToast('Informe a referência da mudança.','warning');
    const values={ faccao:esc($('#player-meta-faccao')?.value),cargo:esc($('#player-meta-cargo')?.value),berries:n($('#player-meta-berries')?.value),raca:esc($('#player-meta-raca')?.value),linhagem:esc($('#player-meta-linhagem')?.value),profissao:esc($('#player-meta-profissao')?.value),subprofissao:esc($('#player-meta-subprofissao')?.value),edl:esc($('#player-meta-edl')?.value),akuma_nome:esc($('#player-meta-akuma')?.value),localizacao:esc($('#player-meta-localizacao')?.value),navio:esc($('#player-meta-navio')?.value) };
    const {data,error}=await sb.rpc('player_metadata_update',{p_character_id:c.id,p_values:values,p_origin:origin,p_reference:reference}); if(error) return showToast(error.message,'danger');
    const summary=buildWhatsApp(rowToCharacter(data.character),data.log); localStorage.setItem(LS.LAST_SUMMARY,summary); if($('#player-meta-note')) $('#player-meta-note').value='';
    await refreshOwn(); if($('#player-whatsapp-summary')) $('#player-whatsapp-summary').value=summary; showToast('Dados atualizados e registrados para auditoria.','success');
  }

  async function markCharacterDead() {
    const c=getActiveCharacter(); if(!c) return; if(!confirm(`Confirmar morte permanente de ${c.nome}? O slot será liberado, mas o histórico ficará salvo.`)) return;
    const ref=prompt('Referência da morte (arco, missão, evento):','Morte permanente')||'Morte permanente';
    const {error}=await sb.rpc('player_archive_death',{p_character_id:c.id,p_reference:ref}); if(error) return showToast(error.message,'danger');
    localStorage.removeItem(LS.ACTIVE); await refreshOwn(); showToast('Personagem arquivado como falecido. A ADM recebeu o registro.','success');
  }

  function renderAdminPage() {
    if (document.body.dataset.page!=='admin') return;
    const isAdmin=isStaffRole(state.profile?.role); if($('#admin-denied')) $('#admin-denied').classList.toggle('d-none',isAdmin); if($('#admin-panel')) $('#admin-panel').classList.toggle('d-none',!isAdmin); if(!isAdmin) return;
    if($('#admin-username')) $('#admin-username').textContent=state.profile.username;
    renderAdminAudit(); renderAdminSelectors(); renderAdminCharacter();
  }

  function adminLogView(log) {
    const p=state.adminProfiles.find(x=>x.id===log.owner_id); const c=state.adminCharacters.find(x=>x.id===log.character_id);
    return { log, profile:p, character:c, changes:diffStates(log.before_state,log.after_state) };
  }

  function renderAdminAudit() {
    const host=$('#admin-audit-feed'); if(!host) return;
    const all=state.adminLogs.map(adminLogView); const pending=all.filter(x=>x.log.audit_status==='Pendente').length, checked=all.filter(x=>x.log.audit_status==='Conferido').length, flagged=all.filter(x=>x.log.audit_status==='Sinalizado').length;
    if($('#audit-count-total')) $('#audit-count-total').textContent=all.length; if($('#audit-count-pending')) $('#audit-count-pending').textContent=pending; if($('#audit-count-checked')) $('#audit-count-checked').textContent=checked; if($('#audit-count-flagged')) $('#audit-count-flagged').textContent=flagged;
    const status=$('#admin-audit-filter')?.value||'Pendente', q=esc($('#admin-audit-search')?.value).toLowerCase();
    const filtered=all.filter(x=>(status==='Todos'||x.log.audit_status===status)&&(!q||`${x.profile?.username||''} ${x.character?.nome||''} ${x.log.origin} ${x.log.reference}`.toLowerCase().includes(q)));
    if(!filtered.length){host.innerHTML='<div class="system-note"><i class="bi bi-check2-circle"></i><div>Nenhuma alteração nessa visualização.</div></div>';return;}
    host.innerHTML=filtered.map(x=>`<div class="history-entry" data-log-id="${x.log.id}"><div class="d-flex justify-content-between gap-3 flex-wrap"><div><div class="kicker">${html(x.profile?.username||'Conta')}</div><h4 class="mb-1">${factionIcon(x.character?.faccao)} ${html(x.character?.nome||'Personagem')}</h4><div class="small text-muted">${dateFmt(x.log.created_at)} • ${html(x.log.origin)}</div></div><span class="badge-soft ${auditBadgeClass(x.log.audit_status)}">${html(x.log.audit_status)}</span></div><div class="small text-muted mt-3">${x.changes.length?x.changes.map(c=>html(changeText(c))).join('<br>'):'Registro sem diferença mecânica detectável.'}</div><div class="small mt-2"><strong>Referência:</strong> ${html(x.log.reference||'—')}</div>${x.log.audit_note?`<div class="small mt-2"><strong>Observação ADM:</strong> ${html(x.log.audit_note)}</div>`:''}<div class="d-flex gap-2 flex-wrap mt-3"><button class="btn btn-sm btn-rpg-outline" data-action="open" data-user="${x.log.owner_id}" data-char="${x.log.character_id}">Abrir ficha</button>${x.log.audit_status!=='Conferido'?`<button class="btn btn-sm btn-success" data-action="audit" data-status="Conferido" data-id="${x.log.id}">Conferir</button>`:''}${x.log.audit_status!=='Sinalizado'?`<button class="btn btn-sm btn-outline-danger" data-action="audit" data-status="Sinalizado" data-id="${x.log.id}">Sinalizar</button>`:''}${x.log.audit_status!=='Pendente'?`<button class="btn btn-sm btn-outline-secondary" data-action="audit" data-status="Pendente" data-id="${x.log.id}">Voltar a pendente</button>`:''}</div></div>`).join('');
  }

  function renderAdminSelectors() {
    const ps=$('#admin-player-select'),cs=$('#admin-character-select'); if(!ps||!cs) return;
    const desired=localStorage.getItem(LS.ADMIN_SELECTED_USER); ps.innerHTML=state.adminProfiles.map(p=>`<option value="${p.id}">${html(p.username)}${p.role==='owner'?' • OWNER':p.role==='admin'?' • ADM':''}</option>`).join(''); if(desired&&state.adminProfiles.some(p=>p.id===desired)) ps.value=desired;
    const owner=ps.value; const chars=state.adminCharacters.filter(c=>c.owner_id===owner&&c.status==='Ativo'); const desiredC=localStorage.getItem(LS.ADMIN_SELECTED_CHAR); cs.innerHTML=chars.map(c=>`<option value="${c.id}">${factionIcon(c.faccao)} ${html(c.nome)}</option>`).join(''); if(desiredC&&chars.some(c=>c.id===desiredC)) cs.value=desiredC;
  }

  function renderAdminCharacter() {
    const host=$('#admin-character-summary'); if(!host) return;
    const owner=$('#admin-player-select')?.value, charId=$('#admin-character-select')?.value; const p=state.adminProfiles.find(x=>x.id===owner); const row=state.adminCharacters.find(x=>x.id===charId);
    if(!row){host.innerHTML='<div class="system-note"><i class="bi bi-person-x"></i><div>Nenhum personagem ativo selecionado.</div></div>'; renderHistory(null,'#admin-history'); return;}
    localStorage.setItem(LS.ADMIN_SELECTED_USER,owner); localStorage.setItem(LS.ADMIN_SELECTED_CHAR,charId);
    const logs=state.adminLogs.filter(l=>l.character_id===row.id); const c=rowToCharacter(row,logs); const total=getTotalBruto(c),buffs=getCommonBuffTotal(c),pend=logs.filter(l=>l.audit_status==='Pendente').length;
    host.innerHTML=`<div class="admin-char-head"><div><div class="kicker">${html(p?.username||'Conta')}</div><h3>${factionIcon(c.faccao)} ${html(c.nome)}</h3><p>${html(c.faccao)} • ${html(c.cargo||'Sem cargo/recompensa')}</p></div><div class="text-end"><span class="badge-soft badge-accent">${fmt(total)} pts brutos</span><span class="badge-soft ${buffs>=GLOBAL_COMMON_BUFF_CAP?'badge-danger':'badge-gold'} ms-2">${buffs}/${GLOBAL_COMMON_BUFF_CAP}% buff</span><span class="badge-soft ${pend?'badge-gold':'badge-accent'} ms-2">${pend} pendente(s)</span></div></div><div class="shell-grid grid-3 mt-3">${ATTRS.map(([k,,s])=>`<div class="segment"><div class="text-muted small">${s}</div><strong>${fmt(c.atributos[k])}</strong><span class="d-block small text-muted">Buff +${fmt(c.buffs[k])}%</span></div>`).join('')}</div><div class="system-note gold mt-3"><i class="bi bi-lightning-charge"></i><div><strong>Fora do teto:</strong> Haki +${fmt(c.haki.bonusPercent)}% e Akuma +${fmt(c.akuma.bonusPercent)}%.</div></div>`;
    renderHistory(c,'#admin-history',40);
  }

  async function auditChange(id,status) {
    let note=''; if(status==='Sinalizado') note=prompt('Motivo da sinalização para o player:','')||''; else if(status==='Conferido') note=prompt('Observação opcional da conferência:','')||'';
    const {error}=await sb.rpc('admin_audit_change',{p_log_id:id,p_status:status,p_note:note}); if(error) return showToast(error.message,'danger'); await refreshAdmin(); showToast(`Alteração marcada como ${status}.`,'success');
  }

  async function submitAdminCorrection() {
    const row=state.adminCharacters.find(x=>x.id===$('#admin-character-select')?.value); if(!row) return showToast('Selecione um personagem.','warning');
    const attr={},buff={}; ATTRS.forEach(([key])=>{attr[key]=n($(`#admin-correction-${key}`)?.value);buff[key]=n($(`#admin-correction-buff-${key}`)?.value);}); const note=esc($('#admin-correction-note')?.value); if(!note) return showToast('Explique o motivo da correção administrativa.','warning');
    const {data,error}=await sb.rpc('admin_mechanical_correction',{p_character_id:row.id,p_attr_delta:attr,p_buff_delta:buff,p_haki_delta:n($('#admin-correction-haki')?.value),p_akuma_delta:n($('#admin-correction-akuma')?.value),p_reference:note}); if(error) return showToast(error.message,'danger');
    const p=state.adminProfiles.find(x=>x.id===row.owner_id); const oldProfile=state.profile; state.profile=p||oldProfile; const summary=buildWhatsApp(rowToCharacter(data.character),data.log).replace(`(${p?.username||'Player'})`,`(${p?.username||'Player'}) — Correção ADM`); state.profile=oldProfile;
    if($('#admin-correction-summary')) $('#admin-correction-summary').value=summary; ATTRS.forEach(([key])=>{if($(`#admin-correction-${key}`))$(`#admin-correction-${key}`).value=0;if($(`#admin-correction-buff-${key}`))$(`#admin-correction-buff-${key}`).value=0;}); if($('#admin-correction-haki'))$('#admin-correction-haki').value=0;if($('#admin-correction-akuma'))$('#admin-correction-akuma').value=0;if($('#admin-correction-note'))$('#admin-correction-note').value=''; await refreshAdmin(); showToast('Correção administrativa registrada sem apagar o histórico anterior.','success');
  }

  async function claimAdminCode(rawCode, { silent = false } = {}) {
    if (!sb || !state.authUser) return { ok:false, message:'Faça login antes de ativar o acesso ADM.' };
    const code = esc(rawCode);
    if (!code) return { ok:false, message:'Informe o Código da Equipe.' };
    const { data, error } = await sb.rpc('claim_admin_role', { p_code: code });
    if (error) {
      if (!silent) showToast(error.message, 'danger');
      return { ok:false, message:error.message };
    }
    const result = data || {};
    if (!result.ok) {
      if (!silent) showToast(result.message || 'Código da Equipe inválido.', result.locked ? 'warning' : 'danger');
      return result;
    }
    await loadOwnData();
    if (!silent) showToast(result.already ? 'Sua conta já possui acesso administrativo.' : 'Acesso ADM ativado com segurança.', 'success');
    return result;
  }

  async function consumePendingTeamCode() {
    const code = sessionStorage.getItem('opa_pending_team_code');
    if (!code || !state.authUser) return;
    sessionStorage.removeItem('opa_pending_team_code');
    const result = await claimAdminCode(code, { silent:true });
    if (result?.ok) showToast('Código da Equipe validado: acesso ADM ativado.', 'success');
    else showToast(result?.message || 'Não foi possível validar o Código da Equipe.', 'warning');
  }

  async function activateAdminFromPlayerPage() {
    const code = esc($('#team-access-code')?.value);
    const result = await claimAdminCode(code);
    if (result?.ok) {
      if ($('#team-access-code')) $('#team-access-code').value='';
      await refreshOwn();
    }
  }

  async function ownerSaveTeamCode() {
    if (!isOwnerRole(state.profile?.role)) return;
    const code = esc($('#owner-team-code')?.value);
    if (code.length < 10) return showToast('Use um Código da Equipe com pelo menos 10 caracteres.', 'warning');
    const { data, error } = await sb.rpc('owner_set_admin_code', { p_new_code: code });
    if (error) return showToast(error.message,'danger');
    if (!data?.ok) return showToast(data?.message || 'Não foi possível alterar o código.','danger');
    if ($('#owner-team-code')) $('#owner-team-code').value='';
    await refreshAdmin();
    showToast('Novo Código da Equipe salvo no backend. ADMs atuais não foram afetados.','success');
  }

  async function ownerToggleAdminSignup() {
    if (!isOwnerRole(state.profile?.role)) return;
    const enabled = !(state.ownerTeamStatus?.admin_signup_enabled ?? true);
    const { data, error } = await sb.rpc('owner_set_admin_signup', { p_enabled: enabled });
    if (error) return showToast(error.message,'danger');
    if (!data?.ok) return showToast(data?.message || 'Falha ao alterar cadastro ADM.','danger');
    await refreshAdmin();
    showToast(enabled ? 'Novas ativações de ADM foram liberadas.' : 'Novas ativações de ADM foram pausadas.','success');
  }

  async function ownerChangeRole(userId, nextRole) {
    if (!isOwnerRole(state.profile?.role)) return;
    const profile = state.adminProfiles.find(p=>p.id===userId);
    if (!profile) return;
    const action = nextRole === 'admin' ? `promover ${profile.username} para ADM` : `remover o acesso ADM de ${profile.username}`;
    if (!confirm(`Confirmar: ${action}? Os personagens da conta não serão afetados.`)) return;
    const { data, error } = await sb.rpc('owner_set_user_role', { p_target: userId, p_role: nextRole });
    if (error) return showToast(error.message,'danger');
    if (!data?.ok) return showToast(data?.message || 'Não foi possível alterar a permissão.','danger');
    await refreshAdmin();
    showToast(nextRole === 'admin' ? 'Permissão ADM concedida.' : 'Permissão ADM removida; a conta continua como Player.','success');
  }

  function renderTeamAccess() {
    const card = $('#team-access-card');
    if (!card) return;
    if (!state.profile || isStaffRole(state.profile.role)) { card.classList.add('d-none'); return; }
    card.classList.remove('d-none');
    const status=$('#team-access-status');
    if(status) status.textContent='Sua conta é Player. Se você faz parte da equipe, use o Código da Equipe para liberar a aba ADM.';
  }

  function renderOwnerTeamPanel() {
    const panel=$('#owner-team-panel');
    if(!panel) return;
    const owner=isOwnerRole(state.profile?.role);
    panel.classList.toggle('d-none',!owner);
    if(!owner) return;
    const st=state.ownerTeamStatus||{};
    if($('#owner-team-status')) $('#owner-team-status').innerHTML=`<span class="badge-soft ${st.admin_signup_enabled?'badge-accent':'badge-danger'}">Novos ADMs: ${st.admin_signup_enabled?'LIBERADO':'PAUSADO'}</span> <span class="badge-soft badge-gold ms-2">Código: ${st.code_configured?'CONFIGURADO':'NÃO CONFIGURADO'}</span> <span class="badge-soft badge-accent ms-2">${fmt(st.admin_count||0)} ADM(s)</span>`;
    const toggle=$('#btn-owner-toggle-signup'); if(toggle) toggle.innerHTML=st.admin_signup_enabled?'<i class="bi bi-pause-circle me-2"></i>Pausar novas ativações':'<i class="bi bi-play-circle me-2"></i>Liberar novas ativações';
    const host=$('#owner-team-members'); if(host){
      const rows=state.adminProfiles.filter(p=>isStaffRole(p.role));
      host.innerHTML=rows.length?rows.map(p=>`<div class="history-entry"><div class="d-flex justify-content-between gap-3 align-items-center flex-wrap"><div><strong>${html(p.username)}</strong><div class="small text-muted">${p.role==='owner'?'Owner':'ADM'} • personagens e histórico preservados</div></div>${p.role==='admin'?`<button class="btn btn-sm btn-outline-danger" data-owner-role="player" data-user="${p.id}"><i class="bi bi-person-dash me-1"></i>Remover ADM</button>`:'<span class="badge-soft badge-gold">OWNER</span>'}</div></div>`).join(''):'<div class="text-muted">Nenhum ADM ativo.</div>';
    }
  }

  async function realizarCadastro() {
    if(!sb) return showToast('Banco não configurado.','warning');
    const username=esc($('#cadUser')?.value),email=esc($('#cadEmail')?.value),password=esc($('#cadSenha')?.value),teamCode=esc($('#cadCodigo')?.value);
    if(username.length<3||!email||password.length<6) return showToast('Informe usuário, e-mail válido e senha com ao menos 6 caracteres.','warning');
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{username}}});
    if(error){if($('#cadErro')){$('#cadErro').textContent=error.message;$('#cadErro').classList.remove('d-none');}return showToast(error.message,'danger');}
    closeModal('cadastroModal');
    if(teamCode) sessionStorage.setItem('opa_pending_team_code',teamCode);
    if(data.session){
      state.authUser=data.session.user;
      await loadOwnData();
      if(teamCode){sessionStorage.removeItem('opa_pending_team_code');await claimAdminCode(teamCode);if($('#cadCodigo'))$('#cadCodigo').value='';}
      await refreshOwn();
      showToast(isStaffRole(state.profile?.role)?'Conta criada com acesso ADM.':'Conta criada e sessão iniciada.','success');
    } else {
      showToast(teamCode?'Conta criada. Confirme o e-mail e entre; o Código da Equipe será validado após autenticação.':'Conta criada. Confirme o e-mail para entrar, se a confirmação estiver ativada no Supabase.','success');
      openModal('loginModal');
    }
  }

  async function realizarLogin() {
    if(!sb) return showToast('Banco não configurado.','warning');
    const email=esc($('#loginUser')?.value),password=esc($('#loginSenha')?.value),teamCode=esc($('#loginCodigo')?.value);
    if(!email||!password) return showToast('Preencha e-mail e senha.','warning');
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error){if($('#loginErro')){$('#loginErro').textContent='E-mail ou senha incorretos.';$('#loginErro').classList.remove('d-none');}return showToast(error.message,'danger');}
    state.authUser=data.user||null;
    await loadOwnData();
    if(teamCode) { await claimAdminCode(teamCode); if($('#loginCodigo')) $('#loginCodigo').value=''; }
    closeModal('loginModal');
    await refreshOwn();
    showToast(`Bem-vindo(a), ${state.profile?.username||'player'}${isStaffRole(state.profile?.role)?' • equipe ADM':''}.`,'success');
  }

  async function deslogar(){ if(sb) await sb.auth.signOut(); state.authUser=null;state.profile=null;state.characters=[];state.logs=[];localStorage.removeItem(LS.ACTIVE);stopRealtime();renderAll();showToast('Sessão encerrada.','info'); }

  async function salvarNovoPersonagem(){ if(!state.profile)return openModal('loginModal'); const nome=esc($('#newCharNome')?.value);if(!nome)return showToast('Informe o nome do personagem.','warning'); const {data,error}=await sb.rpc('create_character',{p_nome:nome,p_faccao:esc($('#newCharFaccao')?.value)||'Pirata',p_cargo:esc($('#newCharRecompensa')?.value)});if(error)return showToast(error.message,'danger');localStorage.setItem(LS.ACTIVE,data.id);closeModal('criarPersonagemModal');await refreshOwn();showToast(`${nome} criado no banco compartilhado.`,'success'); }

  async function refreshOwn(){ if(!sb)return; const {data:{user}}=await sb.auth.getUser();state.authUser=user||null;if(user){try{await loadOwnData();await consumePendingTeamCode();}catch(e){console.error(e);showToast(e.message||'Falha ao carregar dados.','danger');}}else{state.profile=null;state.characters=[];state.logs=[];} if(isStaffRole(state.profile?.role))await loadAdminData();setupRealtime();renderAll(); }
  async function refreshAdmin(){ if(!isStaffRole(state.profile?.role))return;await loadAdminData();renderAdminPage();renderOwnerTeamPanel(); }

  function setupRealtime(){ if(!sb||!state.authUser)return; stopRealtime(); state.realtime=sb.channel(`opa-live-${state.authUser.id}`).on('postgres_changes',{event:'*',schema:'public',table:'profiles'},()=>scheduleRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'characters'},()=>scheduleRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'change_log'},()=>scheduleRefresh()).subscribe(); }
  function stopRealtime(){ if(state.realtime&&sb)sb.removeChannel(state.realtime);state.realtime=null; }
  let refreshTimer=null; function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refreshOwn(),350);}

  async function exportBackup(){ if(!state.profile)return; const payload=isStaffRole(state.profile.role)?{version:'6.3-team-code',exportedAt:new Date().toISOString(),profiles:state.adminProfiles,characters:state.adminCharacters,change_log:state.adminLogs}:{version:'6.3-team-code',exportedAt:new Date().toISOString(),profile:state.profile,characters:state.characters,change_log:state.logs}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`opa-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url); }

  function copyText(sel){const text=$(sel)?.value||localStorage.getItem(LS.LAST_SUMMARY)||'';if(!text)return showToast('Nada para copiar.','warning');navigator.clipboard?.writeText(text).then(()=>showToast('Resumo copiado.','success')).catch(()=>showToast('Não foi possível copiar automaticamente.','warning'));}

  function bindSearch(){const form=$('#site-search-form');if(!form||form.dataset.bound)return;form.dataset.bound='1';const norm=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const routes=[[['historia','lore','poneglyph'],'inicio-historia.html'],[['tutorial','regra','1000','buff'],'tutorial.html'],[['ficha','atributo'],'criacao-ficha.html'],[['raca','mink','lunaria','gigante'],'racas.html'],[['linhagem','familia'],'linhagens.html'],[['profissao','subprofissao'],'profissoes.html'],[['faccao','marinha','pirata','revolucionario'],'faccoes.html'],[['edl','estilo'],'edl.html'],[['evolucao','treino'],'evolucao.html'],[['missao','pericia'],'pericia-missoes.html'],[['arco'],'arcos.html'],[['combate','estado','acerto'],'combate.html'],[['hp','dano','espirito'],'hp-dano.html'],[['hospital'],'hospital.html'],[['navio','doca','galeao'],'navios.html'],[['loja','preco'],'loja.html'],[['negocio','renda'],'negocios.html'],[['submundo','mercado negro'],'submundo.html'],[['npc','frota'],'npcs.html'],[['arma','ferreiro','gunsmith'],'armas.html'],[['akuma','haki','future sight'],'poderes.html'],[['navegacao','evento','log pose'],'navegacao.html']];form.addEventListener('submit',e=>{e.preventDefault();const raw=norm(esc($('#site-search-input')?.value));if(!raw)return;const found=routes.find(([terms])=>terms.some(t=>raw.includes(norm(t))||norm(t).includes(raw)));location.href=`${ROOT}Pages/${found?.[1]||'tutorial.html'}`;});}

  function bindButtons(){ensureUtilityModals();const bind=(sel,event,fn)=>{const el=$(sel);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener(event,fn);}};
    bind('#btn-login','click',()=>openModal('loginModal'));bind('#btn-cadastro','click',()=>openModal('cadastroModal'));bind('#btn-player-login','click',()=>openModal('loginModal'));bind('#btn-player-cadastro','click',()=>openModal('cadastroModal'));bind('#btn-novo-personagem','click',()=>openModal('criarPersonagemModal'));bind('#hero-btn-novo-personagem','click',()=>openModal('criarPersonagemModal'));bind('#btn-painel-usuario','click',()=>location.href=`${ROOT}Pages/player.html`);bind('#btn-perfil','click',()=>location.href=`${ROOT}Pages/player.html`);bind('#btn-logout-top','click',deslogar);bind('#btn-logout','click',deslogar);bind('#btn-character-death','click',markCharacterDead);
    bind('#login-form','submit',e=>{e.preventDefault();realizarLogin();});bind('#cadastro-form','submit',e=>{e.preventDefault();realizarCadastro();});bind('#character-form','submit',e=>{e.preventDefault();salvarNovoPersonagem();});bind('#login-submit','click',realizarLogin);bind('#cadastro-submit','click',realizarCadastro);bind('#create-character-submit','click',salvarNovoPersonagem);
    bind('#select-personagem-ativo','change',e=>{localStorage.setItem(LS.ACTIVE,e.target.value);renderAll();});bind('#player-update-form','submit',e=>{e.preventDefault();submitPlayerMechanicalUpdate();});bind('#player-meta-form','submit',e=>{e.preventDefault();submitPlayerMetadata();});bind('#btn-copy-player-whatsapp','click',()=>copyText('#player-whatsapp-summary'));
    bind('#admin-player-select','change',()=>{localStorage.setItem(LS.ADMIN_SELECTED_USER,$('#admin-player-select').value);localStorage.removeItem(LS.ADMIN_SELECTED_CHAR);renderAdminSelectors();renderAdminCharacter();});bind('#admin-character-select','change',()=>{localStorage.setItem(LS.ADMIN_SELECTED_CHAR,$('#admin-character-select').value);renderAdminCharacter();});bind('#admin-audit-filter','change',renderAdminAudit);bind('#admin-audit-search','input',renderAdminAudit);bind('#admin-audit-feed','click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;if(b.dataset.action==='audit')auditChange(b.dataset.id,b.dataset.status);if(b.dataset.action==='open'){localStorage.setItem(LS.ADMIN_SELECTED_USER,b.dataset.user);localStorage.setItem(LS.ADMIN_SELECTED_CHAR,b.dataset.char);renderAdminSelectors();renderAdminCharacter();$('#admin-character-summary')?.scrollIntoView({behavior:'smooth',block:'center'});}});bind('#admin-correction-form','submit',e=>{e.preventDefault();submitAdminCorrection();});bind('#btn-copy-admin-correction','click',()=>copyText('#admin-correction-summary'));bind('#btn-export-backup','click',exportBackup);bind('#import-backup-file','change',()=>showToast('Importação pelo navegador foi desativada no modo compartilhado para preservar a integridade do banco. Use o Supabase/SQL para restaurações.','warning'));bind('#btn-claim-admin-code','click',activateAdminFromPlayerPage);bind('#btn-owner-save-code','click',ownerSaveTeamCode);bind('#btn-owner-toggle-signup','click',ownerToggleAdminSignup);bind('#owner-team-members','click',e=>{const b=e.target.closest('button[data-owner-role]');if(b)ownerChangeRole(b.dataset.user,b.dataset.ownerRole);});[['#toggle-team-code','#cadCodigo'],['#toggle-login-team-code','#loginCodigo'],['#toggle-activation-code','#team-access-code'],['#toggle-owner-team-code','#owner-team-code']].forEach(([btnSel,inputSel])=>bind(btnSel,'click',()=>{const inp=$(inputSel);if(!inp)return;inp.type=inp.type==='password'?'text':'password';const i=$(btnSel)?.querySelector('i');if(i)i.className=inp.type==='password'?'bi bi-eye':'bi bi-eye-slash';}));bindSearch();}

  function setActiveNav(){const page=document.body.dataset.page;$$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===page));}
  function renderAll(){renderAuthArea();renderHomeData();renderPlayerPage();renderTeamAccess();renderAdminPage();renderOwnerTeamPanel();bindButtons();}

  Object.assign(window,{OPA:{state,MAX_CHARACTERS,GLOBAL_COMMON_BUFF_CAP,ATTRS,MARINE_RANKS,getActiveCharacter,getTotalBruto,getCommonBuffTotal,refresh:refreshOwn},realizarCadastro,realizarLogin,deslogar,salvarNovoPersonagem});

  document.addEventListener('DOMContentLoaded',async()=>{
    ensureUtilityModals();setActiveNav();bindButtons();showBackendBanner();
    if(!sb){renderAll();return;}
    const {data:{session}}=await sb.auth.getSession();state.authUser=session?.user||null;
    sb.auth.onAuthStateChange((_event,session)=>{state.authUser=session?.user||null;setTimeout(()=>refreshOwn(),0);});
    await refreshOwn();
  });
})();
