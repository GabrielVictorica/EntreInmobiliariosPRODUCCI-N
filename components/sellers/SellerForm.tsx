
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Mail, Phone, MapPin, Save, Building } from 'lucide-react';
import { Owner, ClientRecord, ClientProfile, ContactData } from '../../types';

interface ClientFormProps {
  onSave: (record: ClientRecord) => void;
  onCancel: () => void;
  initialData?: ClientRecord | null;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSave, onCancel, initialData }) => {
  const [profileType, setProfileType] = useState<ClientProfile>('particular');
  const [owners, setOwners] = useState<Owner[]>([
    { id: '1', name: '', dni: '', cuit: '', maritalStatus: 'soltero' }
  ]);
  const [contact, setContact] = useState<ContactData>({
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    preferredContact: 'whatsapp'
  });
  const [notes, setNotes] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
      setProfileType(initialData.profileType);
      setOwners(initialData.owners);
      setContact(initialData.contact);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const addOwner = () => {
    setOwners([...owners, { id: Date.now().toString(), name: '', dni: '', cuit: '', maritalStatus: 'soltero' }]);
  };

  const removeOwner = (id: string) => {
    if (owners.length > 1) {
      setOwners(owners.filter(o => o.id !== id));
    }
  };

  const updateOwner = (id: string, field: keyof Owner, value: string) => {
    setOwners(owners.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const updateContact = (field: keyof ContactData, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure tags is always an array
    const tags = initialData && Array.isArray(initialData.tags) ? initialData.tags : ['Prospecto'];

    const newClient: ClientRecord = {
      id: initialData ? initialData.id : Date.now().toString(),
      profileType,
      owners,
      contact,
      notes,
      tags: tags,
      createdAt: initialData ? initialData.createdAt : new Date().toISOString(),
      aiProfileSummary: initialData?.aiProfileSummary
    };

    onSave(newClient);
  };

  return (
    <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-fade-in-up">
      
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-[#364649] rounded-2xl flex items-center justify-center shadow-lg shadow-[#364649]/20 animate-scale-in">
          <User className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#364649]">{initialData ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <p className="text-[#364649]/60 text-sm font-medium">
            {initialData ? 'Modifica los datos del cliente existente.' : 'Ingresa la información básica del cliente.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Type Selection */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-[#AA895F] uppercase tracking-wider">Tipo de Cliente</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['particular', 'investor', 'constructor', 'company'] as ClientProfile[]).map((type) => (
              <label key={type} className={`cursor-pointer relative group`}>
                <input 
                  type="radio" 
                  name="profileType" 
                  value={type} 
                  checked={profileType === type}
                  onChange={() => setProfileType(type)}
                  className="sr-only" 
                />
                <div className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center transform
                   ${profileType === type 
                     ? 'bg-[#364649] border-[#364649] text-white shadow-lg scale-105' 
                     : 'bg-white/50 border-white/50 text-[#364649]/60 hover:bg-white hover:border-white hover:shadow-md hover:-translate-y-1'
                   }
                `}>
                  <Building size={20} className={`mb-2 transition-colors duration-300 ${profileType === type ? 'text-[#AA895F]' : 'text-[#708F96]'}`} />
                  <span className="capitalize font-bold text-sm">
                    {type === 'particular' ? 'Particular' : type === 'investor' ? 'Inversor' : type === 'constructor' ? 'Constructor' : 'Empresa'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Owners Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-[#708F96] uppercase tracking-wider">Titulares</label>
            <button 
              type="button" 
              onClick={addOwner}
              className="text-xs bg-[#708F96]/10 hover:bg-[#708F96]/20 text-[#708F96] px-3 py-1.5 rounded-lg font-bold transition-all duration-300 flex items-center border border-[#708F96]/20 hover:shadow-md active:scale-95"
            >
              <Plus size={14} className="mr-1" /> Agregar
            </button>
          </div>

          <div className="space-y-3">
            {owners.map((owner, index) => (
              <div key={owner.id} className="relative bg-white/40 p-5 rounded-2xl border border-white group hover:shadow-lg hover:border-white/80 transition-all duration-300 animate-slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
                {owners.length > 1 && (
                  <button type="button" onClick={() => removeOwner(owner.id)} className="absolute top-3 right-3 text-[#364649]/40 hover:text-red-500 transition-colors duration-200 hover:scale-110">
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="md:col-span-2">
                    <Input 
                      label="Nombre Completo" 
                      placeholder="Ej: Juan Pérez" 
                      value={owner.name}
                      onChange={(val: string) => updateOwner(owner.id, 'name', val)}
                    />
                  </div>
                  <div>
                     <Input 
                      label="DNI / CUIT" 
                      placeholder="00.000.000" 
                      value={owner.dni}
                      onChange={(val: string) => updateOwner(owner.id, 'dni', val)}
                    />
                  </div>
                   <div>
                    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Estado Civil</label>
                    <div className="relative">
                      <select 
                        value={owner.maritalStatus}
                        onChange={(e) => updateOwner(owner.id, 'maritalStatus', e.target.value)}
                        className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] focus:outline-none focus:border-[#AA895F] focus:ring-1 focus:ring-[#AA895F] appearance-none transition-all duration-300 shadow-sm hover:border-[#AA895F]/50"
                      >
                        <option value="soltero">Soltero/a</option>
                        <option value="casado">Casado/a</option>
                        <option value="divorciado">Divorciado/a</option>
                        <option value="viudo">Viudo/a</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-[#708F96] uppercase tracking-wider">Contacto</label>
          <div className="bg-white/40 rounded-2xl p-6 border border-white hover:shadow-md transition-shadow duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Email" 
                  icon={<Mail size={16}/>}
                  type="email"
                  value={contact.email}
                  onChange={(val: string) => updateContact('email', val)}
                />
                <Input 
                  label="Teléfono" 
                  icon={<Phone size={16}/>}
                  type="tel"
                  value={contact.phone}
                  onChange={(val: string) => updateContact('phone', val)}
                />
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2">
                      <Input 
                        label="Domicilio" 
                        icon={<MapPin size={16}/>}
                        value={contact.address}
                        onChange={(val: string) => updateContact('address', val)}
                      />
                   </div>
                   <Input 
                      label="Ciudad" 
                      value={contact.city}
                      onChange={(val: string) => updateContact('city', val)}
                    />
                </div>
             </div>
             
             <div className="mt-6">
                <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-2">Preferencia de Contacto</label>
                <div className="flex space-x-2">
                  {['whatsapp', 'call', 'email'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => updateContact('preferredContact', method)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 transform active:scale-95
                        ${contact.preferredContact === method 
                          ? 'bg-[#AA895F] text-white shadow-md scale-105' 
                          : 'bg-white border border-[#364649]/10 text-[#364649]/60 hover:bg-[#364649]/5 hover:text-[#364649]'
                        }
                      `}
                    >
                      {method}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Notes */}
        <div>
           <label className="text-xs font-bold text-[#708F96] uppercase tracking-wider mb-2 block">Notas</label>
           <textarea 
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             className="w-full bg-white/50 border border-[#364649]/10 rounded-xl p-4 text-[#364649] placeholder-[#364649]/40 focus:ring-2 focus:ring-[#AA895F]/50 focus:border-[#AA895F] outline-none h-24 resize-none transition-all duration-300 shadow-sm hover:shadow-md focus:bg-white"
             placeholder="Escribe observaciones importantes sobre el cliente..."
           />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-[#364649]/10">
           <button 
             type="button" 
             onClick={onCancel}
             className="px-6 py-3 text-[#364649]/60 font-bold hover:text-[#364649] transition-colors duration-200"
           >
             Cancelar
           </button>
           <button 
             type="submit"
             className="btn-hover-effect bg-[#364649] text-white px-8 py-3 rounded-xl hover:bg-[#2A3638] flex items-center font-bold"
           >
             <Save className="mr-2" size={18} /> {initialData ? 'Actualizar Cliente' : 'Guardar Cliente'}
           </button>
        </div>

      </form>
    </div>
  );
};

// Reusable Input Component with modern styling and animations
const Input = ({ label, icon, value, onChange, type = "text", placeholder }: any) => (
  <div className="group">
    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1 group-focus-within:text-[#AA895F] transition-colors duration-300">{label}</label>
    <div className="relative transform transition-transform duration-300 group-focus-within:-translate-y-1">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40 group-focus-within:text-[#AA895F] transition-colors duration-300">
          {icon}
        </div>
      )}
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white border border-[#364649]/10 rounded-lg py-2.5 text-sm text-[#364649] placeholder-[#364649]/30 focus:outline-none focus:border-[#AA895F] focus:ring-2 focus:ring-[#AA895F]/20 transition-all duration-300 shadow-sm group-hover:border-[#AA895F]/30 ${icon ? 'pl-10 pr-3' : 'px-3'}`}
      />
    </div>
  </div>
);

export default ClientForm;
