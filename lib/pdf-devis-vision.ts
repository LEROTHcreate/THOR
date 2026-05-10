/**
 * Générateur de devis normalisé optique-lunetterie
 *
 * Références légales :
 *  - Arrêté du 4 juin 2014 (JO 6 juin 2014) relatif aux prix des DM d'optique
 *    et au modèle de devis normalisé
 *  - Décret n° 2014-1374 du 18 novembre 2014 sur le modèle de devis type
 *  - Arrêté du 29 octobre 2014 relatif au modèle normalisé de devis en optique
 *  - Article L.5211-4 du Code de la santé publique (DM)
 *  - Loi Hamon (2014-344) article 16 : délai de rétractation 14 jours
 *  - Arrêté du 11 mars 2022 relatif aux équipements 100% Santé optique
 *
 * Ce générateur produit un document HTML autonome conforme au modèle réglementaire.
 * Il est ouvert dans une nouvelle fenêtre navigateur puis imprimé / sauvegardé en PDF.
 */

import type { StoreConfig } from "./storeConfig";

/* ── Types réexportés depuis la page (dupliqués pour éviter l'import circulaire) */
export interface OrdonnancePdf {
  prescripteurNom: string;
  prescripteurRPPS: string;
  dateOrdonnance: string;
  odSph: string; odCyl: string; odAxe: string; odAdd: string;
  ogSph: string; ogCyl: string; ogAxe: string; ogAdd: string;
}

export interface DevisLignePdf {
  id: string;
  type: string;
  designation: string;
  description?: string;
  lppr: string;
  classe: 1 | 2 | undefined;
  marque: string;
  reference: string;
  prixPublicHT: number;
  prixVenteTTC: number;
  tauxTVA: number;
  priseEnChargeSS: number;
  priseEnChargeMutuelle: number;
  resteACharge: number;
}

