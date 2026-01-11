# 🚀 Guide de Démarrage Rapide - MF-LMS Backend

## 📦 Ce que vous avez reçu

Un backend NestJS complet et professionnel avec :

✅ **4 modules fonctionnels** : Auth, Users, Customers, Loans
✅ **Workflow de prêt complet** avec gates de contrôle
✅ **Sécurité JWT** avec RBAC (9 rôles)
✅ **Base de données Prisma** avec 20+ tables
✅ **Documentation Swagger** automatique
✅ **Audit logging** intégré
✅ **Validation des données** complète
✅ **Architecture Clean** et scalable

---

## ⚡ Démarrage en 5 minutes

### 1️⃣ Installer les dépendances

```bash
cd mf-lms-backend
npm install
```

### 2️⃣ Configurer PostgreSQL

Créez une base de données :

```sql
CREATE DATABASE mf_lms;
```

### 3️⃣ Configurer l'environnement

Copiez `.env.example` vers `.env` et modifiez :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mf_lms?schema=public"
JWT_SECRET=changez-ce-secret-en-production
```

### 4️⃣ Initialiser la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate

# Insérer les données de test
npm run prisma:seed
```

### 5️⃣ Démarrer l'API

```bash
npm run start:dev
```

✅ API disponible sur : **http://localhost:3000/api/v1**
📚 Documentation : **http://localhost:3000/api/docs**

---

## 🔑 Comptes de Test

Tous les comptes utilisent le mot de passe : **Password123!**

| Email | Rôle | Utilisation |
|-------|------|-------------|
| **admin@mflms.com** | ADMIN | Administration complète |
| **officer1@mflms.com** | LOAN_OFFICER | Créer clients et prêts |
| **manager1@mflms.com** | BRANCH_MANAGER | Approuver et décaisser |
| **ceo@mflms.com** | CEO | Visualisation et approbations finales |

---

## 🎯 Tester l'API en 3 étapes

### Étape 1 : Se connecter

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "officer1@mflms.com",
    "password": "Password123!"
  }'
```

➜ **Copiez le `accessToken`** de la réponse

### Étape 2 : Créer un client

```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+243123456789",
    "email": "jean.dupont@example.com",
    "branchId": "COPIER_ID_DE_BRANCH"
  }'
```

### Étape 3 : Créer un prêt

```bash
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "COPIER_ID_CLIENT",
    "productName": "Micro Crédit Agricole",
    "purpose": "AGRICULTURE",
    "requestedAmount": 10000,
    "interestRate": 15.5,
    "interestRateType": "REDUCING_BALANCE",
    "tenure": 12,
    "repaymentFrequency": "MONTHLY",
    "loanOfficerId": "COPIER_ID_OFFICER",
    "branchId": "COPIER_ID_BRANCH"
  }'
```

---

## 📊 Workflow de Prêt - Exemple Complet

Voici un scénario complet du cycle de vie d'un prêt :

### 1. Créer le prêt (statut: DRAFT)
```
POST /api/v1/loans
```

### 2. Soumettre la demande (→ APPLICATION_SUBMITTED)
```
POST /api/v1/loans/:id/submit
Body: { "confirm": true }
```
⚠️ **Gate KYC** : Le KYC du client doit être COMPLETE

### 3. Créer l'évaluation (→ UNDER_APPRAISAL)
```
POST /api/v1/loans/:id/appraisal
Body: {
  "siteVisitDate": "2025-01-15",
  "monthlyIncome": 5000,
  "monthlyExpenses": 3000,
  "recommendedAmount": 9500,
  "recommendation": "APPROVE"
}
```

### 4. Finaliser l'évaluation (→ PENDING_APPROVAL)
```
POST /api/v1/loans/:id/appraisal/complete
```

### 5. Approuver le prêt (→ APPROVED)
```
POST /api/v1/loans/:id/approval
Body: {
  "level": "BRANCH_MANAGER",
  "decision": "APPROVED",
  "approvedAmount": 9500
}
```

### 6. Créer le décaissement
```
POST /api/v1/loans/:id/disbursement
Body: {
  "amount": 9500,
  "method": "BANK_TRANSFER",
  "accountNumber": "1234567890",
  "bankName": "ABC Bank"
}
```

### 7. Vérifier le décaissement
```
POST /api/v1/loans/:id/disbursement/verify
Body: { "verified": true }
```

### 8. Finaliser le décaissement (→ DISBURSED)
```
POST /api/v1/loans/:id/disbursement/complete
Body: {
  "confirm": true,
  "referenceNumber": "REF123456"
}
```

✅ **Le calendrier de remboursement est généré automatiquement !**

---

## 🗂️ Structure des Fichiers

```
mf-lms-backend/
├── prisma/
│   ├── schema.prisma       ← Modèle de données (20+ tables)
│   └── seed.ts             ← Données de test
│
├── src/
│   ├── common/             ← Code partagé
│   │   ├── decorators/     ← @CurrentUser(), @Roles(), @Public()
│   │   ├── guards/         ← JwtAuthGuard, RolesGuard
│   │   ├── interceptors/   ← AuditInterceptor
│   │   └── prisma/         ← PrismaService
│   │
│   ├── modules/
│   │   ├── auth/           ← Authentification JWT
│   │   ├── users/          ← Gestion utilisateurs
│   │   ├── customers/      ← Gestion clients + KYC
│   │   └── loans/          ← Cycle de vie complet des prêts
│   │
│   ├── app.module.ts       ← Module racine
│   └── main.ts             ← Point d'entrée
│
├── .env.example            ← Configuration
├── package.json            ← Dépendances
└── README.md               ← Documentation complète
```

---

## 🔐 Sécurité Implémentée

✅ **JWT avec refresh tokens**
✅ **RBAC sur tous les endpoints**
✅ **Validation des données (class-validator)**
✅ **Rate limiting (10 req/min par défaut)**
✅ **Helmet (headers sécurisés)**
✅ **Bcrypt (hashing passwords)**
✅ **Audit logging automatique**
✅ **Protection contre brute force** (verrouillage après 5 tentatives)

---

## 🎨 Fonctionnalités Clés

### 1. Workflow Enforcement (Gates de Contrôle)

Le système empêche les actions illégales :

- ❌ Pas de soumission sans KYC complet
- ❌ Pas d'approbation sans évaluation
- ❌ Pas de décaissement sans approbation
- ❌ Transitions d'état strictement contrôlées

### 2. RBAC Granulaire

9 rôles avec permissions spécifiques :

- **ADMIN** : Tout
- **CEO/BOARD** : Vue d'ensemble + approbations finales
- **BRANCH_MANAGER** : Gestion branche complète
- **LOAN_OFFICER** : Créer clients/prêts, évaluer
- **COMPLIANCE** : Vérifications KYC/risque
- **AUDITOR** : Accès logs d'audit
- **HR** : Gestion utilisateurs
- **FIELD_OFFICER** : Collecte données terrain

### 3. Génération Automatique

- ✅ ID clients : `BR01-25-00001`
- ✅ ID prêts : `LN-BR01-25-00001`
- ✅ Calendrier de remboursement (mensuel/hebdomadaire/etc.)
- ✅ Calculs d'intérêts (méthode reducing balance)

---

## 📚 Documentation Swagger

Accédez à la documentation interactive :

```
http://localhost:3000/api/docs
```

Fonctionnalités :
- ✅ Tous les endpoints documentés
- ✅ Schémas de requête/réponse
- ✅ Tester directement depuis l'interface
- ✅ Authentification Bearer intégrée

---

## 🧪 Commandes Utiles

```bash
# Développement
npm run start:dev          # Mode watch avec rechargement auto

