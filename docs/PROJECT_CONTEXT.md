# PROJECT CONTEXT - Estudio como un PRO

## Resumen del Proyecto

**Estudio como un PRO** es una aplicación web progresiva (PWA) de aprendizaje inteligente diseñada para estudiantes adolescentes. La app permite a los usuarios transformar cualquier material de estudio (texto, imágenes o PDFs) en tarjetas de estudio interactivas (flashcards) generadas automáticamente mediante Inteligencia Artificial.

### Propósito Principal
Facilitar el estudio efectivo mediante la generación automática de tarjetas de memoria usando IA, implementando el sistema de repetición espaciada de Leitner, y proporcionando una experiencia de estudio gamificada con temporizador, puntuaciones y seguimiento de progreso.

### Problema que Resuelve
- **Ahorro de tiempo**: Elimina la necesidad de crear tarjetas de estudio manualmente
- **Estudio eficiente**: Implementa técnicas probadas de memorización (sistema Leitner)
- **Motivación**: Gamifica el proceso de aprendizaje con puntuaciones y métricas
- **Accesibilidad**: Funciona offline como PWA y no requiere instalación de apps nativas
- **Organización**: Gestiona múltiples colecciones de estudio con historial completo

---

## Tech Stack Actual

### Frontend Framework & Core
- **React 19.2.0** - Biblioteca UI principal
- **TypeScript 5.8.2** - Tipado estático
- **Vite 6.2.0** - Build tool y dev server
- **@vitejs/plugin-react 5.0.0** - Plugin de React para Vite

### Backend & Servicios
- **Netlify Functions** - Serverless functions para llamadas API
- **Google Gemini AI API (@google/genai 1.29.0)** - Generación de resúmenes y flashcards
  - Modelo usado: `gemini-2.5-flash`
  - Procesamiento de texto e imágenes
  - Respuestas estructuradas en JSON

### Almacenamiento & Persistencia
- **localStorage** - Persistencia local del navegador
  - Colecciones de flashcards
  - Historial de sesiones de estudio
  - Estado de sesiones en progreso (para reanudar)

### PWA & Service Worker
- **Service Worker personalizado** - Caché de recursos para funcionamiento offline
- **Web App Manifest** - Configuración PWA
- **Iconos 192x192 y 512x512** - Assets para instalación

### Audio
- **Web Audio API** - Generación programática de efectos de sonido
  - Sin dependencias externas de audio
  - Sonidos: tick, start, pause, timeUp, flip

### Estilos
- **Tailwind CSS** (vía clases inline) - Utility-first CSS
- **Gradientes cian-fucsia** - Identidad visual de la marca
- **Modo oscuro** - Esquema de colores slate-900/slate-800

### Build & Deploy
- **Netlify** - Plataforma de deployment
- **Environment Variables** - Gestión de API keys vía .env

---

## Arquitectura de Archivos

```
project/
│
├── index.html                    # Punto de entrada HTML principal
├── index.tsx                     # Punto de entrada React (renderiza App)
├── App.tsx                       # Componente principal de la aplicación
├── types.ts                      # Definiciones TypeScript centralizadas
│
├── components/                   # Componentes React reutilizables
│   ├── Flashcard.tsx            # Tarjeta de estudio con efecto 3D flip
│   └── Timer.tsx                # Temporizador configurable con controles
│
├── services/                     # Lógica de negocio y llamadas API
│   ├── geminiService.ts         # Cliente para Netlify Functions
│   └── soundService.ts          # Generación de sonidos con Web Audio API
│
├── netlify/
│   └── functions/               # Serverless functions (backend)
│       ├── generate-summary.ts  # Genera resumen del material con Gemini
│       └── generate-flashcards.ts # Genera flashcards con Gemini
│
├── icons/                        # Assets PWA
│   ├── icon-192x192.png
│   └── icon-512x512.png
│
├── docs/                         # Documentación del proyecto
│   └── PROJECT_CONTEXT.md       # Este archivo
│
├── config files                  # Configuración
│   ├── vite.config.ts           # Configuración de Vite
│   ├── tsconfig.json            # Configuración TypeScript
│   ├── netlify.toml             # Configuración Netlify
│   ├── package.json             # Dependencies y scripts
│   ├── .env                     # Variables de entorno
│   └── .gitignore               # Archivos ignorados por git
│
├── service-worker.js             # Service Worker para PWA
├── manifest.json                 # Web App Manifest
└── README.md                     # Instrucciones básicas
```

