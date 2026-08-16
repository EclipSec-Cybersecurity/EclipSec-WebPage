import re

with open("src/pages/CTFChallenges.tsx", "r") as f:
    content = f.read()

# 1. Add imports
import_str = "import { updateProfile, generateAdminToken, redeemAdminToken } from '../services/auth';"
if "updateProfile" not in content:
    content = content.replace("import { type CtfUser } from '../services/auth';", 
                              f"import {{ type CtfUser, updateProfile, generateAdminToken, redeemAdminToken }} from '../services/auth';")

# 2. Add state
state_str = """
    const [profileDesc, setProfileDesc] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [adminToken, setAdminToken] = useState('');
    const [redeemToken, setRedeemToken] = useState('');
"""
if "const [profileDesc" not in content:
    content = content.replace("const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'countries'>('global');", 
                              f"const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'countries'>('global');\n{state_str}")

# 3. Add handlers
handlers_str = """
    const handleUpdateProfile = async () => {
        try {
            await updateProfile(profileDesc);
            const state = await getCtfAcademyData();
            setCurrentUser(state.currentUser);
            setIsEditingProfile(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerateAdmin = async () => {
        try {
            const res = await generateAdminToken();
            if (res.data?.token) setAdminToken(res.data.token);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRedeemAdmin = async () => {
        try {
            await redeemAdminToken(redeemToken);
            const state = await getCtfAcademyData();
            setCurrentUser(state.currentUser);
            setRedeemToken('');
        } catch (e) {
            console.error(e);
        }
    };
"""
if "handleUpdateProfile" not in content:
    content = content.replace("const handleLogout = async () => {", f"{handlers_str}\n    const handleLogout = async () => {{")

# 4. Add UI
ui_str = """
                                <div className="mt-4 pt-4 border-t border-[#00ff41]/15">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-xs font-bold text-[#00ff41]">SOBRE MÍ</h3>
                                        {!isEditingProfile && (
                                            <button onClick={() => { setProfileDesc(currentUser.description || ''); setIsEditingProfile(true); }} className="text-[10px] text-[#00ff41]/70 hover:text-[#00ff41] underline">Editar</button>
                                        )}
                                    </div>
                                    {isEditingProfile ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea 
                                                value={profileDesc} 
                                                onChange={e => setProfileDesc(e.target.value)} 
                                                className="bg-black/50 border border-[#00ff41]/30 rounded text-xs p-2 text-white outline-none focus:border-[#00ff41]"
                                                rows={3}
                                                placeholder="Cuéntanos sobre ti..."
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setIsEditingProfile(false)} className="text-[10px] text-white/50 hover:text-white">Cancelar</button>
                                                <button onClick={handleUpdateProfile} className="text-[10px] bg-[#00ff41]/20 text-[#00ff41] px-2 py-1 rounded hover:bg-[#00ff41]/30">Guardar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-white/70 italic">{currentUser.description || "Sin descripción."}</p>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#00ff41]/15">
                                    <h3 className="text-xs font-bold text-yellow-400 mb-2">ADMINISTRACIÓN</h3>
                                    {currentUser.role === 'admin' ? (
                                        <div className="bg-black/40 border border-yellow-400/30 rounded p-3">
                                            <button onClick={handleGenerateAdmin} className="w-full text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 py-1.5 rounded hover:bg-yellow-400/20 mb-2">
                                                Generar Token de Admin
                                            </button>
                                            {adminToken && (
                                                <div className="bg-black p-2 rounded border border-white/10 text-[10px] font-mono text-white text-center break-all">
                                                    {adminToken}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-black/40 border border-[#00ff41]/20 rounded p-3 flex flex-col gap-2">
                                            <input 
                                                type="text" 
                                                value={redeemToken} 
                                                onChange={e => setRedeemToken(e.target.value)} 
                                                placeholder="Pega el token de admin..." 
                                                className="bg-black border border-[#00ff41]/30 rounded text-xs p-1.5 text-white outline-none"
                                            />
                                            <button onClick={handleRedeemAdmin} className="w-full text-[10px] bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 py-1 rounded hover:bg-[#00ff41]/20">
                                                Canjear Token
                                            </button>
                                        </div>
                                    )}
                                </div>
"""

# Find insertion point just before `</div>` ending the currentUser block
# we look for:
#                                     <div className="bg-black/40 border border-[#00ff41]/15 rounded-lg p-3 col-span-2 sm:col-span-1">
#                                         <span className="text-[10px] text-[#00ff41]/50 uppercase block">Telemetría En Vivo</span>
#                                         ...
#                                     </div>
#                                 </div>
#                             </div>
target = """                                    </div>
                                </div>"""

if "SOBRE MÍ" not in content:
    content = content.replace(target, target + "\n" + ui_str)

with open("src/pages/CTFChallenges.tsx", "w") as f:
    f.write(content)
