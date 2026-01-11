# MF-LMS Backend API

## 🏦 Microfinance Loan Management System - Backend

API REST sécurisée construite avec **NestJS** et **Prisma** pour la gestion complète du cycle de vie des prêts de microfinance, incluant la gestion des clients, le KYC, les approbations, les décaissements et le suivi.

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Structure du Projet](#-structure-du-projet)
- [Modules API](#-modules-api)
- [Workflow de Prêt](#-workflow-de-prêt)
- [Sécurité](#-sécurité)
- [Tests](#-tests)
- [Documentation API](#-documentation-api)

---

## ✨ Fonctionnalités

### Module d'Authentification
- ✅ Inscription et connexion utilisateur
- ✅ JWT avec tokens de rafraîchissement
- ✅ Protection contre les attaques par force brute (verrouillage après 5 tentatives)
- ✅ Changement de mot de passe sécurisé
- ✅ Contrôle d'accès basé sur les rôles (RBAC)

### Module Utilisateurs
- ✅ Gestion complète des utilisateurs (CRUD)
- ✅ 9 rôles différents : ADMIN, CEO, BOARD, BRANCH_MANAGER, LOAN_OFFICER, HR, COMPLIANCE, AUDITOR, FIELD_OFFICER
- ✅ Affectation aux branches
- ✅ Statistiques des performances utilisateur

### Module Clients
- ✅ Gestion des prospects et clients (CRUD)
- ✅ Profil KYC complet avec vérification
- ✅ Profil de risque avec scoring
- ✅ Conversion prospect → client
- ✅ Historique client (prêts, documents)
- ✅ Champ NIU pour données personnalisées

### Module Prêts (Lifecycle Complet)
- ✅ **Création de demande** (DRAFT)
- ✅ **Soumission** (APPLICATION_SUBMITTED) avec validation KYC
- ✅ **Évaluation** (UNDER_APPRAISAL) avec visite sur site et analyse
- ✅ **Approbation multi-niveaux** (PENDING_APPROVAL → APPROVED)
- ✅ **Décaissement contrôlé** avec vérification
- ✅ **Génération automatique** du calendrier de remboursement
- ✅ **Clôture** avec notation finale

### Sécurité & Audit
- ✅ Authentification JWT
- ✅ Guards RBAC sur tous les endpoints
- ✅ Logging d'audit automatique
- ✅ Validation des données (class-validator)
- ✅ Rate limiting
- ✅ Helmet pour headers de sécurité

### Workflow Enforcement
- ✅ **KYC Gate**: Pas de soumission sans KYC complet
- ✅ **Appraisal Gate**: Pas d'approbation sans évaluation
- ✅ **Approval Gate**: Pas de décaissement sans approbation
- ✅ **Disbursement Gate**: Vérifications multiples avant décaissement
- ✅ Transitions d'état contrôlées

---

## 🛠 Technologies

- **Framework**: NestJS 10.x
- **Langage**: TypeScript 5.x
- **Base de données**: PostgreSQL
- **ORM**: Prisma 5.x
- **Authentification**: JWT (Passport)
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator & class-transformer
- **Sécurité**: Helmet, bcrypt, rate limiting

---

## 📦 Prérequis

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x
- Git

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd mf-lms-backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer PostgreSQL

Créez une base de données PostgreSQL :

```sql
CREATE DATABASE mf_lms;
CREATE USER mf_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mf_lms TO mf_user;
```

### 4. Configuration de l'environnement

Copiez le fichier `.env.example` vers `.env` et configurez :

```bash
cp .env.example .env
```

Éditez le fichier `.env` :

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL="postgresql://mf_user:your_password@localhost:5432/mf_lms?schema=public"

# JWT
JWT_SECRET=votre-secret-jwt-tres-securise-changez-le-en-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=votre-refresh-secret-tres-securise
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# CORS
CORS_ORIGIN=http://localhost:4200
```

### 5. Générer Prisma Client

```bash
npm run prisma:generate
```

### 6. Exécuter les migrations

```bash
npm run prisma:migrate
```

### 7. Seed la base de données

```bash
npm run prisma:seed
```

Cela créera 3 branches et 8 utilisateurs de test.

---

## 🎯 Démarrage

### Mode développement

```bash
npm run start:dev
```

L'API sera disponible sur : `http://localhost:3000/api/v1`

### Mode production

```bash
npm run build
npm run start:prod
```

### Prisma Studio (UI pour la base de données)

```bash
npm run prisma:studio
```

---

## 📁 Structure du Projet

```
mf-lms-backend/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   └── seed.ts                # Script de seed
├── src/
│   ├── common/                # Code partagé
│   │   ├── decorators/        # Décorateurs personnalisés
│   │   ├── guards/            # Guards d'authentification et autorisation
│   │   ├── interceptors/      # Intercepteurs (audit)
│   │   └── prisma/            # Service Prisma
│   ├── modules/               # Modules fonctionnels
│   │   ├── auth/              # Authentification
│   │   ├── users/             # Gestion des utilisateurs
│   │   ├── customers/         # Gestion des clients
│   │   └── loans/             # Gestion des prêts
│   ├── app.module.ts          # Module racine
│   └── main.ts                # Point d'entrée
├── .env.example               # Exemple de configuration
├── nest-cli.json              # Configuration NestJS
├── package.json               # Dépendances
├── tsconfig.json              # Configuration TypeScript
└── README.md                  # Documentation
```

---

## 🔌 Modules API

### 1. Auth Module (`/api/v1/auth`)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/auth/login` | POST | Connexion utilisateur | Public |
| `/auth/register` | POST | Inscription | Public |
| `/auth/refresh` | POST | Rafraîchir le token | Public |
| `/auth/logout` | POST | Déconnexion | Requis |
| `/auth/change-password` | POST | Changer mot de passe | Requis |
| `/auth/profile` | GET | Profil utilisateur | Requis |

### 2. Users Module (`/api/v1/users`)

| Endpoint | Méthode | Description | Rôles autorisés |
|----------|---------|-------------|-----------------|
| `/users` | POST | Créer utilisateur | ADMIN, HR |
| `/users` | GET | Liste des utilisateurs | ADMIN, HR, BRANCH_MANAGER |
| `/users/:id` | GET | Détails utilisateur | ADMIN, HR, BRANCH_MANAGER |
| `/users/:id` | PATCH | Modifier utilisateur | ADMIN, HR |
| `/users/:id` | DELETE | Désactiver utilisateur | ADMIN |
| `/users/:id/assign-branch` | POST | Affecter à une branche | ADMIN, HR, BRANCH_MANAGER |
| `/users/:id/stats` | GET | Statistiques utilisateur | Tous |

### 3. Customers Module (`/api/v1/customers`)

| Endpoint | Méthode | Description | Rôles autorisés |
|----------|---------|-------------|-----------------|
| `/customers` | POST | Créer client/prospect | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/customers` | GET | Liste des clients | LOAN_OFFICER, BRANCH_MANAGER, ADMIN, COMPLIANCE, AUDITOR |
| `/customers/:id` | GET | Détails client | LOAN_OFFICER, BRANCH_MANAGER, ADMIN, COMPLIANCE, AUDITOR |
| `/customers/:id` | PATCH | Modifier client | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/customers/:id` | DELETE | Désactiver client | BRANCH_MANAGER, ADMIN |
| `/customers/:id/convert-to-customer` | POST | Convertir prospect | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/customers/:id/kyc` | PATCH | Mettre à jour KYC | LOAN_OFFICER, BRANCH_MANAGER, COMPLIANCE, ADMIN |
| `/customers/:id/risk-profile` | PATCH | Mettre à jour risque | LOAN_OFFICER, BRANCH_MANAGER, COMPLIANCE, ADMIN |
| `/customers/:id/history` | GET | Historique client | LOAN_OFFICER, BRANCH_MANAGER, ADMIN, COMPLIANCE, AUDITOR |

### 4. Loans Module (`/api/v1/loans`)

| Endpoint | Méthode | Description | Rôles autorisés |
|----------|---------|-------------|-----------------|
| `/loans` | POST | Créer demande | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/loans` | GET | Liste des prêts | LOAN_OFFICER, BRANCH_MANAGER, ADMIN, COMPLIANCE, AUDITOR, CEO |
| `/loans/:id` | GET | Détails prêt | LOAN_OFFICER, BRANCH_MANAGER, ADMIN, COMPLIANCE, AUDITOR |
| `/loans/:id` | PATCH | Modifier prêt (DRAFT) | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/loans/:id/submit` | POST | Soumettre demande | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/loans/:id/appraisal` | POST | Créer évaluation | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/loans/:id/appraisal` | PATCH | Modifier évaluation | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/loans/:id/appraisal/complete` | POST | Finaliser évaluation | LOAN_OFFICER, BRANCH_MANAGER, ADMIN |
| `/loans/:id/approval` | POST | Décision d'approbation | BRANCH_MANAGER, ADMIN, CEO |
| `/loans/:id/disbursement` | POST | Créer décaissement | BRANCH_MANAGER, ADMIN |
| `/loans/:id/disbursement/verify` | POST | Vérifier décaissement | BRANCH_MANAGER, COMPLIANCE, ADMIN |
| `/loans/:id/disbursement/complete` | POST | Finaliser décaissement | BRANCH_MANAGER, ADMIN |
| `/loans/:id/close` | POST | Clôturer prêt | BRANCH_MANAGER, ADMIN |

---

## 🔄 Workflow de Prêt

Le système applique un workflow strict avec des **gates de contrôle** :

```
1. DRAFT
   ↓ [Submit - KYC Gate]
   
2. APPLICATION_SUBMITTED
   ↓ [Create Appraisal]
   
3. UNDER_APPRAISAL
   ↓ [Complete Appraisal - Appraisal Gate]
   
4. PENDING_APPROVAL
   ↓ [Approve - Approval Gate]
   
5. APPROVED / APPROVED_WITH_CONDITIONS
   ↓ [Create Disbursement]
   ↓ [Verify Disbursement]
   ↓ [Complete Disbursement - Disbursement Gate]
   
6. DISBURSED → ACTIVE
   ↓ [Repayment Schedule Generated]
   
7. CLOSED
```

### Gates de Contrôle

1. **KYC Gate** : Le KYC doit être COMPLETE avant de soumettre
2. **Appraisal Gate** : L'évaluation doit être COMPLETED avec recommandation avant approbation
3. **Approval Gate** : Au moins une approbation APPROVED requise avant décaissement
4. **Disbursement Gate** : Vérification requise avant finalisation du décaissement

---

## 🔐 Sécurité

### Authentification

- JWT avec tokens d'accès et de rafraîchissement
- Tokens d'accès : durée de vie courte (1 jour par défaut)
- Tokens de rafraîchissement : durée de vie longue (7 jours)
- Verrouillage du compte après 5 tentatives échouées (15 minutes)

### Autorisation (RBAC)

Hiérarchie des rôles :

1. **ADMIN** : Accès complet
2. **CEO / BOARD** : Lecture seule, approbations de haut niveau
3. **BRANCH_MANAGER** : Gestion complète de la branche
4. **LOAN_OFFICER** : Gestion des clients et prêts
5. **HR** : Gestion des utilisateurs
6. **COMPLIANCE** : Vérifications et validations
7. **AUDITOR** : Accès en lecture, logs d'audit
8. **FIELD_OFFICER** : Collecte de données terrain

### Audit Logging

Toutes les actions critiques sont loguées :
- Qui a fait quoi
- Quand
- Sur quelle entité
- Avec quelles valeurs (avant/après)
- IP et User-Agent

---

## 📖 Documentation API

### Swagger UI

Une fois l'application démarrée, accédez à la documentation interactive :

```
http://localhost:3000/api/docs
```

### Exemples de Requêtes

#### 1. Connexion

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mflms.com",
    "password": "Password123!"
  }'
```

Réponse :
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@mflms.com",
    "role": "ADMIN"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": "1d"
}
```

#### 2. Créer un Client

```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "branchId": "branch-uuid"
  }'
```

#### 3. Créer un Prêt

```bash
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-uuid",
    "productName": "Micro Business Loan",
    "purpose": "AGRICULTURE",
    "requestedAmount": 10000,
    "interestRate": 15.5,
    "interestRateType": "REDUCING_BALANCE",
    "tenure": 12,
    "repaymentFrequency": "MONTHLY",
    "loanOfficerId": "officer-uuid",
    "branchId": "branch-uuid"
  }'
```

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture
npm run test:cov
```

---

## 👥 Comptes de Test

Après le seed, 8 comptes sont disponibles (mot de passe : `Password123!`) :

| Email | Rôle | Branche |
|-------|------|---------|
| admin@mflms.com | ADMIN | Head Office |
| ceo@mflms.com | CEO | Head Office |
| manager1@mflms.com | BRANCH_MANAGER | Downtown Branch |
| officer1@mflms.com | LOAN_OFFICER | Downtown Branch |
| officer2@mflms.com | LOAN_OFFICER | Suburban Branch |
| hr@mflms.com | HR | Head Office |
| compliance@mflms.com | COMPLIANCE | Head Office |
| auditor@mflms.com | AUDITOR | Head Office |

---

## 🚀 Prochaines Étapes

Les modules suivants seront implémentés dans les prochaines phases :

- ✅ **Phase 1** : Auth, Users, Customers, Loans (TERMINÉ)
- 📝 **Phase 2** : Documents, Tasks, EWS Alerts
- 📝 **Phase 3** : KPI Engine, HR Incentives
- 📝 **Phase 4** : BI/Reporting, Dashboards
- 📝 **Phase 5** : Integrations (SMS, Email, Payment Gateway)

---

## 📞 Support

Pour toute question ou problème :

1. Consultez la documentation Swagger : `http://localhost:3000/api/docs`
2. Vérifiez les logs de l'application
3. Consultez les logs Prisma Studio pour la base de données

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

**🎉 Félicitations ! Votre backend MF-LMS est prêt à être utilisé !**