### Responsabilidades de Carpetas Clave

**`/components`**
- Componentes UI reutilizables y presentacionales
- Cada componente es autocontenido con su lógica de presentación
- Props tipadas con TypeScript

**`/services`**
- Capa de abstracción para APIs externas
- Lógica de negocio compartida
- No contiene JSX/componentes React

**`/netlify/functions`**
- Funciones serverless que actúan como backend
- Protegen la API key de Gemini
- Procesan las solicitudes de generación de contenido IA

---

## Funcionalidades Clave

### 1. Generación Automática de Material de Estudio
**User Story**: *Como estudiante, quiero subir mi material de estudio y obtener un resumen automático para optimizar mi tiempo.*

**Implementación**:
- Soporta entrada de texto manual, archivos de imagen y PDFs
- Llama a Gemini API vía Netlify Function `generate-summary`
- El resumen es editable antes de generar las tarjetas
- Procesamiento multimodal (texto + imagen)

**Archivos**: `App.tsx:144-159`, `netlify/functions/generate-summary.ts`, `services/geminiService.ts:32-49`

---

### 2. Creación de Flashcards con IA
**User Story**: *Como estudiante, quiero que la IA cree tarjetas de estudio automáticamente del resumen para no tenerlas que hacer manualmente.*

**Implementación**:
- Genera entre 5-20 flashcards basadas en el resumen
- Utiliza schema JSON estructurado para garantizar formato consistente
- Cada tarjeta tiene pregunta, respuesta y ID único
- Las respuestas están optimizadas para adolescentes

**Archivos**: `App.tsx:161-181`, `netlify/functions/generate-flashcards.ts`, `services/geminiService.ts:51-68`

---

### 3. Sistema Leitner de Repetición Espaciada
**User Story**: *Como estudiante, quiero clasificar las tarjetas según mi nivel de conocimiento para enfocarme en lo que más necesito repasar.*

**Implementación**:
- 4 categorías: `unseen`, `know`, `regular`, `dont_know`
- Feedback inmediato tras ver cada tarjeta
- Permite repetir sesiones enfocándose en tarjetas difíciles
- Estado persistido en localStorage

**Archivos**: `App.tsx:210-221`, `types.ts:7-14`

---

### 4. Temporizador Pomodoro Configurable
**User Story**: *Como estudiante, quiero un temporizador para mantener sesiones de estudio enfocadas y productivas.*

**Implementación**:
- Temporizador configurable (por defecto 5 minutos)
- Controles: play/pause, reset
- Barra de progreso visual
- Sonidos en últimos 5 segundos y al finalizar
- El tiempo se guarda al pausar la sesión

**Archivos**: `components/Timer.tsx`, `App.tsx:98-120`, `services/soundService.ts:57-134`

---

### 5. Gestión de Colecciones
**User Story**: *Como estudiante, quiero guardar y organizar mis tarjetas en colecciones para reutilizarlas después.*

**Implementación**:
- Crear colecciones nuevas con nombre personalizado
- Estudiar colecciones existentes
- Eliminar colecciones con confirmación de seguridad
- Auto-guardado con indicador visual
- Persistencia en localStorage (`flashcard-collections`)

**Archivos**: `App.tsx:257-287`, `App.tsx:350-397`, `types.ts:16-20`

---

