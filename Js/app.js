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


  const BUILD_OPTIONS = {
    raca: ['Humano','Tritão','Skypiean','Shandian / Birka','Tontatta','Gigante (Elbaf)','Sereia / Sereiano','Mink','Kuja','Ciborgue','Rainha Kuja','Lunaria','Três Olhos','Bucaneiro','Oni','Gigante Ancestral','Entropiano','Serpentine — Anacondrai','Serpentine — Hypnobrai','Serpentine — Fangpire','Serpentine — Constrictai','Serpentine — Venomari'],
    linhagem: ['Sem Linhagem','D.','Roronoa','Newgate','Capone','Dracule','Marshall','Nico','Donquixote','Charlotte','God','Neptune','Boa','Vinsmoke','Kozuki','Oars','Sakazuki','Borsalino','Riku','Nefertari'],
    profissao: ['Combatente','Combatente — Monstro','Combatente — Fantasma','Combatente — Forte','Atirador','Médico','Navegador','Carpinteiro','Cientista','Músico','Cozinheiro','Arqueólogo','Tesoureiro','Caçador','Domador'],
    subprofissao: ['Nenhuma','Herbalista','Timoneiro','Ferreiro','Arquiteto','Gunsmith'],
    edl: ['Santoryu (3 Espadas)','Nitoryu (2 Espadas)','Ittoryu (1 Espada)','Black Leg Style (Chutes)','Rokushiki (CP9/CP0)','Karatê Tritão','Electro Combat','Gyojin Jujutsu','Haki Style (puro Haki)','Arqueiro Kuja','Sulong Combat','Estilingue Artístico (God Style)']
  };

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
    Pirata: { themeClass: 'theme-pirata', logo: `${ROOT}Icons/piratas-ascension-v2.png?v=2`, avatar: `${ROOT}Icons/piratas.svg`, label: 'Piratas' },
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
    inventory: [],
    weaponMods: [],
    effects: [],
    weaponTypes: [],
    weaponLevels: [],
    weaponModCatalog: [],
    adminInventory: [],
    adminWeaponMods: [],
    adminEffects: [],
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

    // A criação oficial usa 100 pontos iniciais distribuídos apenas em FOR/RES/AGI/PRE/INT.
    // Espírito inicia bloqueado até o personagem possuir Akuma no Mi; Haki progride somente após despertar.
    const charModal = $('#criarPersonagemModal');
    if (charModal && charModal.dataset.initialPointsUi !== '1') {
      const charBody = $('.modal-body', charModal);
      if (charBody) charBody.innerHTML = `
        <form id="character-form">
          <div class="system-note warning mb-3"><i class="bi bi-people"></i><div>Máximo de <strong>2 personagens ativos</strong> por conta, validado pelo banco.</div></div>
          <label class="form-label">Nome</label><input id="newCharNome" class="form-control input-rpg mb-3" maxlength="100" required>
          <label class="form-label">Facção inicial</label><select id="newCharFaccao" class="form-select input-rpg mb-3"><option value="Pirata">Pirata</option><option value="Marinha">Marinha</option><option value="Mafia">Máfia</option><option value="Cacador">Caçador de Recompensas</option><option value="Revolucionario">Revolucionário</option></select>
          <label class="form-label">Recompensa / cargo inicial</label><input id="newCharRecompensa" class="form-control input-rpg mb-3">
          <div class="system-note gold mb-3"><i class="bi bi-sliders"></i><div><strong>100 pontos iniciais</strong><br>Distribua exatamente 100 pontos entre Força, Resistência, Agilidade, Precisão e Inteligência. Espírito começa em 0 e só recebe pontos após consumir uma Akuma no Mi. Haki começa não desperto e só progride depois do desbloqueio.</div></div>
          <div class="row g-2 mb-2">
            <div class="col-6 col-md"><label class="form-label small">FOR</label><input id="initialAttrFor" data-initial-attr type="number" min="0" max="100" step="1" value="0" class="form-control input-rpg text-center"></div>
            <div class="col-6 col-md"><label class="form-label small">RES</label><input id="initialAttrRes" data-initial-attr type="number" min="0" max="100" step="1" value="0" class="form-control input-rpg text-center"></div>
            <div class="col-6 col-md"><label class="form-label small">AGI</label><input id="initialAttrAgi" data-initial-attr type="number" min="0" max="100" step="1" value="0" class="form-control input-rpg text-center"></div>
            <div class="col-6 col-md"><label class="form-label small">PRE</label><input id="initialAttrPre" data-initial-attr type="number" min="0" max="100" step="1" value="0" class="form-control input-rpg text-center"></div>
            <div class="col-6 col-md"><label class="form-label small">INT</label><input id="initialAttrInt" data-initial-attr type="number" min="0" max="100" step="1" value="0" class="form-control input-rpg text-center"></div>
          </div>
          <div class="d-flex justify-content-between align-items-center mb-3 small"><span>Distribuídos: <strong id="initialPointsUsed">0</strong>/100</span><span id="initialPointsRemaining" class="text-warning">Restam 100</span></div>
          <button class="btn btn-rpg w-100" id="create-character-submit" type="button">Registrar personagem</button>
        </form>`;
      charModal.dataset.initialPointsUi = '1';
      $$('[data-initial-attr]', charModal).forEach((input) => input.addEventListener('input', updateInitialPointCounter));
      updateInitialPointCounter();
    }

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

  function getInitialAttributes() {
    const clamp = (selector) => {
      const input = $(selector);
      const raw = Number(input?.value ?? 0);
      if (!Number.isFinite(raw)) return 0;
      const value = Math.max(0, Math.min(100, Math.trunc(raw)));
      if (input && String(value) !== String(input.value)) input.value = value;
      return value;
    };
    return {
      for: clamp('#initialAttrFor'), res: clamp('#initialAttrRes'), agi: clamp('#initialAttrAgi'),
      pre: clamp('#initialAttrPre'), int: clamp('#initialAttrInt')
    };
  }

  function updateInitialPointCounter() {
    const values = getInitialAttributes();
    const used = Object.values(values).reduce((sum, value) => sum + value, 0);
    const remaining = 100 - used;
    if ($('#initialPointsUsed')) $('#initialPointsUsed').textContent = used;
    if ($('#initialPointsRemaining')) {
      $('#initialPointsRemaining').textContent = remaining >= 0 ? `Restam ${remaining}` : `Excedeu ${Math.abs(remaining)}`;
      $('#initialPointsRemaining').className = remaining === 0 ? 'text-success' : remaining < 0 ? 'text-danger' : 'text-warning';
    }
    return { values, used };
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
    document.querySelectorAll('.footer-logo').forEach((img) => { img.src = cfg.logo; });
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
      autoBuffSources: Array.isArray(row.auto_buff_sources) ? row.auto_buff_sources : [],
      autoBuffs: { for:n(row.auto_buff_for),res:n(row.auto_buff_res),agi:n(row.auto_buff_agi),pre:n(row.auto_buff_pre),int:n(row.auto_buff_int),esp:n(row.auto_buff_esp) },
      manualBuffs: { for:n(row.manual_buff_for),res:n(row.manual_buff_res),agi:n(row.manual_buff_agi),pre:n(row.manual_buff_pre),int:n(row.manual_buff_int),esp:n(row.manual_buff_esp) },
      autoHakiBonus:n(row.auto_haki_bonus), manualHakiBonus:n(row.manual_haki_bonus),
      autoAkumaBonus:n(row.auto_akuma_bonus), manualAkumaBonus:n(row.manual_akuma_bonus),
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
    state.inventory=[]; state.weaponMods=[]; state.effects=[];
    state.weaponTypes=[]; state.weaponLevels=[]; state.weaponModCatalog=[];
    if (!sb || !state.authUser) return;
    const results = await Promise.all([
      sb.from('profiles').select('*').eq('id', state.authUser.id).maybeSingle(),
      sb.from('characters').select('*').eq('owner_id', state.authUser.id).order('created_at', { ascending:true }),
      sb.from('change_log').select('*').eq('owner_id', state.authUser.id).order('created_at', { ascending:true }),
      sb.from('inventory_items').select('*').eq('owner_id', state.authUser.id).order('created_at', { ascending:true }),
      sb.from('weapon_mods').select('*').order('created_at', { ascending:true }),
      sb.from('character_effects').select('*').eq('owner_id', state.authUser.id).order('started_at', { ascending:true }),
      sb.from('weapon_type_catalog').select('*').eq('active',true).order('sort_order'),
      sb.from('weapon_level_catalog').select('*').order('sort_order'),
      sb.from('weapon_mod_catalog').select('*').eq('active',true).order('sort_order'),
    ]);
    const firstError=results.find(r=>r.error)?.error; if(firstError) throw firstError;
    state.profile=results[0].data; state.characters=results[1].data||[]; state.logs=results[2].data||[];
    state.inventory=results[3].data||[]; state.weaponMods=results[4].data||[]; state.effects=results[5].data||[];
    state.weaponTypes=results[6].data||[]; state.weaponLevels=results[7].data||[]; state.weaponModCatalog=results[8].data||[];
  }

  async function loadAdminData() {
    state.adminProfiles=[]; state.adminCharacters=[]; state.adminLogs=[];
    state.adminInventory=[]; state.adminWeaponMods=[]; state.adminEffects=[];
    if (!state.profile || !isStaffRole(state.profile.role)) return;
    const results=await Promise.all([
      sb.from('profiles').select('*').order('username'),
      sb.from('characters').select('*').order('created_at'),
      sb.from('change_log').select('*').order('created_at',{ascending:false}).limit(5000),
      sb.from('inventory_items').select('*').order('created_at'),
      sb.from('weapon_mods').select('*').order('created_at'),
      sb.from('character_effects').select('*').order('started_at',{ascending:false}),
    ]);
    const firstError=results.find(r=>r.error)?.error; if(firstError) throw firstError;
    state.adminProfiles=results[0].data||[]; state.adminCharacters=results[1].data||[]; state.adminLogs=results[2].data||[];
    state.adminInventory=results[3].data||[]; state.adminWeaponMods=results[4].data||[]; state.adminEffects=results[5].data||[];
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
      const extra=h.changes?.description?`<div class="small text-muted">${html(h.changes.description)}</div>`:'';
      return `<div class="history-entry"><div class="history-meta"><strong>${html(h.origin)}</strong><span>${dateFmt(h.created_at)} • ${html(h.actor_role)}</span></div><div class="d-flex gap-2 flex-wrap mb-2"><span class="badge-soft ${auditBadgeClass(h.audit_status)}">${html(h.audit_status)}</span>${h.actor_role==='player'?'<span class="badge-soft badge-accent">Alteração do player</span>':''}</div>${changes.length?`<div class="small text-muted">${changes.map(c=>html(changeText(c))).join('<br>')}</div>`:extra}${h.reference?`<div class="small text-muted mt-2"><strong>Referência:</strong> ${html(h.reference)}</div>`:''}${h.audit_note?`<div class="small mt-2"><strong>ADM:</strong> ${html(h.audit_note)}</div>`:''}</div>`;
    }).join('');
  }


  function buffSourceText(source={}) {
    const b=source.buffs||{}; const parts=[];
    [['for','FOR'],['res','RES'],['agi','AGI'],['pre','PRE'],['int','INT'],['esp','ESP']].forEach(([k,l])=>{const v=n(b[k]);if(v)parts.push(`+${fmt(v)}% ${l}`);});
    if(n(source.haki)) parts.push(`+${fmt(source.haki)}% Haki`);
    if(n(source.akuma)) parts.push(`+${fmt(source.akuma)}% Akuma`);
    return parts.join(' • ') || 'Sem percentual permanente automático';
  }

  function ensureBuildAutomationUI() {
    if (document.body.dataset.page!=='player') return;
    const configs=[['#player-meta-raca','raca','opa-racas'],['#player-meta-linhagem','linhagem','opa-linhagens'],['#player-meta-profissao','profissao','opa-profissoes'],['#player-meta-subprofissao','subprofissao','opa-subprofissoes'],['#player-meta-edl','edl','opa-edls']];
    configs.forEach(([sel,key,id])=>{
      const input=$(sel); if(!input) return; input.setAttribute('list',id);
      if(!document.getElementById(id)){
        const dl=document.createElement('datalist'); dl.id=id;
        dl.innerHTML=BUILD_OPTIONS[key].map(v=>`<option value="${html(v)}"></option>`).join('');
        document.body.appendChild(dl);
      }
    });
    const r=$('#player-meta-raca'); if(r&&!r.placeholder) r.placeholder='Ex.: Mink, Rainha Kuja, Bucaneiro';
    const l=$('#player-meta-linhagem'); if(l&&!l.placeholder) l.placeholder='Ex.: Roronoa, Sakazuki, Nefertari';
    const e=$('#player-meta-edl'); if(e&&!e.placeholder) e.placeholder='Ex.: Santoryu (3 Espadas)';

    const manualFirst=$('#player-buff-delta-for');
    if(manualFirst && !$('#auto-buff-manual-warning')){
      const row=manualFirst.closest('.row');
      if(row) row.insertAdjacentHTML('beforebegin','<div class="system-note gold mb-3" id="auto-buff-manual-warning"><i class="bi bi-magic"></i><div><strong>Não digite de novo buffs permanentes de Raça, Linhagem ou EDL.</strong> Eles são puxados automaticamente do cadastro. Use estes campos só para exceções que ainda não estejam representadas no cadastro, inventário, arma equipada ou efeito ativo. Armas, mods e efeitos registrados no painel abaixo são puxados automaticamente.</div></div>');
    }

    const breakdown=$('#buff-breakdown');
    if(breakdown && !$('#auto-buff-engine')){
      breakdown.insertAdjacentHTML('afterend',`<div class="system-note mt-4" id="auto-buff-engine"><i class="bi bi-stars"></i><div class="w-100"><div class="d-flex justify-content-between align-items-center gap-2 flex-wrap"><strong>Buffs puxados automaticamente do cadastro</strong><button class="btn btn-sm btn-rpg-outline" id="btn-sync-auto-buffs" type="button"><i class="bi bi-arrow-repeat me-1"></i>Sincronizar agora</button></div><div class="small text-muted mt-1">Raça, linhagem e EDL reconhecidos são recalculados no Supabase. Bônus de Haki vão para Haki, fora dos 1000%. Buffs temporários/condicionais continuam manuais.</div><div class="mt-3" id="auto-buff-source-list"></div></div></div>`);
    }
  }

  function renderAutoBuffSources(c) {
    ensureBuildAutomationUI();
    const host=$('#auto-buff-source-list'); if(!host) return;
    const sources=Array.isArray(c?.autoBuffSources)?c.autoBuffSources:[];
    if(!sources.length){host.innerHTML='<span class="small text-muted">Nenhuma fonte automática reconhecida ainda. Salve Raça, Linhagem e/ou EDL usando os nomes sugeridos.</span>';return;}
    host.innerHTML=sources.map(src=>`<div class="history-entry py-2"><div class="d-flex justify-content-between gap-2 flex-wrap"><strong>${html(src.name||src.type||'Fonte')}</strong><span class="badge-soft badge-accent">${html(src.type||'automático')}</span></div><div class="small mt-1">${html(buffSourceText(src))}</div>${src.note?`<div class="small text-muted mt-1">${html(src.note)}</div>`:''}</div>`).join('');
  }


  const ITEM_NAME_SUGGESTIONS = ['Ração','Comida','Ervas','Madeira','Ferro/Metal','Componente Científico','Pólvora','Kairosheki (barra)','Roupas Comuns / Luxo','Roupas Calor / Frio','Roupas Calor/Frio Extremo','Roupas Anti-Chamas','Roupas Isolantes','Roupa de Mergulho','Máscara de Gás Básica','Máscara de Gás Avançada','Baby Den Den Mushi','Den Den Mushi Padrão','Den Den Mushi Longa Distância','Vivre Card','Log Pose Padrão','Log Pose Grand Line','Kit Médico Básico','Kit Cirúrgico Avançado','Mapa de Poneglyph','Lanterna de Ruínas','Kit de Ervas Avançado','Temperos Especiais','Coleira de Kairosheki','Componentes Raros'];
  const ATTR_SELECT_OPTIONS = [['','—'],['for','FOR'],['res','RES'],['agi','AGI'],['pre','PRE'],['int','INT'],['esp','ESP']];

  function itemCategoryLabel(v){return ({arma:'Arma',comida:'Comida',racao:'Ração',ervas:'Ervas',material:'Material',municao:'Munição',equipamento:'Equipamento',profissao:'Item de profissão',consumivel:'Consumível',outro:'Outro'}[v]||v||'Item');}
  function weaponRangeLabel(v){return v==='melee'?'Corpo a corpo':'À distância';}
  function weaponTypeMeta(key){return state.weaponTypes.find(x=>x.weapon_key===key)||null;}
  function weaponLevelMeta(key){return state.weaponLevels.find(x=>x.level_key===key)||null;}
  function weaponModMeta(key){return state.weaponModCatalog.find(x=>x.mod_key===key)||null;}
  function itemBuffText(item={}){
    const parts=[]; [['buff_for','FOR'],['buff_res','RES'],['buff_agi','AGI'],['buff_pre','PRE'],['buff_int','INT'],['buff_esp','ESP']].forEach(([k,l])=>{const v=n(item[k]);if(v)parts.push(`+${fmt(v)}% ${l}`);});
    return parts.join(' • ')||'Sem buff de atributo direto';
  }
  function inventoryForCharacter(characterId, admin=false){return (admin?state.adminInventory:state.inventory).filter(i=>i.character_id===characterId&&i.active);}
  function modsForWeapon(itemId, admin=false){return (admin?state.adminWeaponMods:state.weaponMods).filter(m=>m.weapon_item_id===itemId);}
  function effectsForCharacter(characterId, admin=false){return (admin?state.adminEffects:state.effects).filter(e=>e.character_id===characterId&&e.active);}
  function askReference(label='Informe a referência/origem da alteração:'){return esc(window.prompt(label,''));}

  function ensureInventoryUI(){
    if(document.body.dataset.page!=='player'||$('#opa-inventory-card')) return;
    const metaCard=$('#player-meta-form')?.closest('.surface-card'); if(!metaCard) return;
    metaCard.insertAdjacentHTML('afterend',`
      <div class="surface-card reveal mt-4" id="opa-inventory-card">
        <div class="kicker">Inventário auditável</div><h2 class="section-title" style="font-size:1.9rem">Arsenal, comida e recursos</h2>
        <p class="section-subtitle">Armas equipadas e efeitos ativos entram no motor automático de buffs. Quantidade, localização, mods e alterações ficam salvos no Supabase e registrados para a ADM.</p>
        <div class="system-note gold mt-3"><i class="bi bi-shield-lock"></i><div><strong>Armas:</strong> as 2 primeiras equipadas dão o buff completo; a 3ª dá metade. Armas a distância usam mods e respeitam os slots do tipo. Corpo a corpo usa Grau/Nível.</div></div>

        <div class="row g-4 mt-1">
          <div class="col-xl-6">
            <h3 class="h5 mb-3">Registrar arma</h3>
            <form id="opa-weapon-form" class="row g-3">
              <div class="col-md-6"><label class="form-label">Categoria</label><select class="form-select" id="opa-weapon-range"><option value="melee">Corpo a corpo</option><option value="ranged">À distância</option></select></div>
              <div class="col-md-6"><label class="form-label">Tipo de arma</label><select class="form-select" id="opa-weapon-type"></select></div>
              <div class="col-12"><label class="form-label">Nome da arma <span class="text-muted">(opcional)</span></label><input class="form-control" id="opa-weapon-name" placeholder="Ex.: Kurogane; se vazio usa o tipo"></div>
              <div class="col-12" id="opa-melee-fields">
                <div class="row g-3">
                  <div class="col-md-4"><label class="form-label">Nível / Grau</label><select class="form-select" id="opa-weapon-level"></select></div>
                  <div class="col-md-4" id="opa-primary-wrap"><label class="form-label">Atributo principal</label><select class="form-select" id="opa-weapon-primary"></select></div>
                  <div class="col-md-4" id="opa-secondary-wrap"><label class="form-label">Atributo secundário</label><select class="form-select" id="opa-weapon-secondary"></select></div>
                </div>
                <div class="small text-muted mt-2" id="opa-weapon-level-note"></div>
                <div class="mt-3 d-none" id="opa-improvement-allocation">
                  <div class="system-note"><i class="bi bi-sliders"></i><div><strong>Distribuição do Bônus Total</strong><br><span id="opa-allocation-rule"></span></div></div>
                  <div class="row g-2 mt-1">${ATTRS.map(([k,,sh])=>`<div class="col-6 col-md-4"><label class="form-label small">${sh}</label><input class="form-control" id="opa-alloc-${k}" type="number" min="0" value="0"></div>`).join('')}</div>
                  <div class="small mt-2">Distribuído: <strong id="opa-allocation-used">0</strong> / <strong id="opa-allocation-total">0</strong>%</div>
                </div>
              </div>
              <div class="col-md-4"><label class="form-label">Guardar em</label><select class="form-select" id="opa-weapon-location"><option value="personagem">Personagem</option><option value="navio">Navio</option></select></div>
              <div class="col-md-8"><label class="form-label">Referência / origem</label><input class="form-control" id="opa-weapon-reference" required placeholder="Compra, missão, evento, fabricação..."></div>
              <div class="col-12"><button class="btn btn-rpg w-100" type="submit"><i class="bi bi-plus-circle me-2"></i>Registrar arma</button></div>
            </form>
          </div>
          <div class="col-xl-6">
            <h3 class="h5 mb-3">Registrar item / recurso</h3>
            <form id="opa-item-form" class="row g-3">
              <div class="col-md-5"><label class="form-label">Categoria</label><select class="form-select" id="opa-item-category"><option value="racao">Ração</option><option value="comida">Comida</option><option value="ervas">Ervas</option><option value="material">Material</option><option value="municao">Munição</option><option value="equipamento">Equipamento</option><option value="profissao">Item de profissão</option><option value="consumivel">Consumível</option><option value="outro">Outro</option></select></div>
              <div class="col-md-7"><label class="form-label">Item</label><input class="form-control" id="opa-item-name" list="opa-item-suggestions" required></div>
              <div class="col-md-3"><label class="form-label">Quantidade</label><input class="form-control" id="opa-item-qty" type="number" min="1" value="1"></div>
              <div class="col-md-4"><label class="form-label">Local</label><select class="form-select" id="opa-item-location"><option value="personagem">Personagem</option><option value="navio">Navio</option></select></div>
              <div class="col-md-5"><label class="form-label">Referência</label><input class="form-control" id="opa-item-reference" required placeholder="Compra, coleta, missão..."></div>
              <div class="col-12"><button class="btn btn-rpg-outline w-100" type="submit"><i class="bi bi-box-seam me-2"></i>Adicionar ao inventário</button></div>
            </form>
            <datalist id="opa-item-suggestions">${ITEM_NAME_SUGGESTIONS.map(v=>`<option value="${html(v)}"></option>`).join('')}</datalist>
          </div>
        </div>

        <hr class="my-4">
        <h3 class="h5">Armas registradas</h3><div id="opa-weapon-list" class="mt-3"></div>
        <h3 class="h5 mt-4">Inventário do personagem e do navio</h3><div id="opa-inventory-list" class="mt-3"></div>

        <hr class="my-4">
        <h3 class="h5">Ativar buff temporário de item/comida</h3>
        <p class="small text-muted">O guia não define uma lista completa de receitas com valores fixos. Aqui você registra uma vez o buff aprovado da comida/consumível; enquanto o efeito estiver ativo, o site soma sozinho e tira quando você encerrar.</p>
        <form id="opa-effect-form" class="row g-3">
          <div class="col-md-4"><label class="form-label">Item-fonte</label><select class="form-select" id="opa-effect-source"><option value="">Sem item específico</option></select></div>
          <div class="col-md-4"><label class="form-label">Nome do efeito</label><input class="form-control" id="opa-effect-name" required placeholder="Ex.: Refeição de batalha"></div>
          <div class="col-md-4"><label class="form-label">Tipo</label><select class="form-select" id="opa-effect-type"><option value="comida">Comida</option><option value="consumivel">Consumível</option><option value="equipamento">Equipamento</option><option value="musica">Música</option><option value="evento">Evento</option><option value="outro">Outro</option></select></div>
          ${ATTRS.map(([k,,sh])=>`<div class="col-6 col-md-2"><label class="form-label">+% ${sh}</label><input class="form-control" id="opa-effect-${k}" type="number" min="0" value="0"></div>`).join('')}
          <div class="col-md-3"><label class="form-label">Consumir qtd.</label><input class="form-control" id="opa-effect-consume" type="number" min="0" value="0"></div>
          <div class="col-md-4"><label class="form-label">Duração / condição</label><input class="form-control" id="opa-effect-duration" placeholder="Ex.: 1 cena; 3 turnos"></div>
          <div class="col-md-5"><label class="form-label">Referência / aprovação</label><input class="form-control" id="opa-effect-reference" required></div>
          <div class="col-12"><label class="form-label">Observação</label><input class="form-control" id="opa-effect-notes" placeholder="Ex.: refeição produzida por Cozinheiro X"></div>
          <div class="col-12"><button class="btn btn-rpg-outline w-100" type="submit"><i class="bi bi-lightning-charge me-2"></i>Ativar efeito e puxar buff</button></div>
        </form>
        <div class="mt-4" id="opa-active-effects"></div>
      </div>`);
    const attrOpts=ATTR_SELECT_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    $('#opa-weapon-primary').innerHTML=attrOpts; $('#opa-weapon-secondary').innerHTML=attrOpts;
    updateWeaponFormUI();
  }

  function updateWeaponFormUI(){
    const range=$('#opa-weapon-range')?.value||'melee'; const typeSel=$('#opa-weapon-type'); if(!typeSel)return;
    const types=state.weaponTypes.filter(t=>t.range_type===range); const current=typeSel.value;
    typeSel.innerHTML=types.map(t=>`<option value="${t.weapon_key}">${html(t.display_name)}${range==='ranged'?` • ${t.max_mod_slots} slots`:''}</option>`).join('');
    if(types.some(t=>t.weapon_key===current)) typeSel.value=current;
    $('#opa-melee-fields')?.classList.toggle('d-none',range!=='melee');
    if(range==='melee'){
      const levelSel=$('#opa-weapon-level'); const lc=levelSel?.value;
      if(levelSel){levelSel.innerHTML=state.weaponLevels.map(l=>`<option value="${l.level_key}">${html(l.display_name)}</option>`).join(''); if(state.weaponLevels.some(l=>l.level_key===lc))levelSel.value=lc;}
      updateWeaponLevelUI();
    }
  }

  function updateWeaponLevelUI(){
    const meta=weaponLevelMeta($('#opa-weapon-level')?.value); if(!meta)return;
    if($('#opa-weapon-level-note')) $('#opa-weapon-level-note').textContent=meta.notes||'';
    const alloc=!!meta.requires_allocation; $('#opa-improvement-allocation')?.classList.toggle('d-none',!alloc);
    $('#opa-primary-wrap')?.classList.toggle('d-none',alloc||(!meta.primary_bonus&&!meta.secondary_bonus));
    $('#opa-secondary-wrap')?.classList.toggle('d-none',alloc||!meta.secondary_bonus);
    if($('#opa-allocation-rule')) $('#opa-allocation-rule').textContent=`${meta.display_name}: distribua exatamente ${fmt(meta.improvement_total)}% em no máximo ${meta.max_attributes} atributos.`;
    if($('#opa-allocation-total')) $('#opa-allocation-total').textContent=fmt(meta.improvement_total);
    updateAllocationCounter();
  }

  function updateAllocationCounter(){
    const total=ATTRS.reduce((sum,[k])=>sum+n($(`#opa-alloc-${k}`)?.value),0); if($('#opa-allocation-used'))$('#opa-allocation-used').textContent=fmt(total); return total;
  }

  function renderInventoryPanel(c){
    ensureInventoryUI(); if(!c||!$('#opa-inventory-card'))return;
    updateWeaponFormUI();
    const inv=inventoryForCharacter(c.id), weapons=inv.filter(i=>i.category==='arma'), items=inv.filter(i=>i.category!=='arma');
    const weaponHost=$('#opa-weapon-list');
    if(weaponHost){
      weaponHost.innerHTML=weapons.length?weapons.map(w=>{
        const wt=weaponTypeMeta(w.weapon_key), lvl=weaponLevelMeta(w.weapon_level), mods=modsForWeapon(w.id), used=mods.reduce((sum,x)=>sum+n(weaponModMeta(x.mod_key)?.slot_cost),0), max=n(wt?.max_mod_slots);
        const modRows=mods.map(x=>{const mc=weaponModMeta(x.mod_key);return `<span class="badge-soft badge-accent me-1 mb-1">${html(mc?.display_name||x.mod_key)} <button type="button" class="btn p-0 border-0 text-danger ms-1" data-inv-action="remove-mod" data-id="${x.id}" aria-label="Remover mod">×</button></span>`}).join('');
        const modOptions=state.weaponModCatalog.filter(mc=>!mods.some(x=>x.mod_key===mc.mod_key)&&( !mc.allowed_weapon_keys?.length || mc.allowed_weapon_keys.includes(w.weapon_key))).map(mc=>`<option value="${mc.mod_key}">${html(mc.display_name)}${mc.buff_pre?` (+${mc.buff_pre}% PRE)`:''}</option>`).join('');
        return `<div class="history-entry mb-3"><div class="d-flex justify-content-between gap-2 flex-wrap"><div><strong>${html(w.item_name)}</strong><div class="small text-muted">${html(weaponRangeLabel(w.weapon_range))} • ${html(wt?.display_name||w.weapon_key||'')} ${lvl?`• ${html(lvl.display_name)}`:''} • ${w.location==='navio'?'Navio':'Personagem'}</div></div><div><span class="badge-soft ${w.equipped?'badge-gold':'badge-soft'}">${w.equipped?`EQUIPADA #${w.equip_order}`:'GUARDADA'}</span></div></div><div class="small mt-2"><strong>Buff da arma:</strong> ${html(itemBuffText(w))}</div>${w.weapon_range==='ranged'?`<div class="small mt-2"><strong>Mods:</strong> ${used}/${max} slots</div><div class="mt-2">${modRows||'<span class="small text-muted">Nenhum mod instalado.</span>'}</div><div class="input-group mt-2"><select class="form-select form-select-sm" data-mod-select="${w.id}"><option value="">Adicionar mod...</option>${modOptions}</select><button class="btn btn-sm btn-rpg-outline" type="button" data-inv-action="add-mod" data-id="${w.id}">Instalar</button></div>`:''}<div class="d-flex gap-2 flex-wrap mt-3"><button class="btn btn-sm ${w.equipped?'btn-outline-secondary':'btn-rpg'}" type="button" data-inv-action="toggle-equip" data-id="${w.id}" data-equipped="${w.equipped?'1':'0'}">${w.equipped?'Guardar':'Equipar'}</button><button class="btn btn-sm btn-rpg-outline" type="button" data-inv-action="move" data-id="${w.id}" data-location="${w.location}">${w.location==='personagem'?'Mover p/ navio':'Mover p/ personagem'}</button><button class="btn btn-sm btn-outline-danger" type="button" data-inv-action="archive" data-id="${w.id}">Remover</button></div></div>`;
      }).join(''):'<div class="system-note"><i class="bi bi-shield"></i><div>Nenhuma arma registrada.</div></div>';
    }
    const itemHost=$('#opa-inventory-list');
    if(itemHost){itemHost.innerHTML=items.length?items.map(i=>`<div class="history-entry mb-2"><div class="d-flex justify-content-between gap-2 flex-wrap"><div><strong>${html(i.item_name)}</strong><div class="small text-muted">${html(itemCategoryLabel(i.category))} • ${i.location==='navio'?'Navio':'Personagem'}</div></div><span class="badge-soft badge-accent">x${fmt(i.quantity)}</span></div><div class="d-flex gap-2 flex-wrap mt-2"><button class="btn btn-sm btn-rpg-outline" data-item-action="plus" data-id="${i.id}">+1</button><button class="btn btn-sm btn-rpg-outline" data-item-action="minus" data-id="${i.id}">-1</button><button class="btn btn-sm btn-rpg-outline" data-item-action="move" data-id="${i.id}" data-location="${i.location}">${i.location==='personagem'?'Mover p/ navio':'Mover p/ personagem'}</button>${['comida','racao','consumivel','equipamento'].includes(i.category)?`<button class="btn btn-sm btn-rpg" data-item-action="effect" data-id="${i.id}">Usar / ativar</button>`:''}<button class="btn btn-sm btn-outline-danger" data-item-action="archive" data-id="${i.id}">Remover</button></div></div>`).join(''):'<div class="system-note"><i class="bi bi-box-seam"></i><div>Inventário vazio.</div></div>';}
    const src=$('#opa-effect-source'); if(src){const cur=src.value;src.innerHTML='<option value="">Sem item específico</option>'+items.map(i=>`<option value="${i.id}">${html(i.item_name)} • x${fmt(i.quantity)}</option>`).join('');if(items.some(i=>i.id===cur))src.value=cur;}
    const effects=effectsForCharacter(c.id), effHost=$('#opa-active-effects'); if(effHost){effHost.innerHTML=effects.length?`<h4 class="h6 text-uppercase text-muted">Efeitos ativos</h4>`+effects.map(e=>`<div class="history-entry mb-2"><div class="d-flex justify-content-between gap-2 flex-wrap"><div><strong>${html(e.effect_name)}</strong><div class="small text-muted">${html(e.effect_type)}${e.duration_label?` • ${html(e.duration_label)}`:''}</div></div><button class="btn btn-sm btn-outline-danger" data-effect-action="end" data-id="${e.id}">Encerrar</button></div><div class="small mt-2">${html(itemBuffText(e))}</div>${e.notes?`<div class="small text-muted">${html(e.notes)}</div>`:''}</div>`).join(''):'<div class="small text-muted">Nenhum efeito temporário ativo.</div>';}
  }

  async function submitWeaponForm(){
    const c=getActiveCharacter();if(!c)return;
    const range=$('#opa-weapon-range')?.value||'melee', level=weaponLevelMeta($('#opa-weapon-level')?.value), allocation={};
    if(range==='melee'&&level?.requires_allocation) ATTRS.forEach(([k])=>allocation[k]=n($(`#opa-alloc-${k}`)?.value));
    const payload={p_character_id:c.id,p_weapon_range:range,p_weapon_key:esc($('#opa-weapon-type')?.value),p_custom_name:esc($('#opa-weapon-name')?.value),p_level_key:range==='melee'?esc($('#opa-weapon-level')?.value):null,p_primary_attr:range==='melee'?esc($('#opa-weapon-primary')?.value)||null:null,p_secondary_attr:range==='melee'?esc($('#opa-weapon-secondary')?.value)||null:null,p_allocation:allocation,p_location:esc($('#opa-weapon-location')?.value)||'personagem',p_reference:esc($('#opa-weapon-reference')?.value)};
    if(!payload.p_reference)return showToast('Informe a referência/origem da arma.','warning');
    const {error}=await sb.rpc('register_weapon',payload);if(error)return showToast(error.message,'danger');
    if($('#opa-weapon-name'))$('#opa-weapon-name').value='';if($('#opa-weapon-reference'))$('#opa-weapon-reference').value='';ATTRS.forEach(([k])=>{if($(`#opa-alloc-${k}`))$(`#opa-alloc-${k}`).value=0;});
    await refreshOwn();showToast('Arma registrada no inventário. Equipe quando quiser ativar o buff.','success');
  }

  async function submitItemForm(){
    const c=getActiveCharacter();if(!c)return;const reference=esc($('#opa-item-reference')?.value);if(!reference)return showToast('Informe a origem/referência do item.','warning');
    const {error}=await sb.rpc('add_inventory_item',{p_character_id:c.id,p_category:esc($('#opa-item-category')?.value),p_item_name:esc($('#opa-item-name')?.value),p_quantity:Math.max(1,Math.trunc(n($('#opa-item-qty')?.value))),p_location:esc($('#opa-item-location')?.value)||'personagem',p_reference:reference});
    if(error)return showToast(error.message,'danger');$('#opa-item-name').value='';$('#opa-item-reference').value='';$('#opa-item-qty').value=1;await refreshOwn();showToast('Item registrado e enviado para auditoria.','success');
  }

  async function handleWeaponAction(button){
    const id=button.dataset.id, action=button.dataset.invAction; if(!id||!action)return;
    if(action==='toggle-equip'){
      const ref=askReference(button.dataset.equipped==='1'?'Referência para guardar a arma:':'Referência para equipar a arma:');if(!ref)return;
      const {error}=await sb.rpc('set_weapon_equipped',{p_item_id:id,p_equipped:button.dataset.equipped!=='1',p_reference:ref});if(error)return showToast(error.message,'danger');
    }else if(action==='add-mod'){
      const mod=$(`[data-mod-select="${id}"]`)?.value;if(!mod)return showToast('Escolha um mod.','warning');const ref=askReference('Origem/referência do mod:');if(!ref)return;
      const {error}=await sb.rpc('add_weapon_mod',{p_item_id:id,p_mod_key:mod,p_reference:ref});if(error)return showToast(error.message,'danger');
    }else if(action==='remove-mod'){
      const ref=askReference('Motivo/referência da remoção do mod:');if(!ref)return;const {error}=await sb.rpc('remove_weapon_mod',{p_weapon_mod_id:id,p_reference:ref});if(error)return showToast(error.message,'danger');
    }else if(action==='move'){
      const target=button.dataset.location==='personagem'?'navio':'personagem',ref=askReference(`Referência para mover a arma para ${target}:`);if(!ref)return;const {error}=await sb.rpc('transfer_inventory_item',{p_item_id:id,p_location:target,p_reference:ref});if(error)return showToast(error.message,'danger');
    }else if(action==='archive'){
      if(!confirm('Remover esta arma do inventário? O histórico será preservado.'))return;const ref=askReference('Informe se foi vendida, perdida, roubada, destruída etc.:');if(!ref)return;const {error}=await sb.rpc('archive_inventory_item',{p_item_id:id,p_reference:ref});if(error)return showToast(error.message,'danger');
    }
    await refreshOwn();showToast('Arsenal atualizado. Buffs automáticos recalculados.','success');
  }

  async function handleItemAction(button){
    const id=button.dataset.id, action=button.dataset.itemAction;if(!id||!action)return;
    if(action==='effect'){
      if($('#opa-effect-source'))$('#opa-effect-source').value=id;$('#opa-effect-name')?.focus();$('#opa-effect-form')?.scrollIntoView({behavior:'smooth',block:'center'});return;
    }
    if(action==='plus'||action==='minus'){
      const ref=askReference(action==='plus'?'Origem do +1 item:':'Motivo do -1 item:');if(!ref)return;const {error}=await sb.rpc('adjust_inventory_item',{p_item_id:id,p_delta:action==='plus'?1:-1,p_reference:ref});if(error)return showToast(error.message,'danger');
    }else if(action==='move'){
      const target=button.dataset.location==='personagem'?'navio':'personagem',ref=askReference(`Referência para mover para ${target}:`);if(!ref)return;const {error}=await sb.rpc('transfer_inventory_item',{p_item_id:id,p_location:target,p_reference:ref});if(error)return showToast(error.message,'danger');
    }else if(action==='archive'){
      if(!confirm('Remover este item do inventário?'))return;const ref=askReference('Informe se foi vendido, perdido, usado, roubado etc.:');if(!ref)return;const {error}=await sb.rpc('archive_inventory_item',{p_item_id:id,p_reference:ref});if(error)return showToast(error.message,'danger');
    }
    await refreshOwn();showToast('Inventário atualizado.','success');
  }

  async function submitEffectForm(){
    const c=getActiveCharacter();if(!c)return;const buff={};ATTRS.forEach(([k])=>buff[k]=Math.max(0,Math.trunc(n($(`#opa-effect-${k}`)?.value))));const reference=esc($('#opa-effect-reference')?.value);if(!reference)return showToast('Informe a referência/aprovação do efeito.','warning');
    const {error}=await sb.rpc('activate_character_effect',{p_character_id:c.id,p_source_item_id:esc($('#opa-effect-source')?.value)||null,p_effect_name:esc($('#opa-effect-name')?.value),p_effect_type:esc($('#opa-effect-type')?.value)||'outro',p_buff:buff,p_duration_label:esc($('#opa-effect-duration')?.value),p_notes:esc($('#opa-effect-notes')?.value),p_consume_quantity:Math.max(0,Math.trunc(n($('#opa-effect-consume')?.value))),p_reference:reference});
    if(error)return showToast(error.message,'danger');['#opa-effect-name','#opa-effect-duration','#opa-effect-notes','#opa-effect-reference'].forEach(sel=>{if($(sel))$(sel).value='';});ATTRS.forEach(([k])=>{if($(`#opa-effect-${k}`))$(`#opa-effect-${k}`).value=0;});if($('#opa-effect-consume'))$('#opa-effect-consume').value=0;
    await refreshOwn();showToast('Efeito ativado e buff puxado automaticamente.','success');
  }

  async function endEffect(id){const ref=askReference('Por que o efeito terminou?');if(!ref)return;const {error}=await sb.rpc('end_character_effect',{p_effect_id:id,p_reference:ref});if(error)return showToast(error.message,'danger');await refreshOwn();showToast('Efeito encerrado e buff removido automaticamente.','success');}

  function adminInventorySummaryHtml(characterId){
    const inv=inventoryForCharacter(characterId,true), weapons=inv.filter(i=>i.category==='arma'), items=inv.filter(i=>i.category!=='arma'), effects=effectsForCharacter(characterId,true);
    const weaponHtml=weapons.map(w=>{const wt=weaponTypeMeta(w.weapon_key);const mods=modsForWeapon(w.id,true).map(x=>weaponModMeta(x.mod_key)?.display_name||x.mod_key).join(', ');return `<div class="small"><strong>${html(w.item_name)}</strong> • ${html(wt?.display_name||w.weapon_key||'arma')} • ${w.equipped?`equipada #${w.equip_order}`:'guardada'} • ${html(itemBuffText(w))}${mods?` • Mods: ${html(mods)}`:''}</div>`}).join('');
    const itemHtml=items.map(i=>`<span class="badge-soft badge-accent me-1 mb-1">${html(i.item_name)} x${fmt(i.quantity)} • ${i.location==='navio'?'navio':'personagem'}</span>`).join('');
    const effectHtml=effects.map(e=>`<div class="small">⚡ ${html(e.effect_name)} • ${html(itemBuffText(e))}${e.duration_label?` • ${html(e.duration_label)}`:''}</div>`).join('');
    return `<div class="system-note mt-3"><i class="bi bi-box-seam"></i><div class="w-100"><strong>Inventário / Arsenal auditável</strong><div class="mt-2">${weaponHtml||'<span class="small text-muted">Sem armas registradas.</span>'}</div><div class="mt-2">${itemHtml||'<span class="small text-muted">Sem itens registrados.</span>'}</div>${effectHtml?`<div class="mt-2"><strong class="small">Efeitos ativos</strong>${effectHtml}</div>`:''}</div></div>`;
  }


  async function syncAutoBuffs() {
    const c=getActiveCharacter(); if(!c||!sb) return;
    const {data,error}=await sb.rpc('sync_my_auto_buffs',{p_character_id:c.id});
    if(error) return showToast(error.message.includes('function')?'Rode primeiro o SQL do motor de buffs automáticos no Supabase.':error.message,'danger');
    await refreshOwn();
    showToast(data?.changed?'Buffs automáticos recalculados e registrados.':'Buffs automáticos já estavam corretos.','success');
  }

  function fillMetaForm(c) {
    const vals={ '#player-meta-faccao':c.faccao,'#player-meta-cargo':c.cargo,'#player-meta-berries':c.berries,'#player-meta-raca':c.raca,'#player-meta-linhagem':c.linhagem,'#player-meta-profissao':c.profissao,'#player-meta-subprofissao':c.subprofissao,'#player-meta-edl':c.edl,'#player-meta-akuma':c.akuma?.nome,'#player-meta-localizacao':c.localizacao,'#player-meta-navio':c.navio };
    Object.entries(vals).forEach(([sel,v])=>{ if ($(sel)) $(sel).value=v??''; });
  }

  function renderPlayerPage() {
    if (document.body.dataset.page!=='player') return;
    ensureInventoryUI();
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
    if ($('#buff-breakdown')) $('#buff-breakdown').innerHTML=ATTRS.map(([key,,short])=>`<div class="buff-pill"><span>${short}</span><strong>+${fmt(c.buffs[key])}%</strong><small class="d-block text-muted">auto +${fmt(c.autoBuffs?.[key])}% • manual +${fmt(c.manualBuffs?.[key])}%</small></div>`).join('');
    renderAutoBuffSources(c);
    renderInventoryPanel(c);
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
    await refreshOwn(); if($('#player-whatsapp-summary')) $('#player-whatsapp-summary').value=summary; showToast('Dados atualizados; buffs do cadastro foram recalculados automaticamente e registrados para auditoria.','success');
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
    host.innerHTML=`<div class="admin-char-head"><div><div class="kicker">${html(p?.username||'Conta')}</div><h3>${factionIcon(c.faccao)} ${html(c.nome)}</h3><p>${html(c.faccao)} • ${html(c.cargo||'Sem cargo/recompensa')}</p></div><div class="text-end"><span class="badge-soft badge-accent">${fmt(total)} pts brutos</span><span class="badge-soft ${buffs>=GLOBAL_COMMON_BUFF_CAP?'badge-danger':'badge-gold'} ms-2">${buffs}/${GLOBAL_COMMON_BUFF_CAP}% buff</span><span class="badge-soft ${pend?'badge-gold':'badge-accent'} ms-2">${pend} pendente(s)</span></div></div><div class="shell-grid grid-3 mt-3">${ATTRS.map(([k,,s])=>`<div class="segment"><div class="text-muted small">${s}</div><strong>${fmt(c.atributos[k])}</strong><span class="d-block small text-muted">Buff +${fmt(c.buffs[k])}%</span></div>`).join('')}</div><div class="system-note gold mt-3"><i class="bi bi-lightning-charge"></i><div><strong>Fora do teto:</strong> Haki +${fmt(c.haki.bonusPercent)}% e Akuma +${fmt(c.akuma.bonusPercent)}%.</div></div>${c.autoBuffSources?.length?`<div class="system-note mt-3"><i class="bi bi-stars"></i><div><strong>Fontes automáticas:</strong><div class="small mt-2">${c.autoBuffSources.map(src=>`${html(src.name||src.type)} — ${html(buffSourceText(src))}`).join('<br>')}</div></div></div>`:''}${adminInventorySummaryHtml(row.id)}`;
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

  async function deslogar(){ if(sb) await sb.auth.signOut(); state.authUser=null;state.profile=null;state.characters=[];state.logs=[];state.inventory=[];state.weaponMods=[];state.effects=[];state.adminInventory=[];state.adminWeaponMods=[];state.adminEffects=[];localStorage.removeItem(LS.ACTIVE);stopRealtime();renderAll();showToast('Sessão encerrada.','info'); }

  async function salvarNovoPersonagem(){
    if(!state.profile) return openModal('loginModal');
    const nome=esc($('#newCharNome')?.value);
    if(!nome) return showToast('Informe o nome do personagem.','warning');
    const initial=updateInitialPointCounter();
    if(initial.used!==100) return showToast(`Distribua exatamente 100 pontos iniciais. Total atual: ${initial.used}/100.`,'warning');
    const {data,error}=await sb.rpc('create_character',{
      p_nome:nome,
      p_faccao:esc($('#newCharFaccao')?.value)||'Pirata',
      p_cargo:esc($('#newCharRecompensa')?.value),
      p_attr_for:initial.values.for,
      p_attr_res:initial.values.res,
      p_attr_agi:initial.values.agi,
      p_attr_pre:initial.values.pre,
      p_attr_int:initial.values.int
    });
    if(error) return showToast(error.message,'danger');
    localStorage.setItem(LS.ACTIVE,data.id);
    closeModal('criarPersonagemModal');
    await refreshOwn();
    showToast(`${nome} criado com 100 pontos iniciais distribuídos.`,'success');
  }

  async function refreshOwn(){ if(!sb)return; const {data:{user}}=await sb.auth.getUser();state.authUser=user||null;if(user){try{await loadOwnData();await consumePendingTeamCode();}catch(e){console.error(e);showToast(e.message||'Falha ao carregar dados.','danger');}}else{state.profile=null;state.characters=[];state.logs=[];} if(isStaffRole(state.profile?.role))await loadAdminData();setupRealtime();renderAll(); }
  async function refreshAdmin(){ if(!isStaffRole(state.profile?.role))return;await loadAdminData();renderAdminPage();renderOwnerTeamPanel(); }

  function setupRealtime(){ if(!sb||!state.authUser)return; stopRealtime(); state.realtime=sb.channel(`opa-live-${state.authUser.id}`).on('postgres_changes',{event:'*',schema:'public',table:'profiles'},()=>scheduleRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'characters'},()=>scheduleRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'change_log'},()=>scheduleRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'inventory_items'},()=>scheduleRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'weapon_mods'},()=>scheduleRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'character_effects'},()=>scheduleRefresh()).subscribe(); }
  function stopRealtime(){ if(state.realtime&&sb)sb.removeChannel(state.realtime);state.realtime=null; }
  let refreshTimer=null; function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refreshOwn(),350);}

  async function exportBackup(){ if(!state.profile)return; const payload=isStaffRole(state.profile.role)?{version:'6.3-team-code',exportedAt:new Date().toISOString(),profiles:state.adminProfiles,characters:state.adminCharacters,change_log:state.adminLogs}:{version:'6.3-team-code',exportedAt:new Date().toISOString(),profile:state.profile,characters:state.characters,change_log:state.logs}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`opa-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url); }

  function copyText(sel){const text=$(sel)?.value||localStorage.getItem(LS.LAST_SUMMARY)||'';if(!text)return showToast('Nada para copiar.','warning');navigator.clipboard?.writeText(text).then(()=>showToast('Resumo copiado.','success')).catch(()=>showToast('Não foi possível copiar automaticamente.','warning'));}

  function bindSearch(){const form=$('#site-search-form');if(!form||form.dataset.bound)return;form.dataset.bound='1';const norm=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const routes=[[['historia','lore','poneglyph'],'inicio-historia.html'],[['tutorial','regra','1000','buff'],'tutorial.html'],[['ficha','atributo'],'criacao-ficha.html'],[['raca','mink','lunaria','gigante'],'racas.html'],[['linhagem','familia'],'linhagens.html'],[['profissao','subprofissao'],'profissoes.html'],[['faccao','marinha','pirata','revolucionario'],'faccoes.html'],[['edl','estilo'],'edl.html'],[['evolucao','treino'],'evolucao.html'],[['missao','pericia'],'pericia-missoes.html'],[['arco'],'arcos.html'],[['combate','estado','acerto'],'combate.html'],[['hp','dano','espirito'],'hp-dano.html'],[['hospital'],'hospital.html'],[['navio','doca','galeao'],'navios.html'],[['loja','preco'],'loja.html'],[['negocio','renda'],'negocios.html'],[['submundo','mercado negro'],'submundo.html'],[['npc','frota'],'npcs.html'],[['arma','ferreiro','gunsmith'],'armas.html'],[['akuma','haki','future sight'],'poderes.html'],[['navegacao','evento','log pose','rota','reverse mountain'],'navegacao.html'],[['mapa','mapas','mundo'],'mapas.html?regiao=mundo'],[['forca dos mares','força dos mares','teto do mar','pressao de saida','pressão de saída'],'forca-dos-mares.html']];form.addEventListener('submit',e=>{e.preventDefault();const raw=norm(esc($('#site-search-input')?.value));if(!raw)return;const found=routes.find(([terms])=>terms.some(t=>raw.includes(norm(t))||norm(t).includes(raw)));location.href=`${ROOT}Pages/${found?.[1]||'tutorial.html'}`;});}

  function bindButtons(){ensureUtilityModals();const bind=(sel,event,fn)=>{const el=$(sel);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener(event,fn);}};
    bind('#btn-login','click',()=>openModal('loginModal'));bind('#btn-cadastro','click',()=>openModal('cadastroModal'));bind('#btn-player-login','click',()=>openModal('loginModal'));bind('#btn-player-cadastro','click',()=>openModal('cadastroModal'));bind('#btn-novo-personagem','click',()=>openModal('criarPersonagemModal'));bind('#hero-btn-novo-personagem','click',()=>openModal('criarPersonagemModal'));bind('#btn-painel-usuario','click',()=>location.href=`${ROOT}Pages/player.html`);bind('#btn-perfil','click',()=>location.href=`${ROOT}Pages/player.html`);bind('#btn-logout-top','click',deslogar);bind('#btn-logout','click',deslogar);bind('#btn-character-death','click',markCharacterDead);
    bind('#login-form','submit',e=>{e.preventDefault();realizarLogin();});bind('#cadastro-form','submit',e=>{e.preventDefault();realizarCadastro();});bind('#character-form','submit',e=>{e.preventDefault();salvarNovoPersonagem();});bind('#login-submit','click',realizarLogin);bind('#cadastro-submit','click',realizarCadastro);bind('#create-character-submit','click',salvarNovoPersonagem);
    bind('#select-personagem-ativo','change',e=>{localStorage.setItem(LS.ACTIVE,e.target.value);renderAll();});bind('#player-update-form','submit',e=>{e.preventDefault();submitPlayerMechanicalUpdate();});bind('#player-meta-form','submit',e=>{e.preventDefault();submitPlayerMetadata();});bind('#btn-copy-player-whatsapp','click',()=>copyText('#player-whatsapp-summary'));bind('#btn-sync-auto-buffs','click',syncAutoBuffs);
    bind('#opa-weapon-range','change',updateWeaponFormUI);bind('#opa-weapon-level','change',updateWeaponLevelUI);ATTRS.forEach(([k])=>bind(`#opa-alloc-${k}`,'input',updateAllocationCounter));
    bind('#opa-weapon-form','submit',e=>{e.preventDefault();submitWeaponForm();});bind('#opa-item-form','submit',e=>{e.preventDefault();submitItemForm();});bind('#opa-effect-form','submit',e=>{e.preventDefault();submitEffectForm();});
    bind('#opa-weapon-list','click',e=>{const b=e.target.closest('[data-inv-action]');if(b)handleWeaponAction(b);});bind('#opa-inventory-list','click',e=>{const b=e.target.closest('[data-item-action]');if(b)handleItemAction(b);});bind('#opa-active-effects','click',e=>{const b=e.target.closest('[data-effect-action="end"]');if(b)endEffect(b.dataset.id);});
    bind('#admin-player-select','change',()=>{localStorage.setItem(LS.ADMIN_SELECTED_USER,$('#admin-player-select').value);localStorage.removeItem(LS.ADMIN_SELECTED_CHAR);renderAdminSelectors();renderAdminCharacter();});bind('#admin-character-select','change',()=>{localStorage.setItem(LS.ADMIN_SELECTED_CHAR,$('#admin-character-select').value);renderAdminCharacter();});bind('#admin-audit-filter','change',renderAdminAudit);bind('#admin-audit-search','input',renderAdminAudit);bind('#admin-audit-feed','click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;if(b.dataset.action==='audit')auditChange(b.dataset.id,b.dataset.status);if(b.dataset.action==='open'){localStorage.setItem(LS.ADMIN_SELECTED_USER,b.dataset.user);localStorage.setItem(LS.ADMIN_SELECTED_CHAR,b.dataset.char);renderAdminSelectors();renderAdminCharacter();$('#admin-character-summary')?.scrollIntoView({behavior:'smooth',block:'center'});}});bind('#admin-correction-form','submit',e=>{e.preventDefault();submitAdminCorrection();});bind('#btn-copy-admin-correction','click',()=>copyText('#admin-correction-summary'));bind('#btn-export-backup','click',exportBackup);bind('#import-backup-file','change',()=>showToast('Importação pelo navegador foi desativada no modo compartilhado para preservar a integridade do banco. Use o Supabase/SQL para restaurações.','warning'));bind('#btn-claim-admin-code','click',activateAdminFromPlayerPage);bind('#btn-owner-save-code','click',ownerSaveTeamCode);bind('#btn-owner-toggle-signup','click',ownerToggleAdminSignup);bind('#owner-team-members','click',e=>{const b=e.target.closest('button[data-owner-role]');if(b)ownerChangeRole(b.dataset.user,b.dataset.ownerRole);});[['#toggle-team-code','#cadCodigo'],['#toggle-login-team-code','#loginCodigo'],['#toggle-activation-code','#team-access-code'],['#toggle-owner-team-code','#owner-team-code']].forEach(([btnSel,inputSel])=>bind(btnSel,'click',()=>{const inp=$(inputSel);if(!inp)return;inp.type=inp.type==='password'?'text':'password';const i=$(btnSel)?.querySelector('i');if(i)i.className=inp.type==='password'?'bi bi-eye':'bi bi-eye-slash';}));bindSearch();}

  function ensureWorldNavigationLinks(){
    const navAnchor=$$('.dropdown-menu a').find(a=>/(?:^|\/)navegacao\.html(?:$|[?#])/i.test(a.getAttribute('href')||''));
    const menu=navAnchor?.closest('.dropdown-menu');
    if(!menu)return;
    const add=(key,href,label,icon)=>{
      if(menu.querySelector(`[data-opa-world-extra="${key}"]`))return;
      const li=document.createElement('li');
      li.dataset.opaWorldExtra=key;
      li.innerHTML=`<a class="dropdown-item" href="${ROOT}Pages/${href}"><i class="bi ${icon} me-2"></i>${label}</a>`;
      menu.appendChild(li);
    };
    add('maps','mapas.html?regiao=mundo','Mapas do Mundo','bi-map');
    add('forces','forca-dos-mares.html','Força dos Mares','bi-bar-chart-steps');
  }

  function setActiveNav(){const page=document.body.dataset.page;$$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===page));}
  function renderAll(){ensureWorldNavigationLinks();ensureBuildAutomationUI();renderAuthArea();renderHomeData();renderPlayerPage();renderTeamAccess();renderAdminPage();renderOwnerTeamPanel();bindButtons();}

  Object.assign(window,{OPA:{state,MAX_CHARACTERS,GLOBAL_COMMON_BUFF_CAP,ATTRS,MARINE_RANKS,getActiveCharacter,getTotalBruto,getCommonBuffTotal,refresh:refreshOwn},realizarCadastro,realizarLogin,deslogar,salvarNovoPersonagem});

  function corrigirConsultaPublicaMobile(){
    const PUBLIC_SHEET='https://docs.google.com/spreadsheets/d/1PjsWvj8FpNpk8HFtG4uuGolLl5-o-AnTDQOOOMG_88s/edit?usp=drivesdk';
    const OLD_SHEET_IDS=['17NQW6O2eS8KofLsCYYWFl3ETdNahh9C6eidGI3MOdno'];
    const path=location.pathname.toLowerCase();
    const isAvailabilityPage=/(?:\/|^)(racas|linhagens)\.html$/.test(path);
    const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

    // Remove o atalho "Consultar disponibilidade" dos menus em todas as páginas.
    document.querySelectorAll('.dropdown-menu a').forEach(a=>{
      if(norm(a.textContent).includes('consultar disponibilidade')){
        const li=a.closest('li');
        (li||a).remove();
      }
    });

    // Corrige o endereço da consulta pública e deixa o bloco apenas em Raças/Linhagens.
    document.querySelectorAll('a[href*="docs.google.com/spreadsheets"]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      const isOpaAvailability=OLD_SHEET_IDS.some(id=>href.includes(id)) || href.includes('1PjsWvj8FpNpk8HFtG4uuGolLl5-o-AnTDQOOOMG_88s');
      if(!isOpaAvailability) return;

      if(isAvailabilityPage){
        a.setAttribute('href',PUBLIC_SHEET);
        a.setAttribute('target','_blank');
        a.setAttribute('rel','noopener noreferrer');
        return;
      }

      const menuItem=a.closest('.dropdown-menu li');
      if(menuItem){ menuItem.remove(); return; }

      const block=a.closest('.availability-callout, .system-note');
      if(block && /disponibilidade|planilha publica|ocupacao/.test(norm(block.textContent))){
        block.remove();
      }
    });
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    ensureWorldNavigationLinks();corrigirConsultaPublicaMobile();ensureUtilityModals();ensureBuildAutomationUI();setActiveNav();bindButtons();showBackendBanner();
    if(!sb){renderAll();return;}
    const {data:{session}}=await sb.auth.getSession();state.authUser=session?.user||null;
    sb.auth.onAuthStateChange((_event,session)=>{state.authUser=session?.user||null;setTimeout(()=>refreshOwn(),0);});
    await refreshOwn();
  });
})();
