# CFA Express

Application React + PWA pour conversion CFA, avec mode hors ligne et endpoint IA securise cote serveur.

## Prerequis

- Node.js 20+

## Configuration

1. Installer les dependances:
   `npm install`
2. Ajouter la cle Gemini dans `.env.local`:
   `GEMINI_API_KEY=...`

## Developpement local

1. Terminal 1 (frontend Vite):
   `npm run dev`
2. Terminal 2 (API locale securisee):
   `npm run dev:api`

Le frontend est servi sur `http://localhost:5173` et les appels `/api/*` sont proxifies vers `http://localhost:3000`.

## Build et deploiement

1. Build production:
   `npm run build`
2. Demarrage serveur production (sert `dist/` + API `/api/insight`):
   `npm start`

Variables d'environnement en production:
- `GEMINI_API_KEY` (obligatoire)
- `GEMINI_MODEL` (optionnel, defaut: `gemini-2.5-flash`)
