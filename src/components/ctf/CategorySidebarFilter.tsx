import { useEffect, useState } from 'react';
import { getChallengeCategories, type ChallengeCategoryCount } from '../../services/challenges';

export interface CategorySidebarFilterProps {
  onFilterChange: (filters: { category: string; difficulty: string }) => void;
}

export function CategorySidebarFilter({ onFilterChange }: CategorySidebarFilterProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [categories, setCategories] = useState<ChallengeCategoryCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    getChallengeCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSelectCategory = (cat: string) => {
    const nextCat = selectedCategory === cat ? '' : cat;
    setSelectedCategory(nextCat);
    onFilterChange({ category: nextCat, difficulty: selectedDifficulty });
  };

  const handleSelectDifficulty = (diff: string) => {
    const nextDiff = selectedDifficulty === diff ? '' : diff;
    setSelectedDifficulty(nextDiff);
    onFilterChange({ category: selectedCategory, difficulty: nextDiff });
  };

  return (
    <aside
      className={`transition-all duration-300 ${
        isOpen ? 'w-full lg:w-64' : 'w-full lg:w-16'
      } bg-slate-900 border-r border-slate-800 p-4 flex flex-col rounded-xl`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-slate-400 hover:text-white mb-4 text-left font-bold"
      >
        {isOpen ? '◀ Contraer Filtros' : '▶ Filtros'}
      </button>
      {isOpen && (
        <div className="flex flex-col space-y-6">
          {/* Sección Categorías */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Categorías</h4>
            <div className="flex flex-col space-y-1">
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => handleSelectCategory(c.category)}
                  className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                    selectedCategory === c.category
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="uppercase">{c.category}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">
                    {c.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Sección Dificultad */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Dificultad</h4>
            <div className="flex flex-wrap gap-1.5">
              {['EASY', 'MEDIUM', 'HARD', 'INSANE'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleSelectDifficulty(d)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                    selectedDifficulty === d
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
