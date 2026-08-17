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
        isOpen ? 'w-full xl:w-64' : 'w-full xl:w-16'
      } bg-[#0a0a0a]/95 border border-[#00ff41]/20 p-4 flex flex-col rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-400 hover:text-[#00ff41] mb-4 text-left font-bold transition-colors"
      >
        {isOpen ? '◀ Contraer Filtros' : '▶ Filtros'}
      </button>
      {isOpen && (
        <div className="flex flex-col space-y-6">
          {/* Sección Categorías */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Categorías</h4>
            <div className="flex flex-col space-y-1">
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => handleSelectCategory(c.category)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedCategory === c.category
                      ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40 shadow-[0_0_10px_rgba(0,255,65,0.1)]'
                      : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="uppercase">{c.category}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black text-gray-400 font-mono border border-gray-800">
                    {c.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Sección Dificultad */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Dificultad</h4>
            <div className="flex flex-wrap gap-1.5">
              {['EASY', 'MEDIUM', 'HARD', 'INSANE'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleSelectDifficulty(d)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                    selectedDifficulty === d
                      ? 'bg-[#00ff41] text-black font-bold shadow-[0_0_10px_rgba(0,255,65,0.3)]'
                      : 'bg-black/60 text-gray-400 hover:text-white border border-gray-800'
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
