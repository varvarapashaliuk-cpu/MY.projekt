import React from 'react';
import { X, Zap, Flame, ShieldAlert, Sparkles, Wind } from 'lucide-react';

interface ScienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScienceModal: React.FC<ScienceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide">
                Fizyka Pioruna & Anatomia Uderzenia w Drzewo
              </h2>
              <p className="text-xs text-slate-400">
                Co dzieje się w ułamku milisekundy podczas uderzenia w stary dąb?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6 text-sm leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
              <Sparkles className="w-4 h-4 shrink-0" />
              <h3>1. Lider schodkowy i wyładowanie wstępujące</h3>
            </div>
            <p className="text-slate-300">
              Gdy w chmurach burzowych skumuluje się ogromny ładunek ujemny, ku ziemi z prędkością setek kilometrów na sekundę schodzi tzw. <strong>lider schodkowy</strong> (stepped leader). Wysokie drzewa w lesie, ze względu na wilgotne korzenie i soki bogate w minerały, działają jak naturalne odgromniki. Z korony drzewa wystrzeliwuje w górę jonizujący kanał dodatni (upward streamer). W momencie ich połączenia następuje powrotne wyładowanie główne (return stroke).
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-base">
              <Flame className="w-4 h-4 shrink-0" />
              <h3>2. Eksplozja pary: Dlaczego pień pęka na pół?</h3>
            </div>
            <p className="text-slate-300">
              Temperatura kanału plazmowego pioruna osiąga niemal <strong>30 000 kelwinów</strong> – jest pięciokrotnie wyższa niż temperatura powierzchni Słońca! Woda i soki płynące w wiązkach naczyniowych pod korą w ułamku mikrosekundy zamieniają się w parę pod gigantycznym ciśnieniem. Dochodzi do fizycznej eksplozji hydraulicznej: kora zostaje odrzucona na dziesiątki metrów, a twardziel pnia pęka wzdłuż słojów, tworząc rozżarzoną szczelinę.
            </p>
          </div>

          {/* Section 3: Statystyki */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center">
            <div>
              <span className="block font-mono text-xl font-bold text-amber-400 tabular-nums">~30 000 A</span>
              <span className="text-xs text-slate-400">Natężenie prądu</span>
            </div>
            <div>
              <span className="block font-mono text-xl font-bold text-cyan-400 tabular-nums">100-300 mln V</span>
              <span className="text-xs text-slate-400">Napięcie wyładowania</span>
            </div>
            <div>
              <span className="block font-mono text-xl font-bold text-rose-400 tabular-nums">30 000 K</span>
              <span className="text-xs text-slate-400">Temperatura plazmy</span>
            </div>
          </div>

          {/* Section 4: Bezpieczeństwo */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <h3>Zasady bezpieczeństwa podczas burzy w lesie</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-rose-200/90">
              <li><strong>Nigdy nie chroń się pod pojedynczym, wysokim drzewem</strong> – jest głównym celem wyładowań.</li>
              <li>W gęstym lesie bezpieczniejsze jest schronienie pośród niższych drzew o równej wysokości.</li>
              <li>Nie opieraj się o pnie drzew – prąd może przeskoczyć w postaci iskry bocznej (side flash).</li>
              <li>Złącz stopy i kucnij, aby zminimalizować tzw. <em>napięcie krokowe</em> rozchodzące się po wilgotnej ziemi.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Zamknij i powróć do symulacji
          </button>
        </div>
      </div>
    </div>
  );
};
