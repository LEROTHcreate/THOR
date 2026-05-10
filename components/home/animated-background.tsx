/**
 * Fond animé global pour la home THOR — version LIGHT (glass Apple).
 *
 * Architecture en couches :
 *   1. Base   : dégradé off-white → légèrement bleuté
 *   2. Mesh   : 5 blobs colorés qui MORPHENT (mix-blend-multiply pour fusion subtile)
 *   3. Aurora : faisceau lumineux diagonal toutes les 36s
 *   4. Scan   : fine ligne lumineuse multi-couleurs qui descend
 *   5. Particles: 10 points colorés qui montent du bas
 *   6. Grid   : grille de points subtile (touche futuriste)
 *   7. Grain  : texture bruit imperceptible (raffinement Apple)
 *   8. Veil   : voile blanc final pour garantir la lisibilité
 *
 * Tout est `position: fixed inset: 0` → reste visible pendant le scroll.
 */
export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* 1. Base — gradient off-white très subtil */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #fbfcff 0%, #f4f6fc 50%, #f8faff 100%)",
        }}
      />

      {/* 2. Mesh — blobs qui morphent (multiply pour fusion organique) */}
      <div className="absolute inset-0" style={{ mixBlendMode: "multiply" }}>
        <div
          className="absolute"
          style={{
            width: "55vw", height: "55vw", maxWidth: 850, maxHeight: 850,
            top: "-15%", left: "-12%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 65%)",
            filter: "blur(60px)",
            animation: "morphBlob1 28s ease-in-out infinite",
            willChange: "transform, border-radius",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "50vw", height: "50vw", maxWidth: 800, maxHeight: 800,
            top: "10%", right: "-15%",
            background:
              "radial-gradient(circle at 60% 40%, rgba(45,140,255,0.50) 0%, rgba(45,140,255,0) 65%)",
            filter: "blur(70px)",
            animation: "morphBlob2 34s ease-in-out infinite",
            animationDelay: "-6s",
            willChange: "transform, border-radius",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "48vw", height: "48vw", maxWidth: 750, maxHeight: 750,
            top: "45%", left: "25%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(0,201,138,0.40) 0%, rgba(0,201,138,0) 65%)",
            filter: "blur(70px)",
            animation: "morphBlob3 30s ease-in-out infinite",
            animationDelay: "-12s",
            willChange: "transform, border-radius",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "40vw", height: "40vw", maxWidth: 600, maxHeight: 600,
            bottom: "5%", right: "0%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(244,114,182,0.25) 0%, rgba(244,114,182,0) 65%)",
            filter: "blur(80px)",
            animation: "morphBlob1 38s ease-in-out infinite reverse",
            animationDelay: "-18s",
            willChange: "transform, border-radius",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "42vw", height: "42vw", maxWidth: 650, maxHeight: 650,
            bottom: "-5%", left: "5%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.30) 0%, rgba(34,211,238,0) 65%)",
            filter: "blur(70px)",
            animation: "morphBlob2 32s ease-in-out infinite reverse",
            animationDelay: "-22s",
            willChange: "transform, border-radius",
          }}
        />
      </div>

      {/* 3. Aurora sweep — faisceau diagonal */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute"
          style={{
            width: "200%", height: "60%",
            top: "20%", left: "-50%",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.5) 55%, transparent 100%)",
            filter: "blur(40px)",
            animation: "auroraSweep 36s ease-in-out infinite",
            willChange: "transform, opacity",
          }}
        />
      </div>

      {/* 4. Particules flottantes (plus subtiles sur fond clair) */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { left: "8%",  delay: 0,    size: 3, color: "99,102,241", duration: 18 },
          { left: "18%", delay: 4,    size: 4, color: "45,140,255", duration: 22 },
          { left: "27%", delay: 8,    size: 3, color: "0,201,138",  duration: 20 },
          { left: "38%", delay: 2,    size: 3, color: "99,102,241", duration: 24 },
          { left: "48%", delay: 12,   size: 4, color: "34,211,238", duration: 19 },
          { left: "58%", delay: 6,    size: 3, color: "45,140,255", duration: 21 },
          { left: "68%", delay: 10,   size: 3, color: "0,201,138",  duration: 23 },
          { left: "78%", delay: 1,    size: 4, color: "99,102,241", duration: 20 },
          { left: "88%", delay: 14,   size: 3, color: "244,114,182",duration: 26 },
          { left: "94%", delay: 7,    size: 3, color: "45,140,255", duration: 22 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.left,
              bottom: "-10px",
              width: p.size,
              height: p.size,
              background: `rgba(${p.color},0.65)`,
              boxShadow: `0 0 8px rgba(${p.color},0.55)`,
              animation: `floatParticle ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* 6. Dot grid — touche futuriste subtile */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,23,42,0.14) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at center, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at center, black 0%, transparent 75%)",
        }}
      />

      {/* 7. Grain — bruit subtil pour raffinement Apple */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "250px 250px",
        }}
      />

      {/* 8. Voile blanc final — lisibilité contenu */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(255,255,255,0.30)" }}
      />
    </div>
  );
}
