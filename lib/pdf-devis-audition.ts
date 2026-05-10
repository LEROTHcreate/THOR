/**
 * Générateur de devis normalisé audioprothèse
 *
 * Références légales :
 *  - Arrêté du 14 novembre 2018 (JO 21 novembre 2018) relatif aux modalités
 *    d'application du reste à charge zéro dans le secteur de l'audiologie
 *  - Décret n° 2018-1076 du 3 décembre 2018 relatif aux DMDIV
 *  - Articles L.165-1 et R.165-1 du Code de la Sécurité sociale (LPPR)
 *  - Arrêté du 25 septembre 2020 modifiant la LPPR (plafonds 2021)
 *  - Circulaire DSS/SD2B/2019/160 : mise en œuvre du 100% Santé audiologie
 *  - Code de la santé publique Art. L.4361-1 (exercice de l'audioprothésie)
 *
 * Modèle de devis conforme à l'Annexe I de l'arrêté du 14 novembre 2018.
 *
 * Classe I  — Équipements 100% Santé : prix limite de vente fixé par arrêté,
 *             reste à charge nul pour les assurés avec contrat responsable.
 * Classe II — Équipements à prix libre, remboursement SS plafonné.
 */

import type { StoreConfig } from "./storeConfig";

/* ── Types ─────────────────────────────────────────────────────────────── */
export interface DevisLigneAuditionPdf {
  id: string;
  type: string;          // "appareil-droit" | "appareil-gauche" | "accessoire" | "pile" | "entretien"
  designation: string;
  marque: string;
  modele: string;
  codeLPP?: string;      // optionnel si non renseigné dans le dossier
  classe: 1 | 2;
  quantite: number;
  prixUnitaireTTC: number;
  prixTotalTTC: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
  resteACharge: number;
}

export interface DevisAuditionPdf {
  id: string;
  numero: string;
  patientNom: string;
  patientPrenom: string;
  patientSS?: string;         // N° sécurité sociale (si renseigné)
  patientDateNaissance?: string;
  patientTel: string;
  mutuelleNom: string;
  ordonnanceRef?: string;     // Nom de l'ORL prescripteur
  ordonnanceDate?: string;    // Date de l'ordonnance ORL
  lignes: DevisLigneAuditionPdf[];
  totalTTC: number;
  totalSS: number;
  totalMutuelle: number;
  resteACharge: number;
  date: string;
  dateValidite: string;
  status: string;
  notes?: string;
  modeReglementRAC?: string;
  nbEcheances?: number;
  raisonGeste?: string;
  racRegle?: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function eur(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

function dateStr(iso: string | undefined): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    "appareil-droit": "Appareil auditif — oreille droite",
    "appareil-gauche": "Appareil auditif — oreille gauche",
    accessoire: "Accessoire",
    pile: "Piles",
    entretien: "Entretien / maintenance",
  };
  return map[type] ?? type;
}

/** Prix limite de vente Classe I (arrêté 2020 / LPPR 2021) */
const PLV_CLASSE_1_UNITAIRE = 1400; // € TTC par oreille (au-delà → Classe II obligatoire)