# Base de données
npm run prisma:studio      # UI pour explorer la DB
npm run prisma:migrate     # Créer une nouvelle migration
npm run prisma:seed        # Réinitialiser les données de test

# Tests
npm run test               # Tests unitaires
npm run test:e2e           # Tests end-to-end
npm run test:cov           # Couverture

# Production
npm run build              # Compiler
npm run start:prod         # Démarrer en production
```

---

## 🚀 Prochaines Étapes Recommandées

### Phase 2 : Modules Avancés
- [ ] Documents Management (upload, OCR, versioning)
- [ ] Tasks & SLA Module
- [ ] EWS (Early Warning System)

### Phase 3 : Analytics
- [ ] KPI Engine
- [ ] HR Incentives
- [ ] Dashboards

### Phase 4 : Intégrations
- [ ] SMS Gateway
- [ ] Email Service
- [ ] Payment Gateway
- [ ] Mobile Money

### Phase 5 : Déploiement
- [ ] Docker/Docker Compose
- [ ] CI/CD Pipeline
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Production-ready config

---

## ❓ FAQ

### Q : Comment ajouter un nouvel utilisateur ?
**R :** Utilisez l'endpoint `/api/v1/users` (rôle ADMIN ou HR requis)

### Q : Puis-je changer les rôles disponibles ?
**R :** Oui, modifiez l'enum `UserRole` dans `prisma/schema.prisma`

### Q : Comment personnaliser le workflow de prêt ?
**R :** Modifiez `src/modules/loans/loans.service.ts` et l'enum `LoanStatus`

### Q : La base de données est-elle sauvegardée ?
**R :** Configurez des backups PostgreSQL réguliers en production

### Q : Comment déployer en production ?
**R :** 
1. `npm run build`
2. Configurez les variables d'environnement
3. `npm run start:prod`
4. Utilisez un process manager (PM2, systemd)
5. Configurez un reverse proxy (Nginx)

---

## 💡 Conseils de Développement

1. **Toujours tester avec Swagger** avant d'intégrer au frontend
2. **Vérifier les logs** en cas d'erreur (`console` dans l'API)
3. **Utiliser Prisma Studio** pour déboguer la base de données
4. **Respecter le workflow** : ne pas forcer les transitions d'état
5. **Tester chaque rôle** pour valider les permissions

---

## 📞 Support & Questions

Si vous avez des questions :

1. ✅ Consultez le **README.md** complet
2. ✅ Explorez la **documentation Swagger**
3. ✅ Vérifiez les **logs de l'application**
4. ✅ Utilisez **Prisma Studio** pour la DB

---

## ✨ Points Forts de cette API

🎯 **Architecture Clean** : Modulaire, scalable, maintenable
🔒 **Sécurité First** : JWT, RBAC, audit, validation
🚀 **Production-Ready** : Workflow enforcement, error handling
📚 **Bien Documentée** : Swagger auto-généré, README complet
🧪 **Testable** : Structure permettant tests unitaires et e2e
⚡ **Performante** : Prisma optimisé, requêtes efficaces

---

**🎉 Félicitations ! Vous avez maintenant un backend professionnel et complet pour votre système de microfinance !**

Bon développement ! 🚀
