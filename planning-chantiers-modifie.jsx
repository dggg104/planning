import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Search, MapPin, Phone, User, Grid2x2, Users, Loader2, Calendar, ClipboardList, Dices, Wrench, Boxes, Ruler, Layers, Navigation, ExternalLink, Download, Upload, Copy, Check, PenTool, Eraser, Maximize2, Image as ImageIcon, Wallet, History, Wand2 } from 'lucide-react';

const PALETTE = {
  ink: '#1D1B18',
  inkSoft: '#726A5C',
  inkFaint: '#9A927F',
  paper: '#F1EBDD',
  line: '#E1D8C3',
  lineSoft: '#EBE3D0',
  card: '#FFFFFF',
  oak: '#BE7F3E',
  oakDeep: '#8A5726',
  oakLight: '#F3E3CC',
};

const TEAM_COLORS = ['#BE7F3E', '#6E4527', '#A85A3B', '#6F7A52', '#7C6A96'];
const TEAM_WOODS = ['Chêne', 'Noyer', 'Merisier', 'Frêne', 'Orme'];

const TEAMS = [1, 2, 3, 4, 5].map((n) => ({
  id: n,
  name: `Équipe ${n}`,
  wood: TEAM_WOODS[n - 1],
  color: TEAM_COLORS[n - 1],
}));

const STATUTS = [
  { id: 'a_venir', label: 'À venir', color: '#9A927F' },
  { id: 'en_cours', label: 'En cours', color: '#6F7A52' },
  { id: 'termine', label: 'Terminé', color: '#5C7385' },
  { id: 'urgent', label: 'Urgent', color: '#B54A2B' },
];

const TYPES_TRAVAUX = [
  { id: 'renovation', label: 'Rénovation', icon: Wrench },
  { id: 'depose_totale', label: 'Dépose totale', icon: Boxes },
];

function statutOf(id) {
  return STATUTS.find((s) => s.id === id) || STATUTS[0];
}
function typeTravauxOf(id) {
  return TYPES_TRAVAUX.find((t) => t.id === id) || TYPES_TRAVAUX[0];
}

function statutFinancierOf(montantTotal, acompte) {
  const total = parseFloat(montantTotal) || 0;
  const paye = parseFloat(acompte) || 0;
  if (total <= 0) return { label: 'Non renseigné', color: '#9A927F' };
  if (paye <= 0) return { label: 'Non réglé', color: '#B54A2B' };
  if (paye >= total) return { label: 'Soldé', color: '#6F7A52' };
  return { label: 'Acompte versé', color: '#BE7F3E' };
}

// Génère un croquis "vue intérieure" type fiche technique menuiserie :
// cadre rectangulaire, un vantail par colonne avec sa croix diagonale,
// et un petit repère de poignée au centre.
function genererCroquisTemplate(vantaux = 2, size = 300) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  const margin = size * 0.12;
  const left = margin;
  const right = size - margin;
  const top = margin;
  const bottom = size - margin;
  const width = right - left;
  const height = bottom - top;
  const nb = Math.max(1, Math.min(4, parseInt(vantaux, 10) || 2));
  const colWidth = width / nb;
  const ink = '#2A4B9C';

  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.strokeRect(left, top, width, height);

  for (let i = 0; i < nb; i++) {
    const colLeft = left + i * colWidth;
    const colRight = colLeft + colWidth;
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(colLeft, top);
      ctx.lineTo(colLeft, bottom);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(colLeft, top);
    ctx.lineTo(colRight, bottom);
    ctx.moveTo(colRight, top);
    ctx.lineTo(colLeft, bottom);
    ctx.stroke();
  }

  const handleX = nb > 1 ? left + colWidth : (left + right) / 2;
  const handleY = (top + bottom) / 2;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(handleX - size * 0.035, handleY);
  ctx.lineTo(handleX + size * 0.035, handleY);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

const PRENOMS = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Camille', 'Nathalie', 'Julien', 'Claire', 'Marc', 'Isabelle', 'Antoine', 'Sandrine', 'Olivier', 'Céline', 'Vincent', 'Émilie', 'Thierry', 'Laurence', 'Bruno'];
const NOMS = ['Dubosc', 'Lefèvre', 'Moreau', 'Girard', 'Rousseau', 'Blanchard', 'Fontaine', 'Chevalier', 'Robin', 'Masson', 'Marchand', 'Duval', 'Renard', 'Gauthier', 'Perrot', 'Lambert', 'Bonnet', 'François', 'Vasseur', 'Legrand'];
const TYPES = ['Villa', 'Maison', 'Rénovation appartement', 'Pavillon', 'Résidence', 'Corps de ferme', 'Extension maison', 'Immeuble', 'Longère'];
const RUES = ['rue des Tilleuls', 'rue du Moulin', 'avenue de la Gare', 'rue des Acacias', 'chemin des Vignes', 'rue Victor Hugo', "rue de l'Église", 'impasse des Chênes', 'rue des Peupliers', 'avenue Jean Jaurès', 'rue de la Fontaine', 'chemin du Bois'];
const VILLES = [
  { cp: '69003', ville: 'Lyon' },
  { cp: '69100', ville: 'Villeurbanne' },
  { cp: '69300', ville: 'Caluire-et-Cuire' },
  { cp: '38200', ville: 'Vienne' },
  { cp: '01500', ville: 'Ambérieu-en-Bugey' },
  { cp: '69400', ville: 'Villefranche-sur-Saône' },
  { cp: '42000', ville: 'Saint-Étienne' },
  { cp: '73000', ville: 'Chambéry' },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function randomTelephone() {
  const bloc = () => randInt(10, 99);
  return `06 ${randInt(10, 99)} ${bloc()} ${bloc()} ${bloc()}`;
}
function randomDate() {
  const start = new Date();
  start.setDate(start.getDate() + randInt(-10, 75));
  return start.toISOString().slice(0, 10);
}
function randomMesuresFenetres(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      largeur: randInt(8, 36) * 5,
      hauteur: randInt(8, 44) * 5,
      vantaux: pick([1, 2, 2, 3]),
      croquis: '',
    });
  }
  return out;
}
function genererChantiersAleatoires(nb) {
  const out = [];
  for (let i = 0; i < nb; i++) {
    const ville = pick(VILLES);
    const statuts = ['a_venir', 'a_venir', 'en_cours', 'en_cours', 'termine', 'urgent'];
    const nbFenetres = randInt(3, 24);
    const montantTotal = randInt(30, 220) * 100;
    const acompte = pick([0, Math.round(montantTotal * 0.3), Math.round(montantTotal * 0.5), montantTotal]);
    out.push({
      id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      nom: `${pick(TYPES)} ${pick(NOMS)}`,
      adresse: `${randInt(2, 148)} ${pick(RUES)}, ${ville.cp} ${ville.ville}`,
      clientNom: `${pick(['M.', 'Mme'])} ${pick(PRENOMS)} ${pick(NOMS)}`,
      clientTel: randomTelephone(),
      nbFenetres,
      equipe: randInt(1, 5),
      statut: pick(statuts),
      dateDebut: randomDate(),
      typeTravaux: pick(['renovation', 'renovation', 'depose_totale']),
      effectif: randInt(2, 5),
      fenetresDetails: randomMesuresFenetres(nbFenetres),
      gps: '',
      nbVisites: randInt(1, 4),
      montantTotal,
      acompte,
      modeReglement: pick(['CHQ', 'VIR', 'CB', 'Espèces']),
      notes: '',
    });
  }
  return out;
}

