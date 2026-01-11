# 🎭 Rôles et 🗂️ Entités du Système MF-LMS

## 📋 Table des Matières
1. [Rôles Utilisateurs (RBAC)](#-rôles-utilisateurs-rbac)
2. [Entités de la Base de Données](#-entités-de-la-base-de-données)
3. [Enums (Types)](#-enums-types)
4. [Relations Entre Entités](#-relations-entre-entités)

---

## 👥 Rôles Utilisateurs (RBAC)

Le système implémente **9 rôles** avec des permissions spécifiques :

### 1. ADMIN (Administrateur Système)
**Permissions** : Accès complet à toutes les fonctionnalités
- ✅ Gestion complète des utilisateurs
- ✅ Gestion des branches
- ✅ Configuration système
- ✅ Accès à tous les modules
- ✅ Peut effectuer toutes les opérations

**Cas d'usage** : Administrateur technique du système

---

### 2. CEO (Directeur Général)
**Permissions** : Vue d'ensemble et approbations stratégiques
- ✅ Lecture de tous les dashboards
- ✅ Approbation des prêts > montant seuil
- ✅ Consultation des rapports
- ✅ Vue sur toutes les branches
- ❌ Pas de modifications opérationnelles

**Cas d'usage** : Direction générale, supervision stratégique

---

### 3. BOARD (Conseil d'Administration)
**Permissions** : Vue d'ensemble et rapports
- ✅ Lecture des dashboards stratégiques
- ✅ Consultation des rapports financiers
- ✅ Approbation des politiques
- ❌ Pas d'accès aux opérations quotidiennes

**Cas d'usage** : Membres du conseil d'administration

---

### 4. BRANCH_MANAGER (Directeur de Branche)
**Permissions** : Gestion complète de la branche
- ✅ Gestion des clients de la branche
- ✅ Approbation des prêts
- ✅ Décaissement des prêts
- ✅ Gestion de l'équipe de la branche
- ✅ Rapports de branche
- ✅ Affectation des tâches
- ❌ Limité à sa branche

**Cas d'usage** : Responsable opérationnel d'une agence

---

### 5. LOAN_OFFICER (Agent de Crédit)
**Permissions** : Gestion des clients et prêts
- ✅ Créer et modifier les clients
- ✅ Créer des demandes de prêt
- ✅ Effectuer les évaluations (appraisals)
- ✅ Mettre à jour le KYC
- ✅ Visites sur site
- ✅ Suivi des remboursements
- ❌ Ne peut pas approuver ou décaisser

**Cas d'usage** : Agent de terrain, relation client directe

---

### 6. HR (Ressources Humaines)
**Permissions** : Gestion du personnel
- ✅ Créer et modifier les utilisateurs
- ✅ Affecter aux branches
- ✅ Gestion des rôles et permissions
- ✅ Consultation des KPI du personnel
- ✅ Gestion des primes et sanctions
- ❌ Pas d'accès aux opérations de crédit

**Cas d'usage** : Département RH

---

### 7. COMPLIANCE (Conformité)
**Permissions** : Vérification et validation
- ✅ Vérification KYC
- ✅ Validation des documents
- ✅ Vérification des décaissements
- ✅ Audit des processus
- ✅ Génération de rapports de conformité
- ❌ Ne peut pas créer de prêts

**Cas d'usage** : Contrôle de conformité et risque

---

### 8. AUDITOR (Auditeur)
**Permissions** : Consultation et audit
- ✅ Accès en lecture à tous les modules
- ✅ Consultation des logs d'audit
- ✅ Génération de rapports d'audit
- ✅ Analyse des risques
- ❌ Aucune modification possible

**Cas d'usage** : Audit interne/externe

---

### 9. FIELD_OFFICER (Agent de Terrain)
**Permissions** : Collecte de données terrain
- ✅ Capturer les informations clients
- ✅ Upload de documents
- ✅ Visites de site
- ✅ Photos et notes terrain
- ✅ Suivi de monitoring
- ❌ Pas d'accès aux approbations

**Cas d'usage** : Agent mobile, collecte de données

---

## 🗂️ Entités de la Base de Données

Le système comprend **20+ tables** organisées en modules :

### 📁 Module Identity & Access (2 tables)

#### 1. **User** (Utilisateurs)
```typescript
{
  id: UUID
  email: String (unique)
  username: String (unique)
  password: String (hashed)
  firstName: String
  lastName: String
  phone: String
  role: UserRole (enum)
  status: UserStatus (enum)
  branchId: UUID (foreign key)
  lastLogin: DateTime
  loginAttempts: Int
  lockedUntil: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 2. **Branch** (Branches/Agences)
```typescript
{
  id: UUID
  code: String (unique) // Ex: HQ, BR01
  name: String
  address: String
  phone: String
  email: String
  region: String
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### 👥 Module Customers (3 tables)

#### 3. **Customer** (Clients)
```typescript
{
  id: UUID
  customerId: String (unique) // BR01-25-00001
  type: CustomerType (enum)
  status: CustomerStatus (enum)
  
  // Informations personnelles
  firstName: String
  lastName: String
  middleName: String
  dateOfBirth: DateTime
  gender: String
  nationalId: String
  phone: String
  email: String
  address: String
  city: String
  district: String
  
  // Profil économique
  occupation: String
  monthlyIncome: Decimal
  businessName: String
  businessType: String
  
  // Métadonnées
  branchId: UUID
  niuData: JSON (données personnalisées)
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID
}
```

#### 4. **KYCProfile** (Profil KYC)
```typescript
{
  id: UUID
  customerId: UUID (unique, foreign key)
  status: KYCStatus (enum)
  
  // Checklist documents
  hasNationalId: Boolean
  hasProofOfAddress: Boolean
  hasPhotoProof: Boolean
  hasIncomeProof: Boolean
  hasBusinessDocs: Boolean
  
  // Vérification
  verifiedAt: DateTime
  verifiedBy: UUID
  expiryDate: DateTime
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 5. **RiskProfile** (Profil de Risque)
```typescript
{
  id: UUID
  customerId: UUID (unique, foreign key)
  riskLevel: RiskLevel (enum)
  creditScore: Int
  
  // Facteurs de risque
  delinquencyHistory: Boolean
  multipleBorrowing: Boolean
  politicalExposure: Boolean
  highRiskOccupation: Boolean
  
  // Évaluation
  assessmentNotes: String
  assessedAt: DateTime
  assessedBy: UUID
  nextReviewDate: DateTime
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### 💰 Module Loans (5 tables)

#### 6. **Loan** (Prêts)
```typescript
{
  id: UUID
  loanId: String (unique) // LN-BR01-25-00001
  
  // Relations
  customerId: UUID
  loanOfficerId: UUID
  branchId: UUID
  
  // Détails du prêt
  productName: String
  purpose: LoanPurpose (enum)
  requestedAmount: Decimal
  approvedAmount: Decimal
  interestRate: Decimal
  interestRateType: InterestRateType (enum)
  tenure: Int (en mois)
  repaymentFrequency: RepaymentFrequency (enum)
  
  // Statut et workflow
  status: LoanStatus (enum)
  
  // Dates
  applicationDate: DateTime
  approvalDate: DateTime
  disbursementDate: DateTime
  maturityDate: DateTime
  closedDate: DateTime
  
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID
}
```

#### 7. **Appraisal** (Évaluation)
```typescript
{
  id: UUID
  loanId: UUID (unique, foreign key)
  status: AppraisalStatus (enum)
  
  // Visite sur site
  siteVisitDate: DateTime
  siteVisitNotes: String
  siteVisitPhotos: String[]
  
  // Analyse financière
  monthlyIncome: Decimal
  monthlyExpenses: Decimal
  netCashFlow: Decimal
  debtServiceRatio: Decimal
  
  // Scoring
  creditScore: Int
  scoringNotes: String
  
  // Recommandation
  recommendedAmount: Decimal
  recommendedTenure: Int
  appraisalNotes: String
  recommendation: String // APPROVE, REJECT, CONDITIONAL
  
  appraisedBy: UUID
  appraisedAt: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 8. **ApprovalDecision** (Décision d'Approbation)
```typescript
{
  id: UUID
  loanId: UUID (foreign key)
  
  level: ApprovalLevel (enum)
  decision: ApprovalDecisionType (enum)
  approvedAmount: Decimal
  
  conditions: String[] // Conditions d'approbation
  notes: String
  minutes: String // Procès-verbal
  
  approvedBy: UUID
  approvedAt: DateTime
}
```

#### 9. **Disbursement** (Décaissement)
```typescript
{
  id: UUID
  loanId: UUID (unique, foreign key)
  
  amount: Decimal
  method: DisbursementMethod (enum)
  status: DisbursementStatus (enum)
  
  // Détails de paiement
  accountNumber: String
  accountName: String
  bankName: String
  referenceNumber: String
  
  // Vérification
  verifiedBy: UUID
  verifiedAt: DateTime
  disbursedBy: UUID
  disbursedAt: DateTime
  
  notes: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 10. **RepaymentSchedule** (Calendrier de Remboursement)
```typescript
{
  id: UUID
  loanId: UUID (foreign key)
  
  installmentNumber: Int
  dueDate: DateTime
  
  // Montants prévus
  principalAmount: Decimal
  interestAmount: Decimal
  totalAmount: Decimal
  
  // Montants payés
  paidPrincipal: Decimal
  paidInterest: Decimal
  paidTotal: Decimal
  
  // Soldes restants
  outstandingPrincipal: Decimal
  outstandingInterest: Decimal
  outstandingTotal: Decimal
  
  status: RepaymentStatus (enum)
  
  paymentDate: DateTime
  daysOverdue: Int
  penaltyAmount: Decimal
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### 📄 Module Documents (3 tables)

#### 11. **Document** (Documents)
```typescript
{
  id: UUID
  fileName: String
  fileType: String
  fileSize: Int
  filePath: String
  documentType: DocumentType (enum)
  status: DocumentStatus (enum)
  
  // Relations
  customerId: UUID (optional)
  loanId: UUID (optional)
  
  // Métadonnées
  description: String
  tags: String[]
  version: Int
  isLatestVersion: Boolean
  
  // OCR
  ocrText: String
  ocrProcessed: Boolean
  
  uploadedBy: UUID
  uploadedAt: DateTime
  updatedAt: DateTime
}
```

#### 12. **DocumentVersion** (Versions de Documents)
```typescript
{
  id: UUID
  documentId: UUID (foreign key)
  
  version: Int
  fileName: String
  filePath: String
  fileSize: Int
  
  uploadedBy: UUID
  uploadedAt: DateTime
  notes: String
}
```

#### 13. **DocumentAccessLog** (Logs d'Accès Documents)
```typescript
{
  id: UUID
  documentId: UUID (foreign key)
  
  userId: UUID
  action: String // VIEW, DOWNLOAD, PRINT, EDIT, DELETE
  ipAddress: String
  userAgent: String
  
  accessedAt: DateTime
}
```

---

### ✅ Module Tasks (1 table)

#### 14. **Task** (Tâches)
```typescript
{
  id: UUID
  taskType: TaskType (enum)
  title: String
  description: String
  priority: TaskPriority (enum)
  status: TaskStatus (enum)
  
  // Affectation
  assignedToId: UUID
  branchId: UUID
  
  // Relations
  loanId: UUID (optional)
  customerId: UUID (optional)
  
  // SLA
  dueDate: DateTime
  slaMinutes: Int
  completedAt: DateTime
  escalatedAt: DateTime
  escalatedTo: UUID
  
  // Preuves
  notes: String
  evidenceUrls: String[]
  
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID
}
```

---

### 🚨 Module Alerts (1 table)

#### 15. **Alert** (Alertes EWS)
```typescript
{
  id: UUID
  category: AlertCategory (enum)
  severity: AlertSeverity (enum)
  status: AlertStatus (enum)
  
  title: String
  description: String
  triggerReason: String
  
  // Relations
  customerId: UUID (optional)
  loanId: UUID (optional)
  userId: UUID (optional)
  branchId: UUID (optional)
  
  // Actions
  recommendedAction: String
  actionTaken: String
  
  // Dates
  triggeredAt: DateTime
  acknowledgedAt: DateTime
  resolvedAt: DateTime
  
  metadata: JSON
}
```

---

### 📊 Module Performance (2 tables)

#### 16. **KPIResult** (Résultats KPI)
```typescript
{
  id: UUID
  userId: UUID (foreign key)
  
  period: DateTime // Mois/Trimestre
  category: KPICategory (enum)
  
  // Scores par catégorie
  portfolioQualityScore: Decimal
  productivityScore: Decimal
  complianceScore: Decimal
  clientImpactScore: Decimal
  
  totalScore: Decimal
  weightedScore: Decimal
  
  metrics: JSON // Métriques détaillées
  notes: String
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 17. **PerformanceSnapshot** (Snapshot de Performance)
```typescript
{
  id: UUID
  userId: UUID (foreign key)
  
  snapshotDate: DateTime
  period: String // "2025-01", "Q1-2025"
  
  // Métriques portefeuille
  activeLoans: Int
  disbursedAmount: Decimal
  par30: Decimal
  par90: Decimal
  
  // Productivité
  newClients: Int
  visitsCompleted: Int
  tasksCompleted: Int
  
  // Conformité
  kycCompliance: Decimal
  slaCompliance: Decimal
  
  createdAt: DateTime
}
```

---

### 🔍 Module Audit (1 table)

#### 18. **AuditLog** (Logs d'Audit)
```typescript
{
  id: UUID
  
  // Utilisateur et action
  userId: UUID (foreign key)
  action: AuditAction (enum)
  
  // Entité
  entityType: String // Customer, Loan, Document, etc.
  entityId: UUID
  
  // Détails
  description: String
  oldValues: JSON
  newValues: JSON
  
  // Contexte
  ipAddress: String
  userAgent: String
  
  timestamp: DateTime
}
```

---

## 🏷️ Enums (Types)

### UserRole
```typescript
enum UserRole {
  ADMIN
  CEO
  BOARD
  BRANCH_MANAGER
  LOAN_OFFICER
  HR
  COMPLIANCE
  AUDITOR
  FIELD_OFFICER
}
```

### UserStatus
```typescript
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  LOCKED
}
```

### CustomerType
```typescript
enum CustomerType {
  INDIVIDUAL  // Individuel
  GROUP       // Groupe solidaire
  BUSINESS    // Entreprise
}
```

### CustomerStatus
```typescript
enum CustomerStatus {
  PROSPECT    // Prospect non converti
  ACTIVE      // Client actif
  INACTIVE    // Client inactif
  BLACKLISTED // Liste noire
}
```

### KYCStatus
```typescript
enum KYCStatus {
  PENDING    // En attente
  INCOMPLETE // Incomplet
  COMPLETE   // Complet
  EXPIRED    // Expiré
}
```

### RiskLevel
```typescript
enum RiskLevel {
  LOW       // Risque faible
  MEDIUM    // Risque moyen
  HIGH      // Risque élevé
  VERY_HIGH // Risque très élevé
}
```

### LoanStatus
```typescript
enum LoanStatus {
  DRAFT                     // Brouillon
  APPLICATION_SUBMITTED     // Demande soumise
  UNDER_APPRAISAL          // En évaluation
  PENDING_APPROVAL         // En attente d'approbation
  APPROVED                 // Approuvé
  APPROVED_WITH_CONDITIONS // Approuvé avec conditions
  REJECTED                 // Rejeté
  DISBURSED                // Décaissé
  ACTIVE                   // Actif
  OVERDUE                  // En retard
  RESTRUCTURED             // Restructuré
  CLOSED                   // Clôturé
  WRITTEN_OFF              // Passé en perte
}
```

### LoanPurpose
```typescript
enum LoanPurpose {
  AGRICULTURE    // Agriculture
  TRADE          // Commerce
  SERVICES       // Services
  MANUFACTURING  // Fabrication
  EDUCATION      // Éducation
  HOUSING        // Logement
  EMERGENCY      // Urgence
  OTHER          // Autre
}
```

### InterestRateType
```typescript
enum InterestRateType {
  FLAT              // Taux plat
  REDUCING_BALANCE  // Solde dégressif
  FIXED             // Fixe
  VARIABLE          // Variable
}
```

### RepaymentFrequency
```typescript
enum RepaymentFrequency {
  DAILY      // Quotidien
  WEEKLY     // Hebdomadaire
  BIWEEKLY   // Bimensuel
  MONTHLY    // Mensuel
  QUARTERLY  // Trimestriel
}
```

### ApprovalLevel
```typescript
enum ApprovalLevel {
  BRANCH_MANAGER   // Directeur de branche
  REGIONAL_MANAGER // Directeur régional
  CREDIT_COMMITTEE // Comité de crédit
  BOARD            // Conseil d'administration
}
```

### ApprovalDecisionType
```typescript
enum ApprovalDecisionType {
  APPROVED                  // Approuvé
  APPROVED_WITH_CONDITIONS  // Approuvé avec conditions
  REJECTED                  // Rejeté
  DEFERRED                  // Différé
}
```

### DisbursementMethod
```typescript
enum DisbursementMethod {
  CASH           // Espèces
  BANK_TRANSFER  // Virement bancaire
  MOBILE_MONEY   // Mobile money
  CHEQUE         // Chèque
}
```

### DisbursementStatus
```typescript
enum DisbursementStatus {
  PENDING     // En attente
  PROCESSING  // En traitement
  COMPLETED   // Complété
  FAILED      // Échoué
  REVERSED    // Annulé
}
```

### TaskType
```typescript
enum TaskType {
  KYC_VERIFICATION        // Vérification KYC
  SITE_VISIT             // Visite sur site
  APPRAISAL              // Évaluation
  DOCUMENT_UPLOAD        // Upload document
  APPROVAL_REQUEST       // Demande d'approbation
  DISBURSEMENT_VERIFICATION // Vérification décaissement
  MONITORING_VISIT       // Visite de monitoring
  FOLLOW_UP_CALL         // Appel de suivi
  COLLECTION             // Recouvrement
  EWS_ACTION             // Action alerte EWS
}
```

### TaskStatus
```typescript
enum TaskStatus {
  PENDING      // En attente
  IN_PROGRESS  // En cours
  COMPLETED    // Complété
  OVERDUE      // En retard
  ESCALATED    // Escaladé
  CANCELLED    // Annulé
}
```

### AlertSeverity
```typescript
enum AlertSeverity {
  INFO      // Information
  WARNING   // Avertissement
  CRITICAL  // Critique
}
```

### AlertCategory
```typescript
enum AlertCategory {
  CLIENT_RISK       // Risque client
  OFFICER_PERFORMANCE // Performance agent
  BRANCH_RISK       // Risque branche
  PORTFOLIO_RISK    // Risque portefeuille
  COMPLIANCE        // Conformité
}
```

### AuditAction
```typescript
enum AuditAction {
  CREATE   // Création
  UPDATE   // Modification
  DELETE   // Suppression
  VIEW     // Consultation
  APPROVE  // Approbation
  REJECT   // Rejet
  DISBURSE // Décaissement
  LOGIN    // Connexion
  LOGOUT   // Déconnexion
}
```

---

## 🔗 Relations Entre Entités

### Relations Principales

```
User (1) ←→ (N) Customer [createdBy]
User (1) ←→ (N) Loan [loanOfficer, createdBy]
User (1) ←→ (N) Task [assignedTo]
User (N) ←→ (1) Branch [branchId]

Customer (1) ←→ (1) KYCProfile
Customer (1) ←→ (1) RiskProfile
Customer (1) ←→ (N) Loan
Customer (1) ←→ (N) Document

Loan (1) ←→ (1) Appraisal
Loan (1) ←→ (N) ApprovalDecision
Loan (1) ←→ (1) Disbursement
Loan (1) ←→ (N) RepaymentSchedule
Loan (1) ←→ (N) Document
Loan (1) ←→ (N) Task

Document (1) ←→ (N) DocumentVersion
Document (1) ←→ (N) DocumentAccessLog

Branch (1) ←→ (N) User
Branch (1) ←→ (N) Customer
Branch (1) ←→ (N) Loan
```

---

## 📍 Où Trouver Ces Définitions

Tous les rôles et entités sont définis dans :
```
📁 mf-lms-backend/
  └── 📁 prisma/
      └── 📄 schema.prisma  ← TOUTES LES DÉFINITIONS ICI
```

Ce fichier de **832 lignes** contient :
- ✅ Tous les enums (rôles, statuts, types)
- ✅ Toutes les tables (models)
- ✅ Toutes les relations
- ✅ Tous les index et contraintes

---

## 🎯 Utilisation dans le Code

Les rôles et entités sont automatiquement générés par Prisma et utilisables partout :

```typescript
// Import des types
import { UserRole, LoanStatus, CustomerType } from '@prisma/client';

// Utilisation dans les guards
@Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)

// Utilisation dans les services
if (user.role === UserRole.LOAN_OFFICER) {
  // Logic
}

// Utilisation dans les DTOs
@IsEnum(LoanStatus)
status: LoanStatus;
```

---

**✅ Tout est en place et prêt à l'emploi !**
