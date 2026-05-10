type Review = {
  quote: string;
  author: string;
  tag: "Optique" | "Audio";
  rating: number;
};

const reviews: Review[] = [
  { quote: "Un accueil exceptionnel et des conseils vraiment personnalisés. Je recommande vivement !", author: "Marie D.", tag: "Optique", rating: 5 },
  { quote: "Enfin un centre qui prend le temps d'expliquer. Mes nouveaux appareils auditifs changent ma vie.", author: "Jean-Pierre L.", tag: "Audio", rating: 5 },
  { quote: "Équipe professionnelle et à l'écoute. Le suivi après l'achat est impeccable.", author: "Sophie M.", tag: "Optique", rating: 5 },
  { quote: "Très bon bilan auditif, explications claires et matériel top. Je me sens rassuré.", author: "Karim A.", tag: "Audio", rating: 5 },
  { quote: "Montures super bien sélectionnées, ajustage parfait. Service premium.", author: "Camille R.", tag: "Optique", rating: 5 },
  { quote: "Prise en charge rapide, conseils précis. On sent l'expertise.", author: "Nicolas B.", tag: "Optique", rating: 5 },
  { quote: "Suivi auditif régulier et sérieux. On ne vous lâche pas après la première visite.", author: "Laura G.", tag: "Audio", rating: 5 },
  { quote: "Je suis venu pour des lentilles : pédagogie + confort au quotidien, nickel.", author: "Thomas P.", tag: "Optique", rating: 5 },
];

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

export function Avis() {
  const track = [...reviews, ...reviews];

  return (
    <section className="py-16 bg-[#f8fafc]">
      <div className="mx-auto max-w-[1240px] px-6 text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500">
          Témoignages patients
        </span>
        <h2 className="mt-3 text-2xl md:text-3xl font-light tracking-tight text-slate-800 h-title">
          Ils nous font <span className="font-semibold">confiance</span>
        </h2>

        {/* Rating summary */}
        <div className="mt-5 flex items-center justify-center gap-5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="text-3xl font-bold text-slate-900 h-title">4,9</div>
            <div className="text-left">
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">2 000+ avis vérifiés</div>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2D8CFF]" />
              <span>Clair Vision · 4,9/5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00C98A]" />
              <span>Clair Audition · 4,8/5</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="relative"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="flex w-max gap-5 px-6 animate-thor-marquee">
            {track.map((r, idx) => {
              const isAudio = r.tag === "Audio";
              return (
                <div
                  key={idx}
                  className="min-w-[340px] max-w-[340px] rounded-[var(--radius-large)] p-6"
                  style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: isAudio
                      ? "1px solid rgba(167,243,208,0.80)"
                      : "1px solid rgba(191,219,254,0.80)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Étoiles */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} />)}
                  </div>

                  <p className="mt-3 text-sm leading-[1.7] text-slate-800">
                    "{r.quote}"
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`
                        h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold
                        ${isAudio ? "bg-[#ECFDF5] text-[#00C98A]" : "bg-[#EFF6FF] text-[#2D8CFF]"}
                      `}>
                        {r.author.slice(0, 1)}
                      </div>
                      <div className="text-sm font-medium text-slate-800">{r.author}</div>
                    </div>

                    <span className={`
                      inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-medium ring-1
                      ${isAudio
                        ? "bg-[#ECFDF5] text-[#00C98A] ring-[#A7F3D0]"
                        : "bg-[#EFF6FF] text-[#2D8CFF] ring-[#BFDBFE]"
                      }
                    `}>
                      {r.tag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