function emptyForm(defaultTeam) {
  return {
    id: null,
    nom: '',
    adresse: '',
    clientNom: '',
    clientTel: '',
    nbFenetres: '',
    equipe: defaultTeam || 1,
    statut: 'a_venir',
    dateDebut: '',
    typeTravaux: 'renovation',
    effectif: '',
    fenetresDetails: [],
    gps: '',
    nbVisites: 1,
    montantTotal: '',
    acompte: '',
    modeReglement: 'CHQ',
    notes: '',
  };
}

const SEED_CHANTIER_ID = 'seed-la-plagne-1';
const SEED_CHANTIER = {
  id: SEED_CHANTIER_ID,
  nom: 'La Plagne 1',
  adresse: 'PF Salon 82, Mâcot-la-Plagne, 73210 La Plagne-Tarentaise',
  clientNom: 'Jean Émile Mendim',
  clientTel: '06 12 34 56 78',
  nbFenetres: '',
  equipe: 1,
  statut: 'a_venir',
  dateDebut: '2026-09-02',
  typeTravaux: 'renovation',
  effectif: '',
  fenetresDetails: [],
  gps: '45.5039612, 6.6793656',
  nbVisites: 1,
  montantTotal: '',
  acompte: '',
  modeReglement: 'CHQ',
  notes: '',
};

const GRAIN_BG = {
  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(29,27,24,0.05) 1px, transparent 0)',
  backgroundSize: '20px 20px',
};

