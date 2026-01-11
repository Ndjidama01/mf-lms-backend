# 📚 Guide Complet - Modules Branches et Documents

## 📦 Modules Créés

### 1️⃣ Module Branches
Gestion complète des agences/branches du système.

### 2️⃣ Module Documents
Gestion avancée des documents avec upload, versions, OCR, et sécurité.

---

## 🏢 Module BRANCHES

### 📁 Fichiers Créés

```
src/modules/branches/
├── dto/
│   └── branch.dto.ts           # DTOs (Create, Update, Query)
├── branches.controller.ts       # Contrôleur REST
├── branches.service.ts          # Logique métier
└── branches.module.ts           # Module NestJS
```

### 🎯 Fonctionnalités

✅ **CRUD Complet**
- Créer une branche
- Lister avec filtres (pagination, recherche, région, statut)
- Voir détails d'une branche
- Mettre à jour
- Désactiver (soft delete)

✅ **Statistiques**
- Nombre d'utilisateurs (total/actifs)
- Nombre de clients (total/actifs)
- Nombre de prêts (total/actifs)
- Montant total décaissé
- Portfolio à risque (PAR30)

✅ **Utilitaires**
- Recherche par code
- Liste des régions
- Validation des contraintes

### 📋 API Endpoints

| Méthode | Endpoint | Description | Rôles Autorisés |
|---------|----------|-------------|-----------------|
| POST | `/branches` | Créer une branche | ADMIN, CEO |
| GET | `/branches` | Lister les branches | ADMIN, CEO, BOARD, BRANCH_MANAGER, HR, COMPLIANCE, AUDITOR |
| GET | `/branches/regions` | Liste des régions | ADMIN, CEO, BOARD, BRANCH_MANAGER, HR |
| GET | `/branches/:id` | Détails d'une branche | ADMIN, CEO, BOARD, BRANCH_MANAGER, HR, COMPLIANCE, AUDITOR |
| GET | `/branches/code/:code` | Recherche par code | ADMIN, CEO, BOARD, BRANCH_MANAGER, HR |
| GET | `/branches/:id/statistics` | Statistiques branche | ADMIN, CEO, BOARD, BRANCH_MANAGER, HR, COMPLIANCE |
| PATCH | `/branches/:id` | Mettre à jour | ADMIN, CEO |
| DELETE | `/branches/:id` | Désactiver | ADMIN |

### 📝 Exemples d'Utilisation

#### Créer une Branche
```bash
POST /branches
Authorization: Bearer {token}

{
  "code": "BR03",
  "name": "Central Branch",
  "address": "123 Main Street, Yaoundé",
  "phone": "+237222000000",
  "email": "central@mflms.com",
  "region": "Centre",
  "isActive": true
}
```

#### Lister avec Filtres
```bash
GET /branches?page=1&limit=10&region=Centre&isActive=true&search=Central
```

#### Obtenir les Statistiques
```bash
GET /branches/{branchId}/statistics

Response:
{
  "branch": {
    "id": "...",
    "code": "BR03",
    "name": "Central Branch",
    "region": "Centre"
  },
  "statistics": {
    "users": { "total": 15, "active": 12 },
    "customers": { "total": 450, "active": 380 },
    "loans": {
      "total": 120,
      "active": 85,
      "totalDisbursed": 50000000,
      "portfolioAtRisk30": 5
    }
  }
}
```

---

## 📄 Module DOCUMENTS

### 📁 Fichiers Créés

```
src/modules/documents/
├── dto/
│   └── document.dto.ts          # DTOs (Create, Update, Query, Version, LegalHold)
├── documents.controller.ts       # Contrôleur REST
├── documents.service.ts          # Logique métier
└── documents.module.ts           # Module NestJS
```

### 🎯 Fonctionnalités

#### ✅ Upload & Storage
- Upload multipart/form-data
- Validation de type de fichier (jpg, jpeg, png, pdf, doc, docx)
- Limite de taille configurable (défaut: 10MB)
- Stockage organisé par UUID
- Métadonnées complètes

#### ✅ Download & Preview
- Téléchargement sécurisé
- Prévisualisation inline (PDF, images)
- Vérification des permissions
- Logs d'accès automatiques

#### ✅ Versioning
- Historique complet des versions
- Upload de nouvelles versions
- Notes de version
- Identification de la version actuelle

#### ✅ OCR (Optical Character Recognition)
- Extraction de texte des documents
- Stockage du texte OCR
- Recherche dans le contenu
- Mise à jour manuelle possible

#### ✅ Sécurité & Audit
- Logs d'accès détaillés (VIEW, DOWNLOAD, DELETE)
- Legal hold (empêche la suppression)
- Soft delete
- Tracking IP et User Agent
- Permissions granulaires par rôle

#### ✅ Statistiques
- Par client ou par prêt
- Par type de document
- Par statut
- Taille totale de stockage

### 📋 API Endpoints

| Méthode | Endpoint | Description | Rôles Autorisés |
|---------|----------|-------------|-----------------|
| POST | `/documents/upload` | Upload un document | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, FIELD_OFFICER |
| GET | `/documents` | Lister les documents | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, AUDITOR |
| GET | `/documents/statistics` | Statistiques documents | ADMIN, CEO, BRANCH_MANAGER, COMPLIANCE, AUDITOR |
| GET | `/documents/:id` | Détails d'un document | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, AUDITOR |
| GET | `/documents/:id/download` | Télécharger | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, AUDITOR |
| GET | `/documents/:id/preview` | Prévisualiser | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, AUDITOR |
| GET | `/documents/:id/versions` | Liste des versions | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, AUDITOR |
| POST | `/documents/:id/versions` | Upload nouvelle version | ADMIN, BRANCH_MANAGER, LOAN_OFFICER |
| GET | `/documents/:id/ocr` | Texte OCR | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE |
| PATCH | `/documents/:id/ocr` | Mettre à jour OCR | ADMIN, COMPLIANCE |
| GET | `/documents/:id/access-logs` | Logs d'accès | ADMIN, COMPLIANCE, AUDITOR |
| PATCH | `/documents/:id/legal-hold` | Legal hold | ADMIN, COMPLIANCE |
| PATCH | `/documents/:id` | Mettre à jour metadata | ADMIN, BRANCH_MANAGER, COMPLIANCE |
| DELETE | `/documents/:id` | Supprimer (soft delete) | ADMIN, BRANCH_MANAGER |

### 📝 Exemples d'Utilisation

#### Upload d'un Document
```bash
POST /documents/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- file: [fichier binaire]
- documentType: NATIONAL_ID
- customerId: uuid-du-client
- description: "Carte d'identité nationale - recto"
- tags: ["kyc", "identity", "required"]
```

#### Télécharger un Document
```bash
GET /documents/{documentId}/download
Authorization: Bearer {token}

Response: File stream avec headers:
Content-Type: application/pdf
Content-Disposition: attachment; filename="national_id.pdf"
```

#### Prévisualiser un Document
```bash
GET /documents/{documentId}/preview
Authorization: Bearer {token}

Response: File stream avec headers:
Content-Type: application/pdf
Content-Disposition: inline; filename="national_id.pdf"
```

#### Upload d'une Nouvelle Version
```bash
POST /documents/{documentId}/versions
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- file: [nouveau fichier]
- notes: "Mise à jour avec scan de meilleure qualité"
```

#### Obtenir le Texte OCR
```bash
GET /documents/{documentId}/ocr
Authorization: Bearer {token}

Response:
{
  "documentId": "...",
  "fileName": "national_id.pdf",
  "ocrText": "REPUBLIQUE DU CAMEROUN\nCARTE NATIONALE D'IDENTITE...",
  "ocrProcessed": true
}
```

#### Appliquer un Legal Hold
```bash
PATCH /documents/{documentId}/legal-hold
Authorization: Bearer {token}

{
  "enabled": true,
  "reason": "Document sous enquête judiciaire - Affaire #12345"
}
```

#### Lister avec Filtres
```bash
GET /documents?customerId={uuid}&documentType=NATIONAL_ID&status=VERIFIED&page=1&limit=10
```

#### Obtenir les Logs d'Accès
```bash
GET /documents/{documentId}/access-logs
Authorization: Bearer {token}

Response:
{
  "logs": [
    {
      "id": "...",
      "action": "DOWNLOAD",
      "user": {
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@mflms.com"
      },
      "accessedAt": "2025-01-11T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

#### Statistiques Documents
```bash
GET /documents/statistics?customerId={uuid}

Response:
{
  "total": 25,
  "byStatus": [
    { "status": "VERIFIED", "_count": 15 },
    { "status": "PENDING", "_count": 8 },
    { "status": "REJECTED", "_count": 2 }
  ],
  "byType": [
    { "documentType": "NATIONAL_ID", "_count": 5 },
    { "documentType": "PROOF_OF_ADDRESS", "_count": 5 },
    { "documentType": "INCOME_PROOF", "_count": 8 }
  ],
  "totalSize": 25600000
}
```

---

## 🔐 Sécurité

### Permissions par Rôle

#### Branches
- **ADMIN, CEO** : Toutes opérations (CRUD complet)
- **BOARD, BRANCH_MANAGER, HR, COMPLIANCE, AUDITOR** : Lecture seule
- **Autres rôles** : Pas d'accès

#### Documents
- **ADMIN** : Toutes opérations
- **BRANCH_MANAGER, LOAN_OFFICER** : Upload, download, update, delete
- **COMPLIANCE** : Upload, download, OCR, legal hold, audit logs
- **FIELD_OFFICER** : Upload seulement
- **AUDITOR** : Lecture et audit logs

### Audit Trail

Toutes les actions sont loggées :
- ✅ VIEW - Consultation d'un document
- ✅ DOWNLOAD - Téléchargement
- ✅ DELETE - Suppression
- ✅ LEGAL_HOLD_SET - Application legal hold
- ✅ LEGAL_HOLD_REMOVED - Retrait legal hold

Chaque log contient :
- ID utilisateur
- Action effectuée
- Date et heure
- IP address
- User agent

---

## 📦 Installation

### 1. Installer les Dépendances

Toutes les dépendances sont déjà dans package.json :
```bash
npm install
```

### 2. Créer le Dossier Upload

```bash
mkdir -p uploads/documents
```

### 3. Configuration .env

```env
# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads/documents
```

### 4. Démarrer l'Application

```bash
npm run start:dev
```

---

## 🧪 Tests avec Postman/cURL

### Test Upload Document
```bash
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/document.pdf" \
  -F "documentType=NATIONAL_ID" \
  -F "customerId={uuid}" \
  -F "description=Carte nationale d'identité"
```

### Test Download
```bash
curl -X GET http://localhost:3000/api/v1/documents/{id}/download \
  -H "Authorization: Bearer {token}" \
  --output document.pdf
```

---

## 📊 Types de Documents Supportés

```typescript
enum DocumentType {
  NATIONAL_ID          // Carte d'identité nationale
  PASSPORT             // Passeport
  DRIVERS_LICENSE      // Permis de conduire
  PROOF_OF_ADDRESS     // Justificatif de domicile
  PHOTO                // Photo d'identité
  INCOME_PROOF         // Preuve de revenu
  BUSINESS_REGISTRATION // Enregistrement entreprise
  TAX_CERTIFICATE      // Certificat fiscal
  BANK_STATEMENT       // Relevé bancaire
  UTILITY_BILL         // Facture d'utilité
  LOAN_APPLICATION     // Demande de prêt
  LOAN_AGREEMENT       // Contrat de prêt
  COLLATERAL_DOCUMENT  // Document de garantie
  APPRAISAL_REPORT     // Rapport d'évaluation
  INSURANCE_POLICY     // Police d'assurance
  PAYMENT_RECEIPT      // Reçu de paiement
  FIELD_REPORT         // Rapport de terrain
  OTHER                // Autre
}
```

---

## 🚨 Gestion des Erreurs

### Erreurs Communes

#### Upload
- **413 Payload Too Large** : Fichier trop volumineux
- **422 Unprocessable Entity** : Type de fichier non supporté
- **404 Not Found** : Client/Prêt non trouvé

#### Download
- **404 Not Found** : Document ou fichier non trouvé sur le serveur
- **403 Forbidden** : Permissions insuffisantes

#### Legal Hold
- **403 Forbidden** : Impossible de supprimer un document sous legal hold

---

## 🎯 Bonnes Pratiques

### 1. Organisation des Documents
```
uploads/documents/
├── abc123def456.pdf    # UUID comme nom de fichier
├── xyz789ghi012.jpg
└── ...
```

### 2. Métadonnées Riches
Toujours fournir :
- `description` : Description claire
- `tags` : Tags pour recherche
- Lier au `customerId` ou `loanId`

### 3. Versioning
- Utilisez les versions au lieu de remplacer
- Ajoutez des notes explicatives
- La version actuelle est toujours accessible

### 4. Sécurité
- Vérifiez toujours les permissions
- Utilisez legal hold pour documents sensibles
- Consultez les logs d'accès régulièrement

---

## 🔄 Migration des Modules

### Ajouter dans app.module.ts

Déjà fait dans le fichier, mais voici la référence :

```typescript
import { BranchesModule } from './modules/branches/branches.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    // ...
    BranchesModule,
    DocumentsModule,
  ],
})
export class AppModule {}
```

---

## ✅ Checklist de Déploiement

- [ ] Dossier `uploads/documents` créé
- [ ] Variables d'environnement configurées (MAX_FILE_SIZE, UPLOAD_DEST)
- [ ] Permissions du dossier upload correctes (lecture/écriture)
- [ ] Tests upload/download fonctionnels
- [ ] Backup automatique du dossier uploads configuré
- [ ] Monitoring de l'espace disque
- [ ] Politique de rétention des documents définie
- [ ] Legal hold documenté dans les procédures

---

**Les modules Branches et Documents sont complets et prêts à l'emploi ! 🎉**
