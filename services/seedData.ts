
import { SupabaseClient } from '@supabase/supabase-js';
import { ClientRecord, PropertyRecord, BuyerClientRecord, BuyerSearchRecord, VisitRecord, MarketingLog } from '../types';

// --- DATA SETS ---

const seedSellers: ClientRecord[] = [
  {
    id: 'seed-seller-1',
    profileType: 'particular',
    owners: [{ id: 'own-1', name: 'Roberto Gómez', dni: '20.123.456', cuit: '20-20123456-2', maritalStatus: 'casado' }],
    contact: { email: 'roberto.gomez@mail.com', phone: '+54 9 11 1234 5678', address: 'Av. Cabildo 2020', city: 'CABA', preferredContact: 'whatsapp' },
    notes: 'Vende para achicarse. Quiere mudarse cerca de sus nietos en Villa Urquiza.',
    tags: ['Motivado', 'Cliente Referido'],
    createdAt: new Date().toISOString(),
    aiProfileSummary: 'Perfil Particular (Familia). Tono sugerido: Cercano y empático. Baja complejidad legal aparente, titular único casado.'
  },
  {
    id: 'seed-seller-2',
    profileType: 'investor',
    owners: [{ id: 'own-2', name: 'Grupo Inversor SA', dni: '', cuit: '30-70123456-9', maritalStatus: 'soltero' }],
    contact: { email: 'admin@grupoinv.com', phone: '+54 9 11 9876 5432', address: 'Puerto Madero Dock 3', city: 'CABA', preferredContact: 'email' },
    notes: 'Empresa constructora liquidando stock remanente.',
    tags: ['Inversor', 'Corporativo'],
    createdAt: new Date().toISOString(),
    aiProfileSummary: 'Perfil Corporativo. Tono sugerido: Ejecutivo y directo. Complejidad media, requiere documentación societaria.'
  }
];

const seedProperties: PropertyRecord[] = [
  {
    id: 'seed-prop-1',
    clientId: 'seed-seller-1',
    customId: 'PROP-101',
    status: 'disponible',
    type: 'departamento',
    address: { street: 'Av. Libertador', number: '4500', floor: '8', unit: 'B', neighborhood: 'Palermo', zoning: { code: 'USAA', fot: '', fos: '', tps: '', maxHeight: '' } },
    price: 280000,
    currency: 'USD',
    creditEligible: true,
    surface: { covered: 85, semiCovered: 10, uncovered: 0, total: 95 },
    features: {
      layout: { kitchen: 'separada', living: 'separado' },
      rooms: 3, bedrooms: 2, bathrooms: 2, toilettes: 1, age: 15, condition: 'muy_bueno', orientation: 'norte', disposition: 'frente', parking: 'covered', parkingType: 'propia'
    },
    amenities: ['Seguridad 24hs', 'Pileta', 'SUM'],
    hvac: 'losa',
    legal: { deedStatus: 'escritura', plans: 'aprobados', rules: { professionalUse: false, petsAllowed: true } },
    expenses: { ordinary: 150000, extraordinary: 0, taxesStatus: 'al_dia', services: ['Luz', 'Gas', 'Agua'] },
    logistics: { occupation: 'habitada', keysLocation: 'dueño', signage: true },
    files: { 
        photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop'], 
        documents: [], debts: [] 
    },
    createdAt: new Date().toISOString(),
    aiAnalysis: 'Inmobiliaria "ParaInmobiliarios" VENDE\n\nExcelente departamento en piso 8 al frente sobre Av. Libertador, Palermo. Ubicación privilegiada con vistas abiertas y excelente luz natural.\n\nEdificio de categoría con seguridad y amenities completos.\n\nSuperficie:\n- 85 m² cubiertos\n- 10 m² semicubiertos\n\nAmbientes:\n- Dos dormitorios con placard\n- 2 Baños completos\n- Toilette de recepción\n- Cocina independiente con lavadero\n- Living comedor amplio\n\nOrientación: Norte, sol todo el día.\nExpensas: $150.000 ARS (aprox).\nDocumentación: Escritura Perfecta.\n\nPara coordinar visita, contactar.'
  },
  {
    id: 'seed-prop-2',
    clientId: 'seed-seller-2',
    customId: 'PROP-205',
    status: 'reservada',
    type: 'oficina',
    address: { street: 'Juana Manso', number: '1200', floor: '3', unit: '101', neighborhood: 'Puerto Madero', zoning: { code: 'CM', fot: '', fos: '', tps: '', maxHeight: '' } },
    price: 450000,
    currency: 'USD',
    creditEligible: false,
    surface: { covered: 120, semiCovered: 0, uncovered: 0, total: 120 },
    features: {
      layout: { kitchen: 'kitchenette', living: 'integrado' },
      rooms: 1, bedrooms: 0, bathrooms: 2, toilettes: 0, age: 5, condition: 'a_estrenar', orientation: 'este', disposition: 'frente', parking: 'covered', parkingType: 'propia'
    },
    amenities: ['Seguridad 24hs', 'Gimnasio'],
    hvac: 'central',
    legal: { deedStatus: 'boleto', plans: 'aprobados', rules: { professionalUse: true, petsAllowed: false } },
    expenses: { ordinary: 250000, extraordinary: 0, taxesStatus: 'al_dia', services: ['Luz', 'Agua'] },
    logistics: { occupation: 'vacia', keysLocation: 'oficina', signage: false },
    files: { 
        photos: ['https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop'], 
        documents: [], debts: [] 
    },
    createdAt: new Date().toISOString(),
    aiAnalysis: 'Inmobiliaria "ParaInmobiliarios" VENDE\n\nOficina premium en Puerto Madero. Planta libre ideal para empresa corporativa.\n\nSuperficie: 120 m² cubiertos.\n\nDetalles:\n- 2 Baños\n- Kitchenette\n- Aire Acondicionado Central\n- 2 Cocheras\n\nEdificio con control de acceso y seguridad.'
  }
];