### 6. Historial de Sesiones de Estudio
**User Story**: *Como estudiante, quiero ver mi historial de estudio para hacer seguimiento de mi progreso y rendimiento.*

**Implementación**:
- Registro automático al finalizar cada sesión
- Métricas: puntuación (1-10), tiempo empleado, distribución know/regular/dont_know
- Vista cronológica ordenada por fecha
- Persistencia en localStorage (`estudio-pro-history`)

**Archivos**: `App.tsx:399-436`, `types.ts:32-41`

---

### 7. Sistema de Puntuación
**User Story**: *Como estudiante, quiero ver mi puntuación para medir mi desempeño y motivarme a mejorar.*

**Implementación**:
- Algoritmo: `((know × 1) + (regular × 0.5)) / total × 10`
- Escala de 1 a 10 redondeada
- Mostrada al finalizar la sesión
- Guardada en el historial

**Archivos**: `App.tsx:183-208`

---

### 8. Reanudación de Sesiones
**User Story**: *Como estudiante, quiero poder cerrar la app y continuar mi sesión de estudio donde la dejé.*

**Implementación**:
- Detección automática de sesión en progreso al iniciar
- Guarda: estado de cajas Leitner, tiempo restante, resumen, texto original
- Modal de confirmación para reanudar o descartar
- Persistencia en localStorage (`estudio-pro-session`)

**Archivos**: `App.tsx:122-138`, `App.tsx:331-348`, `types.ts:22-30`

---

### 9. Efectos de Sonido Interactivos
**User Story**: *Como estudiante, quiero feedback auditivo para hacer la experiencia más inmersiva y saber cuándo el tiempo se acaba.*

**Implementación**:
- 5 sonidos generados programáticamente sin archivos externos:
  - **playStart**: Tono ascendente al iniciar timer
  - **playPause**: Tono descendente al pausar
  - **playTick**: Tick sutil en últimos 5 segundos
  - **playTimeUp**: Alerta cuando se acaba el tiempo
  - **playFlip**: Ruido filtrado al voltear tarjeta
- Usa Web Audio API (OscillatorNode, GainNode, BiquadFilter)

**Archivos**: `services/soundService.ts`

---

### 10. Progressive Web App (PWA)
**User Story**: *Como estudiante, quiero usar la app offline y poder instalarla como si fuera nativa.*

**Implementación**:
- Service Worker con estrategia de cache-first
- Manifest con nombre, iconos, colores de tema
- Instalable en escritorio y móvil
- Funciona completamente offline después de la primera carga

**Archivos**: `service-worker.js`, `manifest.json`, `icons/`

---

### 11. UI Responsive con Animaciones
**User Story**: *Como estudiante, quiero una interfaz bonita y fluida que funcione en móvil y escritorio.*

**Implementación**:
- Diseño responsive con breakpoints (sm:, md:)
- Animación 3D de flip en tarjetas (transform: rotateY)
- Transiciones suaves en botones y estados
- Gradientes cian-fucsia como identidad visual
- Tema oscuro con esquema de colores slate

**Archivos**: `App.tsx`, `components/Flashcard.tsx`

---

## Estado Actual

### Funcionalidades Completadas
- Generación automática de resúmenes y flashcards con IA
- Sistema Leitner completo con 4 categorías
- Temporizador Pomodoro con controles y sonidos
- Gestión CRUD de colecciones con auto-guardado
- Historial de sesiones con métricas y puntuaciones
- Reanudación de sesiones interrumpidas
- PWA funcional con soporte offline
- UI responsive y animada
- Efectos de sonido inmersivos
- Soporte multimodal (texto + imágenes + PDFs)

### Estado de Estabilidad
La aplicación está completamente funcional y sin errores conocidos graves.

