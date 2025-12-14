import { GoogleGenAI } from "@google/genai";
import { ClientRecord, PropertyRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeClientProfile = async (client: ClientRecord): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    Actúa como un experto Consultor de Perfiles Comerciales en Real Estate.
    Analiza los datos de este nuevo cliente inmobiliario para generar un "Perfil de Cliente" breve y útil para el agente.
    
    NO inventes datos, infiere basado en la estructura de propiedad y tipo de cliente.

    Datos del Cliente:
    - Tipo: ${client.profileType}
    - Titulares: ${client.owners.map(o => `${o.name} (${o.maritalStatus || 'N/A'})`).join(', ')}
    - Ubicación: ${client.contact.city}
    - Notas del Agente: ${client.notes || 'Sin notas'}

    Objetivo:
    Generar un resumen de 2 o 3 líneas en ESPAÑOL que defina:
    1. La complejidad legal probable (ej: si son varios titulares o una empresa).
    2. El tono sugerido para la comunicación (Formal, Cercano, Ejecutivo).
    3. Perfil de riesgo aparente.

    Formato: Texto plano, conciso. Sin títulos markdown excesivos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "Perfil no generado.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error analizando perfil.";
  }
};

export const analyzeProperty = async (property: PropertyRecord): Promise<string> => {
    const modelId = "gemini-2.5-flash";

    const prompt = `
      Actúa como un Redactor Inmobiliario Senior para la firma "ParaInmobiliarios".
      Genera una descripción de venta para la propiedad siguiendo ESTRICTAMENTE la plantilla solicitada.

      INSTRUCCIONES DE TONO Y ESTILO:
      - 100% Objetivo y descriptivo.
      - PROHIBIDO usar adjetivos subjetivos (lindo, hermoso, espectacular, increíble).
      - Formato de lista limpia para superficies y ambientes.
      - Mantén los textos fijos solicitados.

      DATOS DE LA PROPIEDAD:
      - Tipo: ${property.type}
      - Ubicación: Calle ${property.address.street} ${property.address.number}, Piso ${property.address.floor}, Barrio ${property.address.neighborhood}.
      - Superficies: Cubierta ${property.surface.covered}m², Semi ${property.surface.semiCovered}m², Descubierta ${property.surface.uncovered}m².
      - Ambientes: ${property.features.bedrooms} dormitorios, ${property.features.bathrooms} baños, ${property.features.toilettes} toilettes.
      - Distribución: Cocina ${property.features.layout.kitchen}, Living ${property.features.layout.living}.
      - Orientación: ${property.features.orientation}.
      - Expensas: $${property.expenses.ordinary} ${property.currency}.
      - Documentación: ${property.legal.deedStatus}.
      - Estado: ${property.features.condition}.
      - Amenities: ${property.amenities.join(', ')}.

      PLANTILLA OBLIGATORIA (Rellena los corchetes):

      Inmobiliaria "ParaInmobiliarios" VENDE

      [Párrafo 1: Describe qué es, en qué piso está (si aplica), su disposición (frente/contrafrente) y su ubicación exacta (calle y barrio). Si puedes inferir cruces de calles o cercanías básicas por el barrio, agrégalas objetivamente].

      [Párrafo 2: Características del edificio o lote. Mencionar si tiene ascensor, escaleras o amenities mencionados].

      Superficie:

      - [Valor] m² cubiertos
      - [Valor] m² semicubiertos/descubiertos (solo si es mayor a 0)

      Ambientes:

      - [Texto descriptivo de dormitorios, ej: "Dos dormitorios con placard"]
      - [Cantidad] Baño completo
      - Toilette (Solo si tiene)
      - Cocina [independiente/integrada/etc]
      - Living [comedor/integrado]

      Orientación: [Punto cardinal], [breve comentario objetivo sobre luz].
      Expensas: $[Valor] [Moneda] (valor aproximado).
      Documentación: [Estado legal].

      (Imágenes amobladas ilustrativas)

      Para recibir más información o coordinar una visita, contactá al Equipo "ParaInmobiliarios".
    `;

    try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
        });
        return response.text || "Descripción no disponible.";
      } catch (error) {
        console.error("Gemini Error:", error);
        return "Error generando descripción.";
      }
};