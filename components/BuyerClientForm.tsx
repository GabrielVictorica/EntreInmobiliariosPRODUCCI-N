
import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, MapPin } from 'lucide-react';
import { BuyerClientRecord } from '../types';

interface BuyerClientFormProps {
  onSave: (client: BuyerClientRecord) => void;
  onCancel: () => void;
  initialData?: BuyerClientRecord | null;
}

const BuyerClientForm: React.FC<BuyerClientFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'consumidor_final' | 'inversor' | 'corporativo'>('consumidor_final');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDni(initialData.dni);
      setPhone(initialData.phone);
      setEmail(initialData.email);
      setAddress(initialData.address || '');
      setType(initialData.type);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: BuyerClientRecord = {
      id: initialData ? initialData.id : `BC-${Date.now()}`,
      name, dni, phone, email, address, type, notes,
      createdAt: initialData ? initialData.createdAt : new Date().toISOString()
    };
    onSave(record);
  };

  return (
    <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-fade-in-up">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-[#364649] rounded-2xl flex items-center justify-center shadow-lg shadow-[#364649]/20 animate-scale-in">
          <User className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#364649]">{initialData ? 'Editar Comprador' : 'Nuevo Cliente Comprador'}</h2>
          <p className="text-[#364649]/60 text-sm font-medium">Alta de persona interesada en comprar.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/40 border border-white rounded-2xl p-6 hover:shadow-md transition-all">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nombre Completo" value={name} onChange={setName} placeholder="Ej: Ana Gómez" />
              <Input label="DNI / CUIT" value={dni} onChange={setDni} />
              
              <Input label="Email" value={email} onChange={setEmail} type="email" icon={<Mail size={16}/>} />
              <Input label="Teléfono" value={phone} onChange={setPhone} type="tel" icon={<Phone size={16}/>} />
              
              <div className="md:col-span-2">
                 <Input label="Domicilio Actual" value={address} onChange={setAddress} icon={<MapPin size={16}/>} />
              </div>
              
              <Select label="Perfil de Cliente" value={type} onChange={(e: any) => setType(e.target.value)} 
                 options={[
                    {label: 'Consumidor Final', value: 'consumidor_final'},
                    {label: 'Inversor', value: 'inversor'},
                    {label: 'Corporativo', value: 'corporativo'}
                 ]}
              />
           </div>
        </div>

        <div>
           <label className="text-xs font-bold text-[#708F96] uppercase tracking-wider mb-2 block">Notas Generales</label>
           <textarea 
             value={notes} onChange={(e) => setNotes(e.target.value)}
             className="w-full bg-white/50 border border-[#364649]/10 rounded-xl p-4 text-[#364649] outline-none h-24 resize-none focus:border-[#AA895F]"
             placeholder="Observaciones sobre el cliente..."
           />
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-[#364649]/10">
           <button type="button" onClick={onCancel} className="px-6 py-3 text-[#364649]/60 font-bold hover:text-[#364649]">Cancelar</button>
           <button type="submit" className="bg-[#364649] text-white px-8 py-3 rounded-xl hover:bg-[#2A3638] flex items-center font-bold shadow-lg">
             <Save className="mr-2" size={18} /> {initialData ? 'Actualizar' : 'Guardar'}
           </button>
        </div>
      </form>
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder, type="text", icon }: any) => (
  <div>
    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{label}</label>
    <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40">{icon}</div>}
        <input 
            type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`w-full bg-white border border-[#364649]/10 rounded-lg py-2.5 text-sm text-[#364649] outline-none focus:border-[#AA895F] transition-all shadow-sm ${icon ? 'pl-10 pr-3' : 'px-3'}`}
        />
    </div>
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
    <div>
        <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{label}</label>
        <div className="relative">
            <select value={value} onChange={onChange} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] outline-none focus:border-[#AA895F] appearance-none shadow-sm">
                {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#364649]/40 text-xs">▼</div>
        </div>
    </div>
);

export default BuyerClientForm;
