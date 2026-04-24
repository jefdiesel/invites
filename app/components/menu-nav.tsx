"use client";

import { useState } from "react";

type MenuSection = { name: string; categories: string[] };

export function MenuNav({
  sections,
  allCategories,
  accent,
  textLight,
  border,
  rBtn,
}: {
  sections: MenuSection[];
  allCategories: string[];
  accent: string;
  textLight: string;
  border: string;
  rBtn: string;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const unassigned = allCategories.filter(c => !sections.some(s => s.categories.includes(c)));

  if (sections.length === 0) {
    // No sections — flat links
    return (
      <div className="flex flex-wrap gap-2">
        {allCategories.map((cat) => {
          const catId = `menu-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return (
            <a key={catId} href={`#${catId}`}
              className="px-3 py-1.5 text-sm font-medium underline underline-offset-2 transition-colors min-h-[44px] flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: accent }}>
              {cat}
            </a>
          );
        })}
      </div>
    );
  }

  const visibleSections = sections.filter(s => s.categories.some(c => allCategories.includes(c)));

  return (
    <div>
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-2" role="tablist" aria-label="Menu sections">
        {visibleSections.map((section) => {
          const isOpen = openSection === section.name;
          return (
            <button
              key={section.name}
              role="tab"
              aria-selected={isOpen}
              aria-controls={`section-${section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              onClick={() => setOpenSection(isOpen ? null : section.name)}
              className="px-4 py-2 text-sm font-bold uppercase tracking-wider min-h-[44px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: isOpen ? "#fff" : accent,
                background: isOpen ? accent : "transparent",
                border: `1px solid ${isOpen ? accent : accent}`,
                borderRadius: rBtn,
              }}
            >
              {section.name}
            </button>
          );
        })}
        {unassigned.length > 0 && (
          <button
            role="tab"
            aria-selected={openSection === "__other"}
            onClick={() => setOpenSection(openSection === "__other" ? null : "__other")}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wider min-h-[44px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              color: openSection === "__other" ? "#fff" : accent,
              background: openSection === "__other" ? accent : "transparent",
              border: `1px solid ${accent}`,
              borderRadius: rBtn,
            }}
          >
            More
          </button>
        )}
      </div>

      {/* Expanded category links */}
      {visibleSections.map((section) => {
        if (openSection !== section.name) return null;
        const cats = section.categories.filter(c => allCategories.includes(c));
        return (
          <div
            key={section.name}
            id={`section-${section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            role="tabpanel"
            className="flex flex-wrap gap-2 pt-2 pb-1"
          >
            {cats.map((cat) => {
              const catId = `menu-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              return (
                <a key={catId} href={`#${catId}`}
                  className="px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px] flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ color: accent, border: `1px solid ${accent}`, borderRadius: rBtn }}>
                  {cat}
                </a>
              );
            })}
          </div>
        );
      })}
      {openSection === "__other" && unassigned.length > 0 && (
        <div role="tabpanel" className="flex flex-wrap gap-2 pt-2 pb-1">
          {unassigned.map((cat) => {
            const catId = `menu-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return (
              <a key={catId} href={`#${catId}`}
                className="px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px] flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: accent, border: `1px solid ${accent}`, borderRadius: rBtn }}>
                {cat}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