const seedMarketing: MarketingLog[] = [
    {
        id: 'seed-mkt-1',
        propertyId: 'seed-prop-1',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        period: '14_days',
        marketplace: { publications: 4, impressions: 1200, clicks: 45, inquiries: 8 },
        social: { publications: 2, impressions: 800, clicks: 20, inquiries: 2 },
        ads: { publications: 1, impressions: 5000, clicks: 150, inquiries: 15 }
    },
    {
        id: 'seed-mkt-2',
        propertyId: 'seed-prop-1',
        date: new Date().toISOString(), // Today
        period: '14_days',
        marketplace: { publications: 4, impressions: 1500, clicks: 60, inquiries: 12 },
        social: { publications: 3, impressions: 950, clicks: 35, inquiries: 5 },
        ads: { publications: 1, impressions: 4500, clicks: 130, inquiries: 10 }
    }
];

const seedBuyers: BuyerClientRecord[] = [
    {
        id: 'seed-buyer-1',
        name: 'Lucía Fernández',
        dni: '28.999.888',
        phone: '+54 9 11 5555 6666',
        email: 'lucia.fer@gmail.com',
        address: 'Belgrano R',
        type: 'consumidor_final',
        notes: 'Primera vivienda. Muy detallista.',
        createdAt: new Date().toISOString()
    },
    {
        id: 'seed-buyer-2',
        name: 'Carlos & Ana (Pareja)',
        dni: '30.111.222',
        phone: '+54 9 11 4444 3333',
        email: 'carlos.ana@hotmail.com',
        address: 'Almagro',
        type: 'consumidor_final',
        notes: 'Buscan agrandarse por llegada de un hijo.',
        createdAt: new Date().toISOString()
    }
];

const seedSearches: BuyerSearchRecord[] = [
    {
        id: 'seed-search-1',
        buyerClientId: 'seed-buyer-1',
        agentName: 'Agente Inmobiliario',
        status: 'activo',
        searchProfile: {
            propertyTypes: ['departamento'],
            zones: ['Palermo', 'Belgrano', 'Colegiales'],
            minRequirements: { bedrooms: 1, bathrooms: 1, totalSurface: 50 },
            exclusions: { mustHaveGarage: false, mustHaveOutdoor: true, mortgageRequired: true, acceptsOffPlan: false },
            timeline: '30_60_dias',
            trigger: 'vencimiento_alquiler',
            availability: 'Sábados mediodía',
            budget: { max: 180000, currency: 'USD' },
            paymentMethod: 'credito',
            salesCondition: { needsToSell: false, isPropertyCaptured: false },
            acceptsSwap: false,
            decisionMakers: 'Ella sola y consulta con su padre.',
            nurcNotes: { 
                n: 'Prioriza luz natural y balcón aterrazado.', 
                u: 'Se le vence el contrato en 3 meses.', 
                r: 'Tiene preaprobado crédito hipotecario.', 
                c: 'Decide ella.' 
            }
        },
        createdAt: new Date().toISOString()
    },
    {
        id: 'seed-search-2',
        buyerClientId: 'seed-buyer-2',
        agentName: 'Agente Inmobiliario',
        status: 'activo',
        searchProfile: {
            propertyTypes: ['departamento', 'ph'],
            zones: ['Palermo', 'Recoleta'],
            minRequirements: { bedrooms: 2, bathrooms: 2, totalSurface: 90 },
            exclusions: { mustHaveGarage: true, mustHaveOutdoor: false, mortgageRequired: false, acceptsOffPlan: false },
            timeline: 'inmediato',
            trigger: 'cambio_familia',
            availability: 'Lunes a Viernes después de las 18hs',
            budget: { max: 320000, currency: 'USD' },
            paymentMethod: 'contado',
            salesCondition: { needsToSell: true, isPropertyCaptured: false },
            acceptsSwap: true,
            decisionMakers: 'Ambos.',
            nurcNotes: {
                n: 'Necesitan 3 ambientes reales o 2 con dependencia.',
                u: 'El bebé nace en 2 meses.',
                r: 'Venden su depto actual (no captado aún).',
                c: 'Ambos firman.'
            }
        },
        createdAt: new Date().toISOString()
    }
];

const seedVisits: VisitRecord[] = [
    {
        id: 'seed-visit-1',
        propertyId: 'seed-prop-1', // Palermo
        buyerClientId: 'seed-buyer-2', // Carlos & Ana
        agentName: 'Agente Inmobiliario',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
        time: '18:30',
        duration: '30',
        meetingPoint: 'propiedad',
        securityCheck: true,
        status: 'realizada',
        signedConfirmation: true,
        feedback: {
            rating: 4,
            pricePerception: 'justo',
            interestLevel: 'caliente',
            positivePoints: 'Les encantó la distribución y la luz.',
            objections: 'La cocina les pareció un poco chica para cocinar de a dos.',
            nurcMatch: true,
            searchCriteriaUpdate: ''
        },
        nextSteps: { action: 'segunda_visita', followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        createdAt: new Date().toISOString()
    },
    {
        id: 'seed-visit-2',
        propertyId: 'seed-prop-2', // Puerto Madero (Oficina - just for demo mismatch)
        buyerClientId: 'seed-buyer-1', // Lucia (Looking for home)
        agentName: 'Agente Inmobiliario',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        time: '11:00',
        duration: '60',
        meetingPoint: 'oficina',
        securityCheck: false,
        status: 'pendiente',
        signedConfirmation: false,
        createdAt: new Date().toISOString()
    }
];


// --- SEED FUNCTION ---

export const seedDatabase = async (supabase: SupabaseClient) => {
    console.log("Starting DB Seed...");

    // 1. Sellers
    const sellers = await supabase.from('seller_clients').upsert(seedSellers.map(c => ({
        id: c.id, profile_type: c.profileType, owners: c.owners, contact: c.contact, notes: c.notes, tags: c.tags, ai_profile_summary: c.aiProfileSummary, created_at: c.createdAt
    })));
    if(sellers.error) console.error("Error seeding sellers", sellers.error);

    // 2. Properties
    const props = await supabase.from('properties').upsert(seedProperties.map(p => ({
        id: p.id, client_id: p.clientId, custom_id: p.customId, status: p.status, type: p.type, price: p.price, currency: p.currency, credit_eligible: p.creditEligible, address: p.address, surface: p.surface, features: p.features, amenities: p.amenities, hvac: p.hvac, legal: p.legal, expenses: p.expenses, logistics: p.logistics, files: p.files, ai_analysis: p.aiAnalysis, created_at: p.createdAt
    })));
    if(props.error) console.error("Error seeding properties", props.error);

    // 3. Marketing Logs
    const mkt = await supabase.from('property_marketing_logs').upsert(seedMarketing.map(m => ({
        id: m.id, property_id: m.propertyId, date: m.date, period_type: m.period, marketplace: m.marketplace, social: m.social, ads: m.ads
    })));
    if(mkt.error) console.error("Error seeding marketing", mkt.error);

    // 4. Buyer Clients
    const buyers = await supabase.from('buyer_clients').upsert(seedBuyers.map(b => ({
        id: b.id, name: b.name, dni: b.dni, phone: b.phone, email: b.email, address: b.address, type: b.type, notes: b.notes, created_at: b.createdAt
    })));
    if(buyers.error) console.error("Error seeding buyers", buyers.error);

    // 5. Buyer Searches
    const searches = await supabase.from('buyer_searches').upsert(seedSearches.map(s => ({
        id: s.id, buyer_client_id: s.buyerClientId, agent_name: s.agentName, status: s.status, search_profile: s.searchProfile, created_at: s.createdAt
    })));
    if(searches.error) console.error("Error seeding searches", searches.error);

    // 6. Visits
    const visits = await supabase.from('visits').upsert(seedVisits.map(v => ({
        id: v.id, property_id: v.propertyId, buyer_client_id: v.buyerClientId, agent_name: v.agentName, date: v.date, time: v.time, duration: v.duration, meeting_point: v.meetingPoint, security_check: v.securityCheck, status: v.status, signed_confirmation: v.signedConfirmation, signed_confirmation_file: v.signedConfirmationFile, feedback: v.feedback, next_steps: v.nextSteps, created_at: v.createdAt
    })));
    if(visits.error) console.error("Error seeding visits", visits.error);

    console.log("DB Seed Completed.");
    return true;
};