export interface DevisPdf {
  id: string;
  type: string;
  patientNom: string;
  patientPrenom: string;
  patientDN: string;
  patientSS: string;
  patientTel: string;
  patientEmail: string;
  mutuelleNom: string;
  mutuelleTaux: number;
  ordonnance: OrdonnancePdf;
  lignes: DevisLignePdf[];
  totalTTC: number;
  totalSS: number;
  totalMutuelle: number;
  resteACharge: number;
  date: string;
  dateValidite: string;
  status: string;
  signatureClient: boolean;
  dateSignature?: string;
  factureId: string;
  dateFacture: string;
  modePaiement: string;
  notes: string;
  nbEcheances?: number;
  raisonGeste?: string;
  racRegle?: boolean;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function eur(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

function dateStr(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function sph(v: string): string {
  return v || "pl.";
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    monture: "Monture",
    "verre-od": "Verre OD",
    "verre-og": "Verre OG",
    lentille: "Lentille de contact",
    accessoire: "Accessoire",
  };
  return map[type] ?? type;
}

/* ── Générateur principal ────────────────────────────────────────────────── */
export function generateDevisVisionHtml(devis: DevisPdf, config: StoreConfig): string {
  const cabinet = {
    nom: config.nom || "Clair Vision",
    adresse: config.adresse || "",
    cp: config.codePostal || "",
    ville: config.ville || "",
    tel: config.telephone || "",
    email: config.email || "",
    siret: config.siret || "",
    adeli: config.adeli || "",
    rpps: config.rpps || "",
  };

  const hasClasse1 = devis.lignes.some((l) => l.classe === 1);
  const isFacture = !!devis.factureId;
  const docTitle = isFacture ? `FACTURE N° ${devis.factureId}` : `DEVIS N° ${devis.id}`;
  const accentColor = config.accentColor || "#2D8CFF";

  const lignesHtml = devis.lignes
    .map((l, i) => {
      const classeLabel =
        l.classe === 1
          ? '<span style="color:#059669;font-weight:700">Cl. A</span>'
          : l.classe === 2
          ? '<span style="color:#f59e0b;font-weight:700">Cl. B</span>'
          : "—";
      const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      return `
        <tr style="background:${bg}">
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;">
            <div style="font-weight:600;color:#1e293b">${typeLabel(l.type)}</div>
            <div style="color:#475569;margin-top:2px">${l.marque ? `<b>${l.marque}</b> ` : ""}${l.reference || l.designation}</div>
            ${l.description ? `<div style="color:#94a3b8;font-size:10px;margin-top:1px;font-style:italic">${l.description}</div>` : ""}
          </td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:center;font-family:monospace">${l.lppr || "—"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:center">${classeLabel}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;color:#475569">${eur(l.prixPublicHT)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right">${l.tauxTVA}%</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;font-weight:700;color:#1e293b">${eur(l.prixVenteTTC)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;color:#1d4ed8">${l.priseEnChargeSS > 0 ? `−${eur(l.priseEnChargeSS)}` : "—"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;color:#059669">${l.priseEnChargeMutuelle > 0 ? `−${eur(l.priseEnChargeMutuelle)}` : "—"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;font-weight:700;color:${l.resteACharge === 0 ? "#059669" : "#1e293b"}">${l.resteACharge === 0 ? "0,00 €&nbsp;✓" : eur(l.resteACharge)}</td>
        </tr>`;
    })
    .join("");

  const classe1Mention = hasClasse1
    ? `<div style="margin-top:10px;padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:10px;color:#166534;line-height:1.6">
        <strong>Équipements Classe A — 100% Santé :</strong> Ces équipements bénéficient d'un reste à charge nul pour les assurés disposant d'un contrat de complémentaire santé responsable,
        conformément à l'arrêté du 11 mars 2022 et à la réforme 100% Santé (loi de financement de la Sécurité sociale 2019).
      </div>`
    : "";

  const factureBlock = isFacture
    ? `<div style="margin-top:8px;padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:11px;color:#166534;line-height:1.7">
        <strong>Facture N° ${devis.factureId}</strong><br/>
        Date de facturation : ${dateStr(devis.dateFacture)}<br/>
        Mode de règlement : ${devis.modePaiement || "—"}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${docTitle} — ${cabinet.nom}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      padding: 28px 36px;
      max-width: 900px;
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
      padding: 8px 10px;
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
    .box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
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
    .print-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>

  <button class="no-print print-btn" onclick="window.print()">
    Imprimer / Enregistrer en PDF
  </button>

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
        ${cabinet.adeli ? `N° ADELI : ${cabinet.adeli}<br/>` : ""}
        ${cabinet.rpps ? `N° RPPS : ${cabinet.rpps}` : ""}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:900;color:#1e293b">${docTitle}</div>
      <div style="font-size:11px;color:#475569;margin-top:6px;line-height:1.9">
        Date d'émission : <strong>${dateStr(devis.date)}</strong><br/>
        Valable jusqu'au : <strong>${dateStr(devis.dateValidite)}</strong><br/>
        ${isFacture ? `Date facturation : <strong>${dateStr(devis.dateFacture)}</strong><br/>` : ""}
        Statut : <strong>${devis.status}</strong>
      </div>
    </div>
  </div>

  <!-- ═══ PATIENT + ORDONNANCE ══════════════════════════════════════════════ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">

    <!-- Bloc patient -->
    <div class="box">
      <div class="section-title">Patient / Assuré</div>
      <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px">
        ${devis.patientPrenom} ${devis.patientNom.toUpperCase()}
      </div>
      <div style="font-size:11px;color:#475569;line-height:1.9">
        ${devis.patientDN ? `Né(e) le : ${dateStr(devis.patientDN)}<br/>` : ""}
        N° Sécurité sociale : ${devis.patientSS || "—"}<br/>
        Téléphone : ${devis.patientTel || "—"}<br/>
        ${devis.patientEmail ? `Email : ${devis.patientEmail}<br/>` : ""}
        Organisme complémentaire : ${devis.mutuelleNom || "—"}<br/>
        Taux de remboursement mutuelle : ${devis.mutuelleTaux}%
      </div>
    </div>

    <!-- Bloc ordonnance -->
    <div class="box">
      <div class="section-title" style="color:#8B5CF6">Ordonnance médicale</div>
      <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:2px">
        ${devis.ordonnance.prescripteurNom || "—"}
      </div>
      ${devis.ordonnance.prescripteurRPPS ? `<div style="font-size:10px;color:#64748b;margin-bottom:4px">N° RPPS : ${devis.ordonnance.prescripteurRPPS}</div>` : ""}
      <div style="font-size:10px;color:#64748b;margin-bottom:8px">
        Date de prescription : ${dateStr(devis.ordonnance.dateOrdonnance)}
      </div>
      <table style="border-collapse:collapse;font-size:11px;width:100%">
        <thead>
          <tr>
            <th style="background:#f1f5f9;padding:5px 8px;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.3px;text-align:left"></th>
            ${["Sphère","Cylindre","Axe","Addition"].map(h => `<th style="background:#f1f5f9;padding:5px 8px;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.3px;text-align:center">${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:5px 8px;font-weight:700;color:#2D8CFF;border-bottom:1px solid #f1f5f9">OD</td>
            ${[sph(devis.ordonnance.odSph), devis.ordonnance.odCyl||"—", devis.ordonnance.odAxe||"—", devis.ordonnance.odAdd||"—"].map(v=>`<td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9">${v}</td>`).join("")}
          </tr>
          <tr>
            <td style="padding:5px 8px;font-weight:700;color:#8B5CF6">OG</td>
            ${[sph(devis.ordonnance.ogSph), devis.ordonnance.ogCyl||"—", devis.ordonnance.ogAxe||"—", devis.ordonnance.ogAdd||"—"].map(v=>`<td style="padding:5px 8px;text-align:center">${v}</td>`).join("")}
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══ TABLEAU DES ÉQUIPEMENTS ════════════════════════════════════════════ -->
  <div style="margin-bottom:18px">
    <div class="section-title">Détail de l'équipement — Devis normalisé (Arrêté du 4 juin 2014)</div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <table>
        <thead>
          <tr>
            <th style="text-align:left;min-width:200px">Désignation de l'article</th>
            <th style="text-align:center">Code LPP</th>
            <th style="text-align:center">Classe</th>
            <th style="text-align:right">Prix public HT</th>
            <th style="text-align:right">TVA</th>
            <th style="text-align:right">Prix vente TTC</th>
            <th style="text-align:right">PC&nbsp;Sécu</th>
            <th style="text-align:right">PC&nbsp;Mutuelle</th>
            <th style="text-align:right">RAC patient</th>
          </tr>
        </thead>
        <tbody>${lignesHtml}</tbody>
      </table>
    </div>
    ${classe1Mention}
  </div>

  <!-- ═══ RÉCAPITULATIF FINANCIER ════════════════════════════════════════════ -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
    <div style="min-width:320px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
      <div style="display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #e2e8f0">
        <span style="font-size:12px;color:#475569">Total TTC</span>
        <span style="font-size:12px;font-weight:700;color:#1e293b">${eur(devis.totalTTC)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #e2e8f0">
        <span style="font-size:12px;color:#475569">Prise en charge Sécurité sociale</span>
        <span style="font-size:12px;font-weight:700;color:#1d4ed8">−${eur(devis.totalSS)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:9px 14px;border-bottom:2px solid ${accentColor}">
        <span style="font-size:12px;color:#475569">Prise en charge ${devis.mutuelleNom || "mutuelle"}</span>
        <span style="font-size:12px;font-weight:700;color:#059669">−${eur(devis.totalMutuelle)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:${accentColor}12">
        <span style="font-size:14px;font-weight:700;color:#1e293b">Reste à charge patient</span>
        <span style="font-size:22px;font-weight:900;color:${accentColor}">${eur(devis.resteACharge)}</span>
      </div>
    </div>
  </div>

  ${factureBlock}

  <!-- ═══ RÈGLEMENT DU RESTE À CHARGE ══════════════════════════════════════ -->
  ${(() => {
    if (!devis.racRegle || !devis.modePaiement) return "";
    const isGeste = devis.modePaiement === "Geste commercial";
    const isPlusieurs = devis.modePaiement === "Plusieurs fois";
    const montantEch = isPlusieurs && (devis.nbEcheances ?? 0) > 0
      ? Math.ceil(devis.resteACharge / (devis.nbEcheances ?? 1) * 100) / 100
      : 0;
    return `
  <div style="margin-bottom:18px;padding:14px 16px;border-radius:10px;border:2px solid ${isGeste ? "#f59e0b" : "#10b981"};background:${isGeste ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)"}">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${isGeste ? "#b45309" : "#065F46"};margin-bottom:8px">
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
        <div style="font-weight:700;color:#1e293b">${devis.modePaiement}</div>
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
      <strong style="color:#475569">Mentions légales obligatoires :</strong><br/>
      Ce devis est établi conformément au modèle normalisé prévu par le <strong>décret n° 2014-1374 du 18 novembre 2014</strong> et
      l'<strong>arrêté du 4 juin 2014</strong> relatifs aux prix des dispositifs médicaux d'optique-lunetterie (JO du 6 juin 2014).<br/>
      Ce devis est valable <strong>30 jours</strong> à compter de la date d'émission. Toute commande passée avant l'expiration de ce délai
      engage le patient et constitue un bon de commande ferme.<br/>
      <strong>Droit de rétractation :</strong> Conformément à la loi Hamon (loi n° 2014-344 du 17 mars 2014, article 16), le patient
      bénéficie d'un délai de <strong>14 jours calendaires</strong> à compter de la date de signature pour exercer son droit de rétractation,
      sauf si l'équipement a été entamé à sa demande expresse (adaptation de lentilles, verres taillés à sa mesure).<br/>
      Les prix indiqués incluent la TVA au taux applicable (5,5 % pour les verres correcteurs et lentilles ; 20 % pour les montures de ville
      sauf Classe A). Prise en charge Sécurité sociale selon barème LPPR en vigueur.
      La prise en charge mutuelle est donnée à titre indicatif et peut varier selon les garanties du contrat.<br/>
      ${config.mentionsDevis ? config.mentionsDevis : ""}
    </div>
  </div>

  <!-- ═══ SIGNATURE ══════════════════════════════════════════════════════════ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:10px">
    <div class="box" style="min-height:90px">
      <div style="font-size:10px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">
        Signature et cachet du professionnel
      </div>
      ${config.signataire
        ? `<div style="font-size:11px;font-weight:600;color:#1e293b;margin-bottom:3px">${config.signataire}</div>`
        : `<div style="font-size:11px;color:#94a3b8;font-style:italic">${cabinet.nom} — ${cabinet.adeli ? `ADELI ${cabinet.adeli}` : ""}</div>`}
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
    <div class="box" style="min-height:80px">
      <div style="font-size:10px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">
        Bon pour accord — Signature du patient
      </div>
      ${devis.signatureClient
        ? `<div style="font-size:12px;font-weight:700;color:#059669">✓ Approuvé le ${devis.dateSignature ? dateStr(devis.dateSignature) : dateStr(devis.date)}</div>`
        : `<div style="font-size:10px;color:#94a3b8;font-style:italic">
            Lu et approuvé<br/>
            Date : ____/____/________<br/>
            Signature :
          </div>`
      }
    </div>
  </div>

  <div style="font-size:9px;color:#cbd5e1;text-align:center;margin-top:8px">
    Document généré par THOR • Clair Vision — Logiciel certifié HDS • ${new Date().toLocaleDateString("fr-FR")}
  </div>

</body>
</html>`;
}

/**
 * Ouvre le devis dans une nouvelle fenêtre et déclenche l'impression.
 */
export function printDevisVision(devis: DevisPdf, config: StoreConfig): void {
  const html = generateDevisVisionHtml(devis, config);
  const win = window.open("", "_blank", "width=960,height=800");
  if (!win) {
    alert("Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les popups ne sont pas bloquées.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
