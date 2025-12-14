# Guía de Configuración: Sincronización Google Calendar con Supabase

Esta guía te explica cómo configurar tu aplicación para que tus usuarios ("agentes") puedan sincronizar su calendario de Google simplemente haciendo clic en un botón.

## 🛑 Concepto Importante: ¿Qué hacen tus agentes?

**Tus agentes NO tienen que hacer estos pasos.**

*   **TÚ (Como dueño de la App):** Haces esta configuración **UNA SOLA VEZ**. Esto es para decirle a Google "Hola, soy la App 'Inmobiliaria App' y quiero permiso para que mis usuarios se conecten".
*   **TUS AGENTES (Usuarios finales):** Solo verán el botón "Sincronizar", se abrirá una ventanita de Google, darán "Aceptar", ¡y listo! Su calendario quedará vinculado automáticamente.

---

## PASO 1: Google Cloud Console (Configuración del Proyecto)

1.  Ve a [Google Cloud Console](https://console.cloud.google.com/) e inicia sesión con tu cuenta de Google.
2.  Arriba a la izquierda, haz clic en el selector de proyectos y elige **"New Project"** (Nuevo Proyecto).
    *   Ponle un nombre (ej: `Inmobiliaria App`).
    *   Dale a **Create**.
3.  Asegúrate de tener seleccionado tu nuevo proyecto arriba a la izquierda.

### Habilitar la API de Calendario
1.  En el menú lateral (las 3 rayitas), ve a **"APIs & Services"** > **"Library"**.
2.  En el buscador escribe: `Google Calendar API`.
3.  Haz clic en el resultado y luego en el botón **Enable** (Habilitar).

### Configurar la Pantalla de Consentimiento (OAuth Consent Screen)
1.  Ve a **"APIs & Services"** > **"OAuth consent screen"**.
2.  Selecciona **External** (Externo) y dale a **Create**.
3.  Llena los datos básicos:
    *   **App Name:** El nombre que verán tus agentes (ej: `CRM Inmobiliario`).
    *   **User support email:** Tu correo.
    *   **Developer contact information:** Tu correo.
4.  Dale a **Save and Continue**.
5.  En la página de **Scopes**, dale a **Add or Remove Scopes**.
    *   Busca y selecciona: `.../auth/calendar` (Google Calendar API).
    *   Dale a **Update** y luego **Save and Continue**.
6.  En **Test Users**, agrega tu propio correo para poder probarlo mientras la app está en modo de prueba.

### Crear las Credenciales (Client ID y Secret)
1.  Ve a **"APIs & Services"** > **"Credentials"**.
2.  Arriba, haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**.
3.  En "Application type", elige **Web application**.
4.  En "Authorized redirect URIs" (IMPORTANTE):
    *   Haz clic en **Add URI**.
    *   Debes pegar la URL de "Callback" de tu proyecto de Supabase.
    *   Para encontrarla: Ve a tu Supabase Dashboard > Authentication > Providers > Google. Ahí verás algo como `Callback URL (for your OAuth app)`. Copia esa URL (se ve como `https://tuproyecto.supabase.co/auth/v1/callback`) y pégala agui en Google.
5.  Dale a **Create**.
6.  **¡IMPORTANTE!** Se abrirá una ventana con `Your Client ID` y `Your Client Secret`. **NO LOS PIERDAS**. Copialos en un bloc de notas por ahora.

---

## PASO 2: Supabase Dashboard

1.  Ve a tu panel de [Supabase](https://supabase.com/dashboard).
2.  Entra a tu proyecto.
3.  En el menú lateral, ve a **Authentication** > **Providers**.
4.  Busca **Google** en la lista y despliégalo.
5.  **Enable Google provider:** Activa el interruptor.
6.  **Client ID:** Pega el código largo que copiaste de Google.
7.  **Client Secret:** Pega el código secreto que copiaste de Google.
8.  Dale a **Save**.

---

## PASO 3: Probar en tu App

1.  Reinicia tu aplicación (si está corriendo, ciérrala y vuelve a `npm run dev`).
2.  Ve a la pestaña de Calendario.
3.  Haz clic en "Sincronizar Google Calendar".
4.  Debería abrirse la ventana de Google pidiéndote acceso.

¡Listo! Una vez configurado esto, cualquier agente podrá entrar y conectar su calendario en segundos.
