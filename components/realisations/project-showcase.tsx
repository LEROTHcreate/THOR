import Image from "next/image";
import Link from "next/link";
import { AppWindow, windowLabel } from "@/components/ui/app-window";
import type { Realisation } from "@/lib/realisations";

/**
 * Grande ligne de présentation d'un produit : le discours d'un côté,
 * l'interface réelle de l'autre.
 *
 * Une ligne sur deux inverse les colonnes (`flip`) — sans quoi cinq produits
 * empilés donnent cinq fois la même image et l'œil décroche.
 */
export function ProjectShowcase({
  item,
  flip = false,
  priority = false,
}: {
  item: Realisation;
  flip?: boolean;
  priority?: boolean;
}) {
  const external = item.href ? /^https?:\/\//.test(item.href) : false;
  const label = item.href ? windowLabel(item.href) : item.name.toLowerCase();

  const window = (
    <AppWindow
      src={item.cover}
      alt={item.name}
      label={label}
      accent={item.accent}
      priority={priority}
    />
  );

  return (
    <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
      <div className={flip ? "md:order-2" : undefined}>
        {/* Un seul marqueur d'identité : la marque du projet quand elle existe,
            la pastille de couleur à défaut. Les deux ensemble se concurrencent. */}
        <div className="mb-5 flex items-center gap-3">
          {item.logo ? (
            <Image
              src={item.logo}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
          ) : (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.accent, boxShadow: `0 0 0 3px ${item.accent}1A` }}
            />
          )}
          <span className="mono-label text-slate-500">
            {item.tagline} · En production
          </span>
        </div>

        <h3 className="h-title text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
          {item.name}
        </h3>

        <p className="mt-5 text-[17px] text-slate-500 leading-[1.65]">{item.summary}</p>

        <ul className="mt-7 space-y-2.5">
          {item.features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-3 text-[15px] text-slate-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-1 shrink-0" style={{ color: item.accent }} aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
          {item.href &&
            (external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-center gap-2 text-[15px] font-medium"
                style={{ color: item.accent }}
              >
                Ouvrir le site
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover/link:translate-x-0.5" aria-hidden="true">
                  <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : (
              <Link
                href={item.href}
                className="group/link inline-flex items-center gap-2 text-[15px] font-medium"
                style={{ color: item.accent }}
              >
                Découvrir {item.name}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover/link:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}

          {item.proHref && (
            <Link href={item.proHref} className="text-[15px] font-medium text-slate-500 transition-colors hover:text-slate-900">
              Espace pro
            </Link>
          )}

          <Link href={`/realisations/${item.slug}`} className="text-[15px] text-slate-500 transition-colors hover:text-slate-900">
            La fiche projet
          </Link>
        </div>
      </div>

      <div className={flip ? "md:order-1" : undefined}>
        {item.href ? (
          external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="group block" aria-label={`Ouvrir ${item.name}`}>
              {window}
            </a>
          ) : (
            <Link href={item.href} className="group block" aria-label={`Découvrir ${item.name}`}>
              {window}
            </Link>
          )
        ) : (
          window
        )}
      </div>
    </div>
  );
}
