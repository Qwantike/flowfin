# FlowFin

**FlowFin** est une application web pour gérer facilement votre budget et votre patrimoine. Elle permet de visualiser les flux financiers (revenus et dépenses), de suivre vos transactions et de gérer vos actifs avec une interface simple et moderne.

---

## Table des matières

- [FlowFin](#flowfin)
  - [Table des matières](#table-des-matières)
  - [Fonctionnalités](#fonctionnalités)
  - [Technologies](#technologies)
  - [Installation](#installation)
    - [Prérequis](#prérequis)
    - [Étapes](#étapes)
  - [Configuration](#configuration)
  - [Démarrage](#démarrage)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [Structure du projet](#structure-du-projet)
  - [Contribuer](#contribuer)
  - [Licence](#licence)

---

## Fonctionnalités

* Gestion des transactions : revenus, dépenses et solde mensuel
* Visualisation interactive des flux financiers
* Gestion des actifs et du patrimoine
* Authentification sécurisée avec token JWT
* Support multi-périodes : vue par mois ou par année
* Interface responsive et moderne avec Tailwind CSS

---

## Technologies

* **Frontend** : React, TypeScript, Tailwind CSS, D3.js
* **Backend** : Node.js, Express, PostgreSQL
* **API** : REST
* **Outils** : Vite, npm, PM2 pour le déploiement

---

## Installation

### Prérequis

* Node.js ≥ 18
* PostgreSQL ≥ 14
* npm

### Étapes

1. **Cloner le dépôt**

```bash
git clone https://github.com/<votre-utilisateur>/flowfin.git
cd flowfin
```

2. **Installer les dépendances**

```bash
npm install
```

---

## Configuration

1. Créer un fichier `.env` à la racine du projet.
2. Ajouter les variables nécessaires pour le front et le back, par exemple :

```env
VITE_API_URL=http://localhost:4000/api
DB_HOST=localhost
DB_PORT=5432
DB_USER=<votre-utilisateur>
DB_PASSWORD=<votre-mot-de-passe>
DB_NAME=flowfin
JWT_SECRET=<votre-secret-pour-jwt>
```

> Remplacer `<votre-utilisateur>`, `<votre-mot-de-passe>` et `<votre-secret-pour-jwt>` par vos informations locales.

---

## Démarrage

### Backend

```bash
node server/index.js
```

Le serveur écoute par défaut sur le port `4000`.

### Frontend

```bash
npm run dev
```

Le front sera disponible sur `http://localhost:5173`.

---

## Structure du projet

```
flowfin/
│
├─ App.tsx
├─ index.html
├─ index.tsx
├─ services/api.ts
│
├─ server/
│  ├─ index.js
│  ├─ db.js
│  ├─ middleware/auth.js
│  ├─ controllers/
│     ├─ appController.js
│     └─ authController.js
│
├─ components/
│  ├─ AssetForm.tsx
│  ├─ AssetList.tsx
│  ├─ AuthForm.tsx
│  ├─ CurrentAccountCard.tsx
│  ├─ FinancialFlowChart.tsx
│  ├─ Home.tsx
│  ├─ MonthSelector.tsx
│  ├─ ProfileForm.tsx
│  ├─ SummaryCards.tsx
│  ├─ TransactionForm.tsx
│  ├─ TransactionList.tsx
│  └─ WealthDashboard.tsx
│
└─ components/ui/
   └─ button.jsx
```

---

## Contribuer

1. Fork le dépôt
2. Créer une branche `feature/ma-fonctionnalité`
3. Commit vos modifications
4. Push vers votre fork
5. Ouvrir une Pull Request

---

## Licence

MIT License © 2025 FlowFin