### Pendientes / Posibles Mejoras Futuras
1. **Backend con base de datos real**: Migrar de localStorage a Supabase para sincronización cross-device
2. **Autenticación de usuarios**: Permitir múltiples usuarios y sincronización en la nube
3. **Estadísticas avanzadas**: Gráficos de progreso, streaks, análisis de rendimiento por tema
4. **Exportación de colecciones**: Permitir compartir o exportar tarjetas en formatos estándar (Anki, CSV)
5. **Modo de estudio avanzado**: Implementar verdadera repetición espaciada con algoritmo SM-2
6. **Colaboración**: Permitir compartir colecciones entre usuarios
7. **Más idiomas**: Soporte multiidioma (actualmente solo español)
8. **Reconocimiento de voz**: Responder tarjetas mediante voz
9. **Modo examen**: Generar tests de opción múltiple automáticos
10. **Integración con Google Drive**: Importar documentos directamente

### Limitaciones Conocidas
- **localStorage tiene límite de ~5-10MB**: Colecciones muy grandes pueden alcanzar este límite
- **Sin sincronización cross-device**: Los datos están atados al navegador/dispositivo
- **Dependencia de Gemini API**: Si la API falla, no se pueden generar tarjetas nuevas
- **Procesamiento en cliente de imágenes grandes**: Puede ser lento con archivos muy pesados

---

## Notas Técnicas Adicionales

### Gestión de Estado
- **No usa Redux ni Context API**: Todo el estado vive en `App.tsx` con hooks de React
- **useState para estado local**: Cada componente gestiona su estado presentacional
- **useEffect para persistencia**: Auto-guardado reactivo a cambios de estado
- **useRef**: Para referencias del input de archivo

### Patrones de Diseño
- **Lifting State Up**: El estado global está en App.tsx y se pasa via props
- **Render Props**: No se usan, solo props simples
- **Composición sobre herencia**: Componentes funcionales compuestos
- **Single Responsibility**: Cada archivo tiene una responsabilidad clara

### Seguridad
- **API Key protegida**: La clave de Gemini está en el servidor (Netlify Functions)
- **No hay autenticación**: La app es completamente pública y local
- **Sin sanitización de inputs**: Se confía en que Gemini no retorna contenido malicioso
- **localStorage sin cifrado**: Los datos son legibles en las DevTools del navegador

### Performance
- **Lazy loading**: No implementado (la app es suficientemente pequeña)
- **Code splitting**: No implementado
- **Memoization**: No se usa React.memo ni useMemo
- **Optimización de renderizados**: Podría mejorarse en sesiones con muchas tarjetas

### Testing
- **Sin tests automatizados**: No hay Jest, Vitest ni Playwright configurados
- **Sin linting estricto**: No hay ESLint ni Prettier configurados
- **Testing manual**: La app ha sido probada manualmente en Chrome, Firefox y Safari

---

## Variables de Entorno

```bash
# .env
API_KEY=<GEMINI_API_KEY>  # Clave de API de Google Gemini
```

**Importante**: La clave debe configurarse en Netlify para producción en el dashboard de variables de entorno.

---

## Scripts Disponibles

```json
{
  "dev": "vite",           // Inicia servidor de desarrollo en puerto 3000
  "build": "vite build",   // Genera build de producción en /dist
  "preview": "vite preview" // Previsualiza el build de producción
}
```

---

## Deployment

La aplicación está configurada para deployment en **Netlify**:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- **Environment variables**: `API_KEY` debe estar configurada en Netlify dashboard

---

## Conclusión

**Estudio como un PRO** es una aplicación de aprendizaje bien estructurada que combina tecnologías modernas (React, TypeScript, Vite, Netlify Functions, Gemini AI) para ofrecer una experiencia de estudio efectiva y gamificada. La arquitectura es simple pero efectiva, con clara separación de responsabilidades y código mantenible.

El proyecto está listo para producción, aunque hay margen para mejoras futuras en áreas como autenticación, sincronización cloud, estadísticas avanzadas y testing automatizado.
