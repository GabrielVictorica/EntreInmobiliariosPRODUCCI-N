
import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Building2, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Registro exitoso! Revisa tu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E0D8CC] p-4">
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        <div className="bg-[#364649] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <Building2 size={200} className="text-white absolute -right-10 -bottom-10 transform rotate-12"/>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#AA895F] rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <Building2 className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">EntreInmobiliarios</h1>
            <p className="text-[#AA895F] text-xs font-bold uppercase tracking-widest mt-2">Sistema de Gestión Inteligente</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-[#364649] mb-6 text-center">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5"/>
                <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#364649]/10 rounded-xl pl-10 pr-4 py-3 text-[#364649] focus:outline-none focus:border-[#AA895F] focus:ring-1 focus:ring-[#AA895F] transition-all"
                  placeholder="usuario@inmobiliaria.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#364649]/10 rounded-xl pl-10 pr-4 py-3 text-[#364649] focus:outline-none focus:border-[#AA895F] focus:ring-1 focus:ring-[#AA895F] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#364649] text-white py-3.5 rounded-xl font-bold hover:bg-[#2A3638] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                mode === 'login' ? 'Ingresar al Sistema' : 'Registrarse'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-xs text-[#708F96] font-bold hover:text-[#364649] hover:underline transition-colors"
            >
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