export default function ChantierPlanner() {
  const [chantiers, setChantiers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedChantier, setSelectedChantier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saveErrorDetail, setSaveErrorDetail] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [technicienNom, setTechnicienNom] = useState('');
  const [editingNom, setEditingNom] = useState(false);
  const [nomInput, setNomInput] = useState('');

  useEffect(() => {
    (async () => {
      let list = [];
      try {
        if (!window.storage) throw new Error('window.storage indisponible dans cet environnement');
        const res = await window.storage.get('chantiers', true);
        if (res && res.value) {
          list = JSON.parse(res.value);
        }
      } catch (e) {
        // pas encore de données enregistrées, ou stockage indisponible
      }
      if (!list.some((c) => c.id === SEED_CHANTIER_ID)) {
        list = [...list, SEED_CHANTIER];
        try {
          await window.storage.set('chantiers', JSON.stringify(list), true);
        } catch (e) {
          // tant pis, on l'affiche quand même localement
        }
      }
      setChantiers(list);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!window.storage) return;
        const res = await window.storage.get('technicien_nom', false);
        if (res && res.value) setTechnicienNom(res.value);
      } catch (e) {
        // pas encore de prénom enregistré
      }
    })();
  }, []);

  async function saveNom(nom) {
    setTechnicienNom(nom);
    setEditingNom(false);
    try {
      if (window.storage) await window.storage.set('technicien_nom', nom, false);
    } catch (e) {
      // tant pis, le prénom reste au moins affiché pour cette session
    }
  }

  const persist = useCallback(async (list) => {
    if (typeof window === 'undefined' || !window.storage) {
      setSaveError(true);
      setSaveErrorDetail('window.storage est indisponible dans cet environnement.');
      return;
    }
    try {
      const res = await window.storage.set('chantiers', JSON.stringify(list), true);
      if (!res) {
        setSaveError(true);
        setSaveErrorDetail("La sauvegarde a renvoyé un résultat vide (echec silencieux de l'API).");
      } else {
        setSaveError(false);
        setSaveErrorDetail('');
      }
    } catch (e) {
      setSaveError(true);
      setSaveErrorDetail(e && e.message ? e.message : String(e));
    }
  }, []);

  function openNew() {
    setEditing(emptyForm(selectedTeam || 1));
    setModalOpen(true);
  }
  function openEdit(ch) {
    setEditing({ ...ch });
    setModalOpen(true);
  }

  async function genererAleatoire(nb = 6) {
    const nouveaux = genererChantiersAleatoires(nb);
    const next = [...chantiers, ...nouveaux];
    setChantiers(next);
    await persist(next);
  }

  async function saveChantier(e) {
    e.preventDefault();
    if (!(editing.nom || '').trim() || !(editing.adresse || '').trim()) return;
    setSaving(true);
    try {
      let next;
      if (editing.id) {
        next = chantiers.map((c) => (c.id === editing.id ? editing : c));
      } else {
        next = [...chantiers, { ...editing, id: `${Date.now()}` }];
      }
      setChantiers(next);
      await persist(next);
      setModalOpen(false);
      setSelectedChantier((sc) => (sc && sc.id === editing.id ? editing : sc));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function deleteChantier(id) {
    const next = chantiers.filter((c) => c.id !== id);
    setChantiers(next);
    await persist(next);
    setConfirmDelete(null);
    setSelectedChantier((sc) => (sc && sc.id === id ? null : sc));
  }

  async function incrementVisite(id) {
    const next = chantiers.map((c) => (c.id === id ? { ...c, nbVisites: (parseInt(c.nbVisites, 10) || 0) + 1 } : c));
    setChantiers(next);
    await persist(next);
    setSelectedChantier((sc) => (sc && sc.id === id ? next.find((c) => c.id === id) : sc));
  }

  const filtered = chantiers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return [c.nom, c.adresse, c.clientNom].some((v) => (v || '').toLowerCase().includes(q));
    }
    return true;
  });
  const totalFenetres = filtered.reduce((sum, c) => sum + (parseInt(c.nbFenetres, 10) || 0), 0);

  const todayISO = (() => {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  })();
  const todayLabel = new Date(todayISO + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const chantiersAujourdhui = chantiers.filter((c) => c.dateDebut === todayISO);
  const prochainChantier = chantiers
    .filter((c) => c.dateDebut && c.dateDebut > todayISO)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))[0];

  function mapsUrlFor(c) {
    const q = c.gps && c.gps.trim() ? c.gps : c.adresse;
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
  }

  return (
    <div style={{ ...GRAIN_BG, background: PALETTE.paper, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: PALETTE.ink, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: ${PALETTE.oak}; color: white; }
        input, select, textarea, button { font-family: 'Inter', sans-serif; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${PALETTE.oak} !important; box-shadow: 0 0 0 4px rgba(190,127,62,0.16); }
        button { cursor: pointer; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${PALETTE.line}; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: ${PALETTE.oak}; }
        @keyframes riseIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .rise-in { animation: riseIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .pop-in { animation: popIn 0.28s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-in { animation: fadeIn 0.2s ease both; }
        .card-hover { transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1), border-color 0.2s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 16px 32px -12px rgba(29,27,24,0.16), 0 4px 8px -2px rgba(29,27,24,0.06); }
        .btn-lift { transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease; }
        .btn-lift:hover { transform: translateY(-1px); }
        .btn-lift:active { transform: translateY(0px) scale(0.98); }
      `}</style>

      {saveError && (
        <div style={{ background: '#B54A2B', color: '#fff' }} className="px-5 py-3 text-center text-sm">
          <p className="font-medium">
            Impossible d'enregistrer automatiquement — vos données restent affichées ici mais peuvent se perdre si vous fermez ou rechargez la page.
          </p>
          <p style={{ opacity: 0.85, fontSize: '12px' }} className="mt-1">
            Utilisez le bouton <strong>Exporter</strong> ci-dessous pour copier vos chantiers en sécurité.
            {saveErrorDetail ? ` (${saveErrorDetail})` : ''}
          </p>
        </div>
      )}

      {/* Signature: bandeau essences de bois */}
      <div className="flex w-full" style={{ height: '5px' }}>
        {TEAM_COLORS.map((c, i) => (
          <div key={i} style={{ background: c, flex: 1 }} />
        ))}
      </div>

      {/* Header : résumé du jour */}
      <header style={{ background: `linear-gradient(180deg, ${PALETTE.ink} 0%, #262320 100%)` }} className="px-5 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div
              style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, boxShadow: '0 6px 16px -4px rgba(190,127,62,0.5)' }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            >
              <Layers size={20} className="text-white" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              {editingNom ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nomInput}
                    onChange={(e) => setNomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveNom(nomInput.trim()); }}
                    placeholder="Votre prénom"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
                    className="text-sm rounded-lg px-2.5 py-1.5 border w-32"
                  />
                  <button onClick={() => saveNom(nomInput.trim())} style={{ color: PALETTE.oak }} className="text-xs font-semibold">
                    OK
                  </button>
                </div>
              ) : (
                <h1
                  style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
                  className="text-white text-xl sm:text-2xl font-semibold leading-tight"
                >
                  Bonjour Mendim, chantier de prévu : Jullian Maxime
                </h1>
              )}
              <p style={{ color: '#A79E8D' }} className="text-sm mt-0.5 capitalize">
                {todayLabel}
              </p>
            </div>
          </div>

          {chantiersAujourdhui.length > 0 ? (
            chantiersAujourdhui.map((c) => {
              const nbF = (c.fenetresDetails || []).length || parseInt(c.nbFenetres, 10) || 0;
              return (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)' }} className="rounded-2xl border p-4 flex flex-col gap-1.5">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-white font-semibold text-base">
                    Chantier : {c.nom}
                  </span>
                  <p style={{ color: '#D8D2C2' }} className="text-sm">
                    {nbF} fenêtre{nbF > 1 ? 's' : ''} à poser
                  </p>
                  <p style={{ color: '#A79E8D' }} className="text-sm">
                    Adresse : {c.adresse}
                  </p>
                  <a
                    href={mapsUrlFor(c)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif" }}
                    className="btn-lift inline-flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-full w-fit mt-1.5"
                  >
                    <Navigation size={14} />
                    Ouvrir dans Maps
                  </a>
                </div>
              );
            })
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }} className="rounded-2xl border p-4">
              <p style={{ color: '#D8D2C2' }} className="text-sm">Aucun chantier prévu aujourd'hui.</p>
              {prochainChantier && (
                <p style={{ color: '#A79E8D' }} className="text-xs mt-1">
                  Prochain : {prochainChantier.nom} — {prochainChantier.dateDebut}
                </p>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Barre de contrôle */}
      <div style={{ background: `${PALETTE.paper}F2`, borderColor: PALETTE.line, backdropFilter: 'blur(8px)' }} className="border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-col gap-3.5">
          <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
            <div style={{ borderColor: PALETTE.line, background: PALETTE.card, minWidth: '140px' }} className="flex-1 flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-sm">
              <Search size={16} style={{ color: PALETTE.inkFaint }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full text-sm bg-transparent border-none"
              />
            </div>
            <button
              onClick={() => genererAleatoire(6)}
              style={{ borderColor: PALETTE.line, color: PALETTE.inkSoft, background: PALETTE.card, fontFamily: "'Space Grotesk', sans-serif" }}
              className="btn-lift flex items-center gap-1.5 border px-4 py-2.5 rounded-full text-sm font-medium shadow-sm whitespace-nowrap"
              title="Ajoute 6 chantiers fictifs pour tester le planning"
            >
              <Dices size={16} />
              <span className="hidden xs:inline sm:inline">Générer 6</span>
            </button>
            <button
              onClick={openNew}
              style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 20px -6px rgba(190,127,62,0.55)' }}
              className="btn-lift flex items-center gap-1.5 text-white px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap"
            >
              <Plus size={16} />
              <span className="hidden xs:inline sm:inline">Nouveau chantier</span>
            </button>
            <button
              onClick={() => setExportOpen(true)}
              style={{ borderColor: PALETTE.line, color: PALETTE.inkSoft, background: PALETTE.card }}
              className="btn-lift flex items-center justify-center border p-2.5 rounded-full shadow-sm shrink-0"
              title="Exporter les chantiers (sauvegarde manuelle)"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => setImportOpen(true)}
              style={{ borderColor: PALETTE.line, color: PALETTE.inkSoft, background: PALETTE.card }}
              className="btn-lift flex items-center justify-center border p-2.5 rounded-full shadow-sm shrink-0"
              title="Importer des chantiers depuis une sauvegarde"
            >
              <Upload size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-7">
        {!loaded ? (
          <div className="flex items-center justify-center py-24" style={{ color: PALETTE.inkSoft }}>
            <Loader2 size={20} className="animate-spin mr-2" />
            Chargement du planning…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={chantiers.length > 0} onNew={openNew} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered
              .slice()
              .sort((a, b) => (a.dateDebut || '9999').localeCompare(b.dateDebut || '9999'))
              .map((c, i) => (
                <div key={c.id} className="rise-in" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                  <ChantierCard
                    chantier={c}
                    team={TEAMS.find((t) => t.id === c.equipe)}
                    onOpen={() => setSelectedChantier(c)}
                    onEdit={() => openEdit(c)}
                    onDelete={() => setConfirmDelete(c)}
                  />
                </div>
              ))}
          </div>
        )}
      </main>

      {modalOpen && editing && (
        <ChantierModal editing={editing} setEditing={setEditing} onSave={saveChantier} onClose={() => { setModalOpen(false); setEditing(null); }} saving={saving} />
      )}

      {selectedChantier && !modalOpen && (
        <DetailModal
          chantier={selectedChantier}
          team={TEAMS.find((t) => t.id === selectedChantier.equipe)}
          onClose={() => setSelectedChantier(null)}
          onEdit={() => openEdit(selectedChantier)}
          onDelete={() => setConfirmDelete(selectedChantier)}
          onIncrementVisite={() => incrementVisite(selectedChantier.id)}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal chantier={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={() => deleteChantier(confirmDelete.id)} />
      )}

      {exportOpen && <ExportModal chantiers={chantiers} onClose={() => setExportOpen(false)} />}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImport={async (list) => {
            setChantiers(list);
            await persist(list);
            setImportOpen(false);
          }}
        />
      )}
    </div>
  );
}