/* ── Générateur principal ────────────────────────────────────────────────── */
export function generateDevisAuditionHtml(devis: DevisAuditionPdf, config: StoreConfig): string {
  const cabinet = {
    nom: config.nom || "Clair Audition",
    adresse: config.adresse || "",
    cp: config.codePostal || "",
    ville: config.ville || "",
    tel: config.telephone || "",
    email: config.email || "",
    siret: config.siret || "",
    adeli: config.adeli || "",
    rpps: config.rpps || "",
  };

  const accentColor = "#00C98A";
  const hasClasse1 = devis.lignes.some((l) => l.classe === 1);
  const nbAppareils = devis.lignes.filter((l) =>
    l.type === "appareil-droit" || l.type === "appareil-gauche"
  ).length;
  const isBinaural = nbAppareils >= 2;

  const lignesHtml = devis.lignes
    .map((l, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      const classeLabel =
        l.classe === 1
          ? `<span style="color:#059669;font-weight:700;font-size:10px">Cl.&nbsp;I<br/><span style="font-weight:400;color:#94a3b8">100%&nbsp;Santé</span></span>`
          : `<span style="color:#f59e0b;font-weight:700;font-size:10px">Cl.&nbsp;II<br/><span style="font-weight:400;color:#94a3b8">Prix libre</span></span>`;

      const isAppareil = l.type === "appareil-droit" || l.type === "appareil-gauche";

      return `
        <tr style="background:${bg}">
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px">
            <div style="font-weight:700;color:#1e293b">${typeLabel(l.type)}</div>
            <div style="color:#475569;margin-top:2px">${l.marque ? `<strong>${l.marque}</strong> ` : ""}${l.modele || l.designation}</div>
            ${isAppareil && l.classe === 1 ? `<div style="color:#059669;font-size:9.5px;margin-top:2px">Prix limite de vente : ${eur(PLV_CLASSE_1_UNITAIRE)} / oreille</div>` : ""}
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:center;font-family:monospace">${l.codeLPP || "—"}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:center">${classeLabel}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:center">${l.quantite}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;font-weight:700;color:#1e293b">${eur(l.prixUnitaireTTC)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;font-weight:700">${eur(l.prixTotalTTC)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;color:#1d4ed8">${l.priseEnChargeSS > 0 ? `−${eur(l.priseEnChargeSS)}` : "—"}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;color:#059669">${l.priseEnChargeMutuelle > 0 ? `−${eur(l.priseEnChargeMutuelle)}` : "—"}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;font-weight:700;color:${l.resteACharge === 0 ? "#059669" : "#1e293b"}">${l.resteACharge === 0 ? "0,00 €&nbsp;✓" : eur(l.resteACharge)}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>DEVIS N° ${devis.numero} — ${cabinet.nom}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      padding: 28px 36px;
      max-width: 940px;
      margin: 0 auto;
    }
    @page {
      size: A4 portrait;
      margin: 16mm 14mm 20mm;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
    table { border-collapse: collapse; width: 100%; }
    th {
      background: #f1f5f9;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #475569;
      padding: 7px 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${accentColor};
      margin-bottom: 6px;
    }
    .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: 10px;
      border: none;
      background: ${accentColor};
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 18px;
    }
  </style>
</head>
<body>

  <button class="no-print print-btn" onclick="window.print()">
    Imprimer / Enregistrer en PDF
  </button>

  <!-- ═══ BANDEAU RÉGLEMENTAIRE ══════════════════════════════════════════════ -->
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:8px 14px;margin-bottom:16px;font-size:9.5px;color:#166534;line-height:1.6">
    <strong>DEVIS NORMALISÉ — AUDIOPROTHÈSE</strong><br/>
    Établi conformément à l'<strong>arrêté du 14 novembre 2018</strong> relatif aux modalités d'application du reste à charge zéro dans le secteur de l'audiologie
    (publié au JO du 21 novembre 2018) et aux articles <strong>L.165-1 et R.165-1 du Code de la Sécurité sociale</strong> (LPPR).<br/>
    TVA applicable : 5,5 % (taux réduit, article 278 quater du CGI — appareils électroniques correcteurs de surdité).
  </div>

  <!-- ═══ EN-TÊTE ═══════════════════════════════════════════════════════════ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid ${accentColor};margin-bottom:20px">
    <div>
      <div style="font-size:22px;font-weight:900;color:${accentColor};letter-spacing:-0.5px">${cabinet.nom.toUpperCase()}</div>
      <div style="font-size:11px;color:#475569;margin-top:5px;line-height:1.8">
        ${cabinet.adresse ? `${cabinet.adresse}<br/>` : ""}
        ${cabinet.cp || cabinet.ville ? `${cabinet.cp} ${cabinet.ville}<br/>` : ""}
        ${cabinet.tel ? `Tél : ${cabinet.tel}<br/>` : ""}
        ${cabinet.email ? `Email : ${cabinet.email}<br/>` : ""}
        ${cabinet.siret ? `SIRET : ${cabinet.siret}<br/>` : ""}
        ${cabinet.adeli ? `N° ADELI audioprothésiste : ${cabinet.adeli}` : ""}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:900;color:#1e293b">DEVIS N° ${devis.numero}</div>
      <div style="font-size:11px;color:#475569;margin-top:6px;line-height:1.9">
        Date d'émission : <strong>${dateStr(devis.date)}</strong><br/>
        Valable 30 jours jusqu'au : <strong>${dateStr(devis.dateValidite)}</strong><br/>
        Appareillage : <strong>${isBinaural ? "Binaural" : "Monaural"}</strong><br/>
        Statut : <strong>${devis.status}</strong>
      </div>
    </div>
  </div>

  <!-- ═══ PATIENT + PRESCRIPTEUR ════════════════════════════════════════════ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">

    <div class="box">
      <div class="section-title">Patient / Assuré</div>
      <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px">
        ${devis.patientPrenom} ${devis.patientNom.toUpperCase()}
      </div>
      <div style="font-size:11px;color:#475569;line-height:1.9">
        ${devis.patientDateNaissance ? `Date de naissance : ${dateStr(devis.patientDateNaissance)}<br/>` : ""}
        N° Sécurité sociale : ${devis.patientSS || "—"}<br/>
        Téléphone : ${devis.patientTel || "—"}<br/>
        Organisme complémentaire : ${devis.mutuelleNom || "—"}
      </div>
    </div>

    <div class="box">
      <div class="section-title" style="color:#475569">Prescripteur ORL</div>
      <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px">
        ${devis.ordonnanceRef || "— À compléter —"}
      </div>
      <div style="font-size:11px;color:#475569;line-height:1.9">
        Date de l'ordonnance ORL : ${dateStr(devis.ordonnanceDate)}<br/>
        <span style="font-size:9.5px;color:#94a3b8;font-style:italic">
          Conformément à l'art. L.4361-5 CSP, une ordonnance médicale est requise pour<br/>
          tout appareillage auditif remboursé par l'Assurance Maladie.
        </span>
      </div>
    </div>
  </div>

  <!-- ═══ TABLEAU DES ÉQUIPEMENTS ════════════════════════════════════════════ -->
  <div style="margin-bottom:18px">
    <div class="section-title">Détail de l'appareillage — Devis normalisé (Arrêté 14 nov. 2018)</div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <table>
        <thead>
          <tr>
            <th style="text-align:left;min-width:190px">Désignation</th>
            <th style="text-align:center">Code LPP</th>
            <th style="text-align:center">Classe</th>
            <th style="text-align:center">Qté</th>
            <th style="text-align:right">Prix unit. TTC</th>
            <th style="text-align:right">Total TTC</th>
            <th style="text-align:right">PC&nbsp;SS (AMO)</th>
            <th style="text-align:right">PC&nbsp;Mutuelle</th>
            <th style="text-align:right">RAC patient</th>
          </tr>
        </thead>
        <tbody>${lignesHtml}</tbody>
      </table>
    </div>

    ${hasClasse1 ? `
    <div style="margin-top:10px;padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:10px;color:#166534;line-height:1.6">
      <strong>Équipements Classe I — 100% Santé :</strong> Prix de vente limité par arrêté (${eur(PLV_CLASSE_1_UNITAIRE)} TTC / oreille maximum).
      Reste à charge nul garanti pour les patients disposant d'un contrat de complémentaire santé responsable.
      Prise en charge AMO : jusqu'à <strong>1 700,00 €</strong> pour un appareillage binaural (850 € / oreille).
    </div>` : ""}
  </div>

  <!-- ═══ RÉCAPITULATIF FINANCIER ════════════════════════════════════════════ -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
    <div style="min-width:340px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
      <div style="display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #e2e8f0">
        <span style="font-size:12px;color:#475569">Total TTC (TVA 5,5%)</span>
        <span style="font-size:12px;font-weight:700;color:#1e293b">${eur(devis.totalTTC)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #e2e8f0">
        <span style="font-size:12px;color:#475569">Prise en charge Assurance Maladie (AMO)</span>
        <span style="font-size:12px;font-weight:700;color:#1d4ed8">−${eur(devis.totalSS)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:9px 14px;border-bottom:2px solid ${accentColor}">
        <span style="font-size:12px;color:#475569">Prise en charge complémentaire (AMC) — ${devis.mutuelleNom || "mutuelle"}</span>
        <span style="font-size:12px;font-weight:700;color:#059669">−${eur(devis.totalMutuelle)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:${accentColor}12">
        <span style="font-size:14px;font-weight:700;color:#1e293b">Reste à charge patient</span>
        <span style="font-size:22px;font-weight:900;color:${accentColor}">${eur(devis.resteACharge)}</span>
      </div>
    </div>
  </div>

  <!-- ═══ RÈGLEMENT DU RESTE À CHARGE ══════════════════════════════════════ -->
  ${(() => {
    const mode = devis.modeReglementRAC;
    if (!devis.racRegle || !mode) return "";
    const isGeste = mode === "Geste commercial";
    const isPlusieurs = mode === "Plusieurs fois";
    const montantEch = isPlusieurs && (devis.nbEcheances ?? 0) > 0
      ? Math.ceil(devis.resteACharge / (devis.nbEcheances ?? 1) * 100) / 100
      : 0;
    return `
  <div style="margin-bottom:18px;padding:14px 16px;border-radius:10px;border:2px solid ${isGeste ? "#f59e0b" : accentColor};background:${isGeste ? "rgba(245,158,11,0.06)" : accentColor + "0C"}">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${isGeste ? "#b45309" : "#047857"};margin-bottom:8px">
      ${isGeste ? "Geste commercial — Reste à charge offert" : "✓ Reste à charge réglé"}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:11px">
      <div>
        <div style="color:#94a3b8;font-size:10px">Montant RAC</div>
        <div style="font-weight:700;color:#1e293b;text-decoration:${isGeste ? "line-through" : "none"}">${eur(devis.resteACharge)}</div>
        ${isGeste ? `<div style="font-weight:700;color:#f59e0b">→ 0,00 €</div>` : ""}
      </div>
      <div>
        <div style="color:#94a3b8;font-size:10px">Mode de règlement</div>
        <div style="font-weight:700;color:#1e293b">${mode}</div>
      </div>
      ${isPlusieurs ? `<div>
        <div style="color:#94a3b8;font-size:10px">Échéancier</div>
        <div style="font-weight:700;color:#1e293b">${devis.nbEcheances} × ${eur(montantEch)}</div>
      </div>` : ""}
      ${isGeste && devis.raisonGeste ? `<div>
        <div style="color:#94a3b8;font-size:10px">Motif</div>
        <div style="color:#b45309">${devis.raisonGeste}</div>
      </div>` : ""}
    </div>
  </div>`;
  })()}

  <!-- ═══ MENTIONS LÉGALES ══════════════════════════════════════════════════ -->
  <div style="border-top:1px solid #e2e8f0;padding-top:14px;margin-bottom:18px">
    <div style="font-size:9px;color:#94a3b8;line-height:1.8">
      <strong style="color:#475569">Mentions légales obligatoires (arrêté du 14 novembre 2018) :</strong><br/>
      1. Ce devis est établi conformément au modèle réglementaire prévu par l'<strong>arrêté du 14 novembre 2018</strong>
         relatif aux modalités d'application du reste à charge zéro dans le secteur de l'audiologie (JO du 21 novembre 2018).<br/>
      2. Ce devis est valable <strong>30 jours</strong> à compter de sa date d'émission. Sa signature par le patient vaut
         bon de commande et acceptation du prix.<br/>
      3. <strong>Droit à comparaison :</strong> Vous pouvez demander un devis auprès de n'importe quel autre audioprothésiste.
         Ce devis vous est remis gratuitement et sans engagement de votre part.<br/>
      4. Les appareils de <strong>Classe I</strong> bénéficient d'un prix de vente limité par l'arrêté du 14 novembre 2018
         (Prix Limite de Vente — PLV). Le reste à charge est nul pour tout assuré bénéficiant d'un contrat de complémentaire
         santé responsable (CSS art. L.871-1).<br/>
      5. Les appareils de <strong>Classe II</strong> sont à prix libres. Le remboursement de l'Assurance Maladie est plafonné
         selon le barème LPPR en vigueur. La prise en charge mutuelle est donnée à titre indicatif.<br/>
      6. TVA à 5,5 % applicable aux appareils électroniques correcteurs de surdité (art. 278 quater du CGI).<br/>
      7. N° ADELI de l'audioprothésiste responsable : ${cabinet.adeli || "— à compléter —"}.<br/>
      8. Les devis et factures sont conservés pendant 10 ans conformément aux obligations légales.<br/>
      ${devis.notes ? `9. Notes : ${devis.notes}<br/>` : ""}
    </div>
  </div>

  <!-- ═══ SIGNATURE ══════════════════════════════════════════════════════════ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:10px">
    <div class="box" style="min-height:90px">
      <div style="font-size:10px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">
        Signature et cachet de l'audioprothésiste
      </div>
      ${config.signataire
        ? `<div style="font-size:11px;font-weight:600;color:#1e293b;margin-bottom:3px">${config.signataire}</div>`
        : `<div style="font-size:11px;color:#94a3b8;font-style:italic;line-height:1.7">${cabinet.nom}<br/>${cabinet.adeli ? `N° ADELI : ${cabinet.adeli}` : ""}</div>`}
      ${config.signataireRPPS ? `<div style="font-size:10px;color:#64748b;margin-bottom:4px">N° RPPS : ${config.signataireRPPS}</div>` : ""}
      <div style="display:flex;gap:12px;align-items:flex-end;margin-top:6px">
        ${config.signatureBase64
          ? `<img src="${config.signatureBase64}" alt="Signature" style="max-height:50px;max-width:120px;object-fit:contain"/>`
          : `<div style="width:120px;height:48px;border-bottom:1px solid #e2e8f0"></div>`}
        ${config.cachetBase64
          ? `<img src="${config.cachetBase64}" alt="Cachet" style="max-height:56px;max-width:72px;object-fit:contain"/>`
          : ""}
      </div>
    </div>
    <div class="box" style="min-height:90px">
      <div style="font-size:10px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">
        Bon pour accord — Signature du patient
      </div>
      <div style="font-size:10px;color:#94a3b8;font-style:italic;line-height:1.9">
        Lu et approuvé — ce devis vaut bon de commande<br/>
        Date : ____/____/________<br/>
        Signature :
      </div>
    </div>
  </div>

  <div style="font-size:9px;color:#cbd5e1;text-align:center;margin-top:8px">
    Document généré par THOR • Clair Audition — Logiciel certifié HDS • ${new Date().toLocaleDateString("fr-FR")}
  </div>

</body>
</html>`;
}

/**
 * Ouvre le devis dans une nouvelle fenêtre et déclenche l'impression.
 */
export function printDevisAudition(devis: DevisAuditionPdf, config: StoreConfig): void {
  const html = generateDevisAuditionHtml(devis, config);
  const win = window.open("", "_blank", "width=960,height=800");
  if (!win) {
    alert("Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les popups ne sont pas bloquées.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
