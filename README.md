# HabbUP — Página de Mantenimiento v2

Stack: React 18 + Vite 5 + Express (Node.js)

## Inicio rápido

```bash
npm install
npm run dev
```

- **Frontend** → http://localhost:3000  
- **API** → http://localhost:3001/api/changelog  
- **Admin** → http://localhost:3000/admin

## Credenciales admin por defecto

| Campo | Valor |
|-------|-------|
| Usuario | `Kryon` |
| Contraseña | `33476373` |

Puedes cambiarlas con variables de entorno:
```
ADMIN_USER=tuUsuario
ADMIN_PASS=tuContraseña
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia API + Vite simultáneamente |
| `npm run build` | Compila el frontend |
| `npm start` | Inicia solo el servidor Express (sirve `dist/`) |

## Deploy en servidor (Railway / Render / VPS)

```bash
npm run build
npm start          # Express sirve dist/ + API en el mismo puerto
```

## Deploy en Vercel

> ⚠️ Vercel usa un filesystem efímero — los cambios en `changelog.json` no persisten entre deploys. Para producción en Vercel, reemplaza la lectura/escritura de archivos en `server/index.js` con Vercel KV, PlanetScale, o MongoDB Atlas.

## Estructura

```
habbup-maintenance/
├── index.html
├── vite.config.js          ← proxy /api → :3001
├── vercel.json
├── package.json
├── server/
│   ├── index.js            ← Express API
│   └── data/
│       └── changelog.json  ← datos persistentes
└── src/
    ├── main.jsx
    ├── App.jsx             ← rutas: / y /admin
    ├── index.css
    ├── MaintenancePage.jsx
    ├── MaintenancePage.css
    └── components/
        ├── ChangelogModal.jsx
        ├── ChangelogModal.css
        ├── AdminPanel.jsx
        └── AdminPanel.css
```