function TeamTab({ active, label, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? color : PALETTE.card,
        color: active ? '#fff' : PALETTE.ink,
        borderColor: active ? color : PALETTE.line,
        fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: active ? `0 8px 16px -6px ${color}80` : '0 1px 2px rgba(29,27,24,0.03)',
      }}
      className="btn-lift flex items-center gap-2 border rounded-full pl-2.5 pr-3.5 py-1.5 text-sm font-medium whitespace-nowrap shrink-0"
    >
      <span
        style={{ background: active ? 'rgba(255,255,255,0.55)' : color }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
      />
      <span>{label}</span>
      {sub && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", opacity: active ? 0.8 : 0.5, fontSize: '10px' }} className="tracking-wide">
          {sub}
        </span>
      )}
    </button>
  );
}

function ChantierCard({ chantier, team, onOpen, onEdit, onDelete }) {
  const statut = statutOf(chantier.statut);
  return (
    <div
      onClick={onOpen}
      style={{ borderColor: PALETTE.line, background: PALETTE.card, boxShadow: '0 1px 2px rgba(29,27,24,0.04), 0 6px 16px -8px rgba(29,27,24,0.08)' }}
      className="card-hover relative rounded-2xl border pl-6 pr-5 py-5 cursor-pointer overflow-hidden"
    >
      <div style={{ background: `linear-gradient(180deg, ${team?.color || PALETTE.oak}, ${team?.color || PALETTE.oak}99)`, width: '5px' }} className="absolute left-0 top-0 bottom-0" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em', fontSize: '15px' }} className="font-semibold leading-snug pr-2">
          {chantier.nom}
        </h3>
        <span
          style={{ background: `${statut.color}1F`, color: statut.color, fontSize: '11px' }}
          className="shrink-0 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          <span style={{ background: statut.color }} className="w-1.5 h-1.5 rounded-full" />
          {statut.label}
        </span>
      </div>

      <div className="space-y-2 text-sm" style={{ color: PALETTE.inkSoft }}>
        <div className="flex items-start gap-2.5">
          <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: team?.color || PALETTE.oak }} />
          <span>{chantier.adresse}</span>
        </div>
        {chantier.clientNom && (
          <div className="flex items-center gap-2.5">
            <User size={14} className="shrink-0" style={{ color: team?.color || PALETTE.oak }} />
            <span>{chantier.clientNom}</span>
            {chantier.nbVisites > 0 && (
              <span
                style={{ background: `${(team?.color || PALETTE.oak)}17`, color: team?.color || PALETTE.oakDeep, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
                className="font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                title="Nombre de passages chez le client"
              >
                N°{chantier.nbVisites}
              </span>
            )}
          </div>
        )}
        {chantier.clientTel && (
          <div className="flex items-center gap-2.5">
            <Phone size={14} className="shrink-0" style={{ color: team?.color || PALETTE.oak }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{chantier.clientTel}</span>
          </div>
        )}
        {chantier.dateDebut && (
          <div className="flex items-center gap-2.5">
            <Calendar size={14} className="shrink-0" style={{ color: team?.color || PALETTE.oak }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{chantier.dateDebut}</span>
          </div>
        )}
      </div>

      <div style={{ borderColor: PALETTE.lineSoft }} className="flex items-center justify-between mt-4 pt-3.5 border-t">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            style={{ background: `${(team?.color || PALETTE.oak)}17`, color: team?.color || PALETTE.oakDeep, fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
            className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full"
          >
            <Grid2x2 size={13} />
            {chantier.nbFenetres || 0}
          </div>
          {chantier.effectif && (
            <div style={{ color: PALETTE.inkFaint, fontFamily: "'IBM Plex Mono', monospace" }} className="flex items-center gap-1 text-xs">
              <Users size={12} />
              {chantier.effectif}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-full hover:bg-black/5 transition-colors" title="Modifier">
            <Pencil size={14} style={{ color: PALETTE.inkSoft }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-full hover:bg-black/5 transition-colors" title="Supprimer">
            <Trash2 size={14} style={{ color: '#B54A2B' }} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5">
        {team && (
          <span style={{ color: team.color, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} className="font-medium tracking-wide">
            {team.name}
          </span>
        )}
        <span style={{ color: PALETTE.inkFaint, fontSize: '11px' }} className="font-medium tracking-wide">
          {typeTravauxOf(chantier.typeTravaux).label}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ hasAny, onNew }) {
  return (
    <div className="fade-in flex flex-col items-center justify-center text-center py-24">
      <div
        style={{ background: PALETTE.card, borderColor: PALETTE.line, boxShadow: '0 8px 24px -10px rgba(29,27,24,0.15)' }}
        className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-5"
      >
        <ClipboardList size={24} style={{ color: PALETTE.oak }} />
      </div>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-semibold mb-1.5">
        {hasAny ? 'Aucun chantier ne correspond' : 'Aucun chantier pour le moment'}
      </h3>
      <p style={{ color: PALETTE.inkSoft }} className="text-sm mb-6 max-w-sm">
        {hasAny ? 'Essayez une autre équipe ou une autre recherche.' : 'Ajoutez le premier chantier pour commencer le planning des équipes.'}
      </p>
      <button
        onClick={onNew}
        style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 10px 22px -8px rgba(190,127,62,0.55)' }}
        className="btn-lift flex items-center gap-1.5 text-white px-5 py-2.5 rounded-full text-sm font-medium"
      >
        <Plus size={16} />
        Nouveau chantier
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ color: PALETTE.inkSoft, fontSize: '11px' }} className="font-semibold uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = { borderColor: PALETTE.line };
const inputClass = 'border rounded-xl px-3.5 py-2.5 text-sm bg-white transition-shadow';

function ChantierModal({ editing, setEditing, onSave, onClose, saving }) {
  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });
  const [formError, setFormError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    try {
      if (!(editing.nom || '').trim() || !(editing.adresse || '').trim()) {
        setFormError('Le nom du chantier et l\u2019adresse sont obligatoires.');
        return;
      }
      setFormError('');
      onSave(e);
    } catch (err) {
      setFormError('Une erreur est survenue : ' + (err && err.message ? err.message : String(err)));
    }
  }

  function addMesure() {
    const list = editing.fenetresDetails || [];
    const nextList = [...list, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, largeur: '', hauteur: '', vantaux: 2, croquis: '' }];
    setEditing({ ...editing, fenetresDetails: nextList, nbFenetres: nextList.length });
  }
  function updateMesure(id, key, value) {
    const nextList = (editing.fenetresDetails || []).map((m) => (m.id === id ? { ...m, [key]: value } : m));
    setEditing({ ...editing, fenetresDetails: nextList });
  }
  function removeMesure(id) {
    const nextList = (editing.fenetresDetails || []).filter((m) => m.id !== id);
    setEditing({ ...editing, fenetresDetails: nextList, nbFenetres: nextList.length || editing.nbFenetres });
  }
  const [sketchTarget, setSketchTarget] = useState(null);

  return (
    <div className="fade-in fixed inset-0 bg-black/45 flex items-start sm:items-center justify-center p-4 py-8 z-50 overflow-y-auto" style={{ backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PALETTE.paper, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }}
        className="pop-in w-full max-w-lg rounded-2xl my-auto"
      >
        <div style={{ background: `linear-gradient(135deg, ${PALETTE.ink}, #2A2621)` }} className="flex items-center justify-between px-5 py-4 rounded-t-2xl">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-white font-semibold">
            {editing.id ? 'Modifier le chantier' : 'Nouveau chantier'}
          </h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {formError && (
            <div style={{ background: '#B54A2B14', color: '#B54A2B', borderColor: '#B54A2B33' }} className="border rounded-xl px-3.5 py-2.5 text-sm font-medium">
              {formError}
            </div>
          )}
          <Field label="Nom du chantier *">
            <input required value={editing.nom} onChange={set('nom')} placeholder="Ex. Villa Dubosc" style={inputStyle} className={inputClass} />
          </Field>

          <Field label="Adresse *">
            <input required value={editing.adresse} onChange={set('adresse')} placeholder="Ex. 14 rue des Tilleuls, 69003 Lyon" style={inputStyle} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom du client">
              <input value={editing.clientNom} onChange={set('clientNom')} placeholder="Ex. M. Dubosc" style={inputStyle} className={inputClass} />
            </Field>
            <Field label="Téléphone client">
              <input value={editing.clientTel} onChange={set('clientTel')} placeholder="Ex. 06 12 34 56 78" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre de fenêtres">
              <input
                type="number" min="0" value={editing.nbFenetres} onChange={set('nbFenetres')} placeholder="0"
                disabled={(editing.fenetresDetails || []).length > 0}
                style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
                className={`${inputClass} disabled:opacity-50`}
              />
            </Field>
            <Field label="Date de début">
              <input type="date" value={editing.dateDebut} onChange={set('dateDebut')} style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type de travaux">
              <select value={editing.typeTravaux} onChange={set('typeTravaux')} style={inputStyle} className={inputClass}>
                {TYPES_TRAVAUX.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Effectif prévu">
              <input type="number" min="0" value={editing.effectif} onChange={set('effectif')} placeholder="Ex. 3" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Équipe">
              <select value={editing.equipe} onChange={(e) => setEditing({ ...editing, equipe: parseInt(e.target.value, 10) })} style={inputStyle} className={inputClass}>
                {TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — bois {t.wood}</option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select value={editing.statut} onChange={set('statut')} style={inputStyle} className={inputClass}>
                {STATUTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="N° de passage chez le client">
              <input type="number" min="1" value={editing.nbVisites} onChange={set('nbVisites')} placeholder="1" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className={inputClass} />
            </Field>
            <Field label="Mode de règlement">
              <select value={editing.modeReglement} onChange={set('modeReglement')} style={inputStyle} className={inputClass}>
                <option value="CHQ">Chèque</option>
                <option value="VIR">Virement</option>
                <option value="CB">Carte bancaire</option>
                <option value="Espèces">Espèces</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Montant total (€)">
              <input type="number" min="0" value={editing.montantTotal} onChange={set('montantTotal')} placeholder="Ex. 8500" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className={inputClass} />
            </Field>
            <Field label="Acompte versé (€)">
              <input type="number" min="0" value={editing.acompte} onChange={set('acompte')} placeholder="Ex. 2500" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className={inputClass} />
            </Field>
          </div>

          <Field label="Coordonnées GPS (latitude, longitude)">
            <input
              value={editing.gps}
              onChange={set('gps')}
              placeholder="Ex. 45.5039612, 6.6793656"
              style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
              className={inputClass}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: PALETTE.inkSoft, fontSize: '11px' }} className="font-semibold uppercase tracking-wider">
                Mesures des fenêtres (L × H, cm)
              </span>
              <button type="button" onClick={addMesure} style={{ color: PALETTE.oakDeep }} className="text-xs font-semibold flex items-center gap-1 hover:underline">
                <Plus size={13} />
                Ajouter
              </button>
            </div>
            {(editing.fenetresDetails || []).length === 0 ? (
              <p style={{ color: PALETTE.inkFaint }} className="text-xs">
                Aucune mesure ajoutée — le nombre de fenêtres ci-dessus sera utilisé tel quel.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                {editing.fenetresDetails.map((m, i) => (
                  <div key={m.id} style={{ borderColor: PALETTE.lineSoft }} className="flex flex-col gap-2 pb-3 border-b last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span style={{ color: PALETTE.inkFaint, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs w-8 shrink-0">n°{i + 1}</span>
                      <input type="number" min="0" value={m.largeur} onChange={(e) => updateMesure(m.id, 'largeur', e.target.value)} placeholder="Largeur" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className="border rounded-lg px-2.5 py-1.5 text-sm bg-white w-full" />
                      <span style={{ color: PALETTE.inkFaint }} className="text-xs">×</span>
                      <input type="number" min="0" value={m.hauteur} onChange={(e) => updateMesure(m.id, 'hauteur', e.target.value)} placeholder="Hauteur" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} className="border rounded-lg px-2.5 py-1.5 text-sm bg-white w-full" />
                      <button type="button" onClick={() => removeMesure(m.id)} className="p-1.5 rounded-full hover:bg-black/5 shrink-0">
                        <X size={14} style={{ color: '#B54A2B' }} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pl-10 flex-wrap">
                      {m.croquis ? (
                        <img
                          src={m.croquis}
                          onClick={() => setSketchTarget(m.id)}
                          alt={`Croquis fenêtre n°${i + 1}`}
                          style={{ borderColor: PALETTE.line, width: '44px', height: '44px', objectFit: 'cover' }}
                          className="rounded-md border cursor-pointer bg-white shrink-0"
                        />
                      ) : null}
                      <select
                        value={m.vantaux || 2}
                        onChange={(e) => updateMesure(m.id, 'vantaux', parseInt(e.target.value, 10))}
                        style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
                        className="border rounded-lg px-2 py-1 text-xs bg-white shrink-0"
                      >
                        <option value={1}>1 vantail</option>
                        <option value={2}>2 vantaux</option>
                        <option value={3}>3 vantaux</option>
                        <option value={4}>4 vantaux</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => updateMesure(m.id, 'croquis', genererCroquisTemplate(m.vantaux || 2))}
                        style={{ color: PALETTE.oakDeep }}
                        className="text-xs font-medium flex items-center gap-1 hover:underline"
                        title="Générer automatiquement le schéma type (cadre + vantaux + repère poignée)"
                      >
                        <Wand2 size={13} />
                        Générer
                      </button>
                      <button
                        type="button"
                        onClick={() => setSketchTarget(m.id)}
                        style={{ color: PALETTE.oakDeep }}
                        className="text-xs font-medium flex items-center gap-1 hover:underline"
                      >
                        <PenTool size={13} />
                        {m.croquis ? 'Annoter' : 'Dessiner à la main'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="Notes">
            <textarea value={editing.notes} onChange={set('notes')} rows={3} placeholder="Détails utiles pour l'équipe : accès, particularités, matériaux…" style={inputStyle} className={`${inputClass} resize-none`} />
          </Field>
        </div>

        <div style={{ borderColor: PALETTE.line, background: PALETTE.paper }} className="flex items-center justify-end gap-2 px-5 py-4 border-t rounded-b-2xl">
          <button type="button" onClick={onClose} style={{ color: PALETTE.inkSoft }} className="px-4 py-2.5 text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
            Annuler
          </button>
          <button
            type="button" disabled={saving} onClick={handleSubmit}
            style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 20px -6px rgba(190,127,62,0.55)' }}
            className="btn-lift px-5 py-2.5 text-sm font-medium text-white rounded-full disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>

      {sketchTarget && (
        <SketchModal
          initialData={(editing.fenetresDetails || []).find((m) => m.id === sketchTarget)?.croquis || ''}
          onClose={() => setSketchTarget(null)}
          onSave={(dataUrl) => {
            updateMesure(sketchTarget, 'croquis', dataUrl);
            setSketchTarget(null);
          }}
        />
      )}
    </div>
  );
}

function SketchModal({ initialData, onClose, onSave }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [hasDrawing, setHasDrawing] = useState(!!initialData);
  const SIZE = 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (initialData) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, SIZE, SIZE);
      img.src = initialData;
    }
  }, [initialData]);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
    return {
      x: ((clientX - rect.left) / rect.width) * SIZE,
      y: ((clientY - rect.top) / rect.height) * SIZE,
    };
  }

  function start(e) {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
  }
  function move(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
    setHasDrawing(true);
  }
  function end(e) {
    drawingRef.current = false;
  }

  function clearCanvas() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, SIZE, SIZE);
    setHasDrawing(false);
  }

  function save() {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(hasDrawing ? dataUrl : '');
  }

  return (
    <div className="fade-in fixed inset-0 bg-black/45 flex items-start sm:items-center justify-center p-4 py-8 z-50 overflow-y-auto" style={{ backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PALETTE.paper, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }}
        className="pop-in w-full max-w-sm rounded-2xl my-auto"
      >
        <div style={{ background: `linear-gradient(135deg, ${PALETTE.ink}, #2A2621)` }} className="flex items-center justify-between px-5 py-4 rounded-t-2xl">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-white font-semibold text-sm">
            Croquis intérieur de la fenêtre
          </h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-3">
          <p style={{ color: PALETTE.inkSoft }} className="text-xs self-start">
            Dessinez au doigt ou à la souris — comme sur la fiche technique papier.
          </p>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{ borderColor: PALETTE.line, touchAction: 'none', width: '100%', maxWidth: `${SIZE}px`, aspectRatio: '1 / 1' }}
            className="border rounded-xl bg-white cursor-crosshair"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
          <button
            type="button"
            onClick={clearCanvas}
            style={{ color: PALETTE.inkSoft }}
            className="text-xs font-medium flex items-center gap-1.5 hover:underline"
          >
            <Eraser size={13} />
            Effacer le croquis
          </button>
        </div>

        <div style={{ borderColor: PALETTE.line, background: PALETTE.paper }} className="flex items-center justify-end gap-2 px-5 py-4 border-t rounded-b-2xl">
          <button type="button" onClick={onClose} style={{ color: PALETTE.inkSoft }} className="px-4 py-2.5 text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 20px -6px rgba(190,127,62,0.55)' }}
            className="btn-lift flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-full"
          >
            <Check size={14} />
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ chantier, team, onClose, onEdit, onDelete, onIncrementVisite }) {
  const statut = statutOf(chantier.statut);
  const travaux = typeTravauxOf(chantier.typeTravaux);
  const TravauxIcon = travaux.icon;
  const mesures = chantier.fenetresDetails || [];
  const finStatut = statutFinancierOf(chantier.montantTotal, chantier.acompte);
  const montantNum = parseFloat(chantier.montantTotal) || 0;
  const acompteNum = parseFloat(chantier.acompte) || 0;
  const soldeNum = Math.max(montantNum - acompteNum, 0);
  const [lightbox, setLightbox] = useState(null);

  return (
    <div className="fade-in fixed inset-0 bg-black/45 flex items-start sm:items-center justify-center p-4 py-8 z-50 overflow-y-auto" style={{ backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PALETTE.paper, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }}
        className="pop-in w-full max-w-lg rounded-2xl my-auto relative"
      >
        <div style={{ background: `linear-gradient(90deg, ${team?.color || PALETTE.oak}, ${team?.color || PALETTE.oak}55)` }} className="h-1.5 rounded-t-2xl" />
        <div style={{ background: `linear-gradient(135deg, ${PALETTE.ink}, #2A2621)` }} className="flex items-start justify-between px-5 py-4">
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }} className="text-white font-semibold text-lg leading-snug pr-4">
              {chantier.nom}
            </h2>
            <div className="flex items-center gap-2.5 mt-2">
              <span style={{ background: `${statut.color}40`, color: '#fff', fontSize: '11px' }} className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full">
                <span style={{ background: statut.color }} className="w-1.5 h-1.5 rounded-full" />
                {statut.label}
              </span>
              {team && (
                <span style={{ color: team.color, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} className="font-medium">
                  {team.name}
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: team?.color || PALETTE.oak }} />
              <span>{chantier.adresse}</span>
            </div>
            {chantier.clientNom && (
              <div className="flex items-center gap-2.5">
                <User size={16} className="shrink-0" style={{ color: team?.color || PALETTE.oak }} />
                <span>{chantier.clientNom}</span>
                {chantier.nbVisites > 0 && (
                  <span
                    style={{ background: `${(team?.color || PALETTE.oak)}17`, color: team?.color || PALETTE.oakDeep, fontFamily: "'IBM Plex Mono', monospace" }}
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                  >
                    N°{chantier.nbVisites}
                  </span>
                )}
                <button
                  onClick={onIncrementVisite}
                  style={{ color: PALETTE.inkFaint }}
                  className="text-xs font-medium hover:underline flex items-center gap-1"
                  title="Enregistrer un nouveau passage chez le client"
                >
                  <History size={12} />
                  +1 visite
                </button>
              </div>
            )}
            {chantier.clientTel && (
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0" style={{ color: team?.color || PALETTE.oak }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{chantier.clientTel}</span>
              </div>
            )}
            {chantier.dateDebut && (
              <div className="flex items-center gap-2.5">
                <Calendar size={16} className="shrink-0" style={{ color: team?.color || PALETTE.oak }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{chantier.dateDebut}</span>
              </div>
            )}
            {chantier.gps && (
              <div className="flex items-center gap-2.5">
                <Navigation size={16} className="shrink-0" style={{ color: team?.color || PALETTE.oak }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{chantier.gps}</span>
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(chantier.gps)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: PALETTE.oakDeep }}
                  className="flex items-center gap-1 text-xs font-medium hover:underline shrink-0"
                >
                  Ouvrir dans Maps
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div style={{ borderColor: PALETTE.line, background: PALETTE.card }} className="rounded-xl border p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color: PALETTE.inkFaint }}>
                <TravauxIcon size={14} />
                <span style={{ fontSize: '10px' }} className="font-semibold uppercase tracking-wider">Travaux</span>
              </div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold">{travaux.label}</span>
            </div>
            <div style={{ borderColor: PALETTE.line, background: PALETTE.card }} className="rounded-xl border p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color: PALETTE.inkFaint }}>
                <Users size={14} />
                <span style={{ fontSize: '10px' }} className="font-semibold uppercase tracking-wider">Effectif prévu</span>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm font-semibold">
                {chantier.effectif ? `${chantier.effectif} pers.` : 'Non renseigné'}
              </span>
            </div>
          </div>

          <div style={{ borderColor: PALETTE.line, background: `linear-gradient(135deg, ${PALETTE.oakLight}55, ${PALETTE.card})` }} className="rounded-xl border p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5" style={{ color: PALETTE.inkFaint }}>
                <Wallet size={14} />
                <span style={{ fontSize: '10px' }} className="font-semibold uppercase tracking-wider">Suivi financier</span>
              </div>
              <span
                style={{ background: `${finStatut.color}1F`, color: finStatut.color, fontSize: '11px' }}
                className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full"
              >
                <span style={{ background: finStatut.color }} className="w-1.5 h-1.5 rounded-full" />
                {finStatut.label}
              </span>
            </div>
            {montantNum > 0 ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div style={{ color: PALETTE.inkFaint, fontSize: '10px' }}>Total</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm font-semibold">{montantNum.toLocaleString('fr-FR')} €</div>
                </div>
                <div>
                  <div style={{ color: PALETTE.inkFaint, fontSize: '10px' }}>Versé</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: PALETTE.oakDeep }} className="text-sm font-semibold">{acompteNum.toLocaleString('fr-FR')} €</div>
                </div>
                <div>
                  <div style={{ color: PALETTE.inkFaint, fontSize: '10px' }}>Solde</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: soldeNum > 0 ? '#B54A2B' : PALETTE.ink }} className="text-sm font-semibold">{soldeNum.toLocaleString('fr-FR')} €</div>
                </div>
              </div>
            ) : (
              <p style={{ color: PALETTE.inkFaint }} className="text-sm">Aucun montant renseigné.</p>
            )}
            {chantier.modeReglement && montantNum > 0 && (
              <div style={{ color: PALETTE.inkFaint }} className="text-xs mt-2 text-center">Règlement : {chantier.modeReglement}</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2.5" style={{ color: PALETTE.inkFaint }}>
              <Ruler size={14} />
              <span style={{ fontSize: '10px' }} className="font-semibold uppercase tracking-wider">
                Fenêtres ({mesures.length || chantier.nbFenetres || 0})
              </span>
            </div>
            {mesures.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {mesures.map((m, i) => (
                  <div key={m.id || i} style={{ borderColor: PALETTE.line, background: PALETTE.card }} className="rounded-lg border p-1.5 text-center">
                    {m.croquis ? (
                      <img
                        src={m.croquis}
                        onClick={() => setLightbox(m)}
                        alt={`Croquis fenêtre n°${i + 1}`}
                        style={{ borderColor: PALETTE.lineSoft }}
                        className="w-full aspect-square object-cover rounded-md border cursor-pointer mb-1"
                      />
                    ) : (
                      <div style={{ color: PALETTE.inkFaint }} className="w-full aspect-square rounded-md flex items-center justify-center mb-1">
                        <ImageIcon size={16} />
                      </div>
                    )}
                    <div style={{ color: PALETTE.inkFaint, fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px' }}>n°{i + 1}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="font-medium text-xs">{m.largeur}×{m.hauteur}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: PALETTE.inkFaint }} className="text-sm">Aucune mesure détaillée renseignée.</p>
            )}
          </div>

          {lightbox && (
            <div
              style={{ zIndex: 60 }}
              className="fade-in fixed inset-0 bg-black/70 flex items-center justify-center p-6"
              onClick={() => setLightbox(null)}
            >
              <div className="pop-in flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {lightbox.croquis ? (
                  <img src={lightbox.croquis} alt="Croquis agrandi" style={{ maxHeight: '70vh' }} className="rounded-xl bg-white" />
                ) : (
                  <p className="text-white text-sm">Aucun croquis pour cette fenêtre.</p>
                )}
                <button onClick={() => setLightbox(null)} style={{ background: 'rgba(255,255,255,0.15)' }} className="text-white text-sm px-4 py-2 rounded-full flex items-center gap-1.5">
                  <X size={14} />
                  Fermer
                </button>
              </div>
            </div>
          )}

          {chantier.notes && (
            <div>
              <div className="mb-1.5" style={{ color: PALETTE.inkFaint }}>
                <span style={{ fontSize: '10px' }} className="font-semibold uppercase tracking-wider">Notes</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{chantier.notes}</p>
            </div>
          )}
        </div>

        <div style={{ borderColor: PALETTE.line, background: PALETTE.paper }} className="flex items-center justify-between gap-2 px-5 py-4 border-t rounded-b-2xl">
          <button onClick={onDelete} className="text-sm font-medium px-3 py-2.5 rounded-full hover:bg-black/5 transition-colors" style={{ color: '#B54A2B' }}>
            Supprimer
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} style={{ color: PALETTE.inkSoft }} className="px-4 py-2.5 text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
              Fermer
            </button>
            <button
              onClick={onEdit}
              style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 20px -6px rgba(190,127,62,0.55)' }}
              className="btn-lift flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-full"
            >
              <Pencil size={14} />
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ chantier, onCancel, onConfirm }) {
  return (
    <div className="fade-in fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50" style={{ backdropFilter: 'blur(3px)' }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PALETTE.card, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }} className="pop-in w-full max-w-sm rounded-2xl p-5">
        <div style={{ background: '#B54A2B1A' }} className="w-11 h-11 rounded-full flex items-center justify-center mb-3.5">
          <Trash2 size={18} style={{ color: '#B54A2B' }} />
        </div>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-semibold mb-1.5">Supprimer ce chantier ?</h3>
        <p style={{ color: PALETTE.inkSoft }} className="text-sm mb-5">
          « {chantier.nom} » sera définitivement supprimé du planning.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} style={{ color: PALETTE.inkSoft }} className="px-4 py-2.5 text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} style={{ background: '#B54A2B' }} className="btn-lift px-4 py-2.5 text-sm font-medium text-white rounded-full">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ chantiers, onClose }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(chantiers, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // le presse-papiers peut être indisponible : la sélection manuelle reste possible
    }
  }

  return (
    <div className="fade-in fixed inset-0 bg-black/45 flex items-start sm:items-center justify-center p-4 py-8 z-50 overflow-y-auto" style={{ backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PALETTE.paper, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }}
        className="pop-in w-full max-w-lg rounded-2xl my-auto"
      >
        <div style={{ background: `linear-gradient(135deg, ${PALETTE.ink}, #2A2621)` }} className="flex items-center justify-between px-5 py-4 rounded-t-2xl">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-white font-semibold">
            Exporter les chantiers
          </h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p style={{ color: PALETTE.inkSoft }} className="text-sm">
            Copiez ce texte et gardez-le en lieu sûr (note, email…). Vous pourrez le recoller via "Importer" pour restaurer vos chantiers.
          </p>
          <textarea
            readOnly
            value={json}
            rows={10}
            onFocus={(e) => e.target.select()}
            style={{ borderColor: PALETTE.line, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
            className="border rounded-xl px-3.5 py-2.5 bg-white resize-none"
          />
        </div>
        <div style={{ borderColor: PALETTE.line, background: PALETTE.paper }} className="flex items-center justify-end gap-2 px-5 py-4 border-t rounded-b-2xl">
          <button type="button" onClick={onClose} style={{ color: PALETTE.inkSoft }} className="px-4 py-2.5 text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
            Fermer
          </button>
          <button
            type="button"
            onClick={copy}
            style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 20px -6px rgba(190,127,62,0.55)' }}
            className="btn-lift flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-full"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImport }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function handleImport() {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setError('Le texte collé ne correspond pas à une sauvegarde valide (liste attendue).');
        return;
      }
      setError('');
      onImport(parsed);
    } catch (e) {
      setError('Impossible de lire ce texte comme une sauvegarde JSON valide.');
    }
  }

  return (
    <div className="fade-in fixed inset-0 bg-black/45 flex items-start sm:items-center justify-center p-4 py-8 z-50 overflow-y-auto" style={{ backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PALETTE.paper, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }}
        className="pop-in w-full max-w-lg rounded-2xl my-auto"
      >
        <div style={{ background: `linear-gradient(135deg, ${PALETTE.ink}, #2A2621)` }} className="flex items-center justify-between px-5 py-4 rounded-t-2xl">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-white font-semibold">
            Importer une sauvegarde
          </h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p style={{ color: PALETTE.inkSoft }} className="text-sm">
            Collez ici le texte obtenu via "Exporter". Cela remplacera la liste actuelle affichée.
          </p>
          {error && (
            <div style={{ background: '#B54A2B14', color: '#B54A2B', borderColor: '#B54A2B33' }} className="border rounded-xl px-3.5 py-2.5 text-sm font-medium">
              {error}
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Collez le JSON exporté ici…"
            style={{ borderColor: PALETTE.line, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
            className="border rounded-xl px-3.5 py-2.5 bg-white resize-none"
          />
        </div>
        <div style={{ borderColor: PALETTE.line, background: PALETTE.paper }} className="flex items-center justify-end gap-2 px-5 py-4 border-t rounded-b-2xl">
          <button type="button" onClick={onClose} style={{ color: PALETTE.inkSoft }} className="px-4 py-2.5 text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!text.trim()}
            style={{ background: `linear-gradient(135deg, ${PALETTE.oak}, ${PALETTE.oakDeep})`, fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 20px -6px rgba(190,127,62,0.55)' }}
            className="btn-lift flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-full disabled:opacity-60"
          >
            <Upload size={14} />
            Restaurer
          </button>
        </div>
      </div>
    </div>
  );
}
