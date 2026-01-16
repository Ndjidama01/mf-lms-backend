# 🚨 Guide Complet - Modules Alertes et Tâches

## 📦 Modules Créés

### 1️⃣ Module Alerts (Système d'Alerte Précoce - SAP)
Surveillance proactive des indicateurs de risque avec génération automatique d'alertes.

### 2️⃣ Module Tasks (Gestion des Tâches et Workflows)
Gestion complète des tâches avec SLA, relances automatiques et suivi de performance.

---

## 🚨 Module ALERTS - Système d'Alerte Précoce (SAP)

### 📁 Fichiers Créés
```
src/modules/alerts/
├── dto/alert.dto.ts
├── alerts.service.ts
├── alerts.controller.ts
└── alerts.module.ts
```

### 🎯 Fonctionnalités Principales

#### ✅ FR-10 : Surveillance des Indicateurs Clés de Risque (ICR)

**Indicateurs Surveillés** :

1. **Portfolio at Risk (PAR30)** - Par Branche
   - Seuil Warning : 10%
   - Seuil Critical : 15%
   - Fréquence : Toutes les heures

2. **Prêts en Retard** - Par Loan Officer
   - Seuil Warning : > 5 prêts
   - Seuil Critical : > 10 prêts
   - Fréquence : Toutes les heures

3. **Performance des Branches**
   - Seuil Warning : < 10 prêts/mois
   - Fréquence : Toutes les heures

4. **Profils de Risque Client**
   - Alerte : Client HIGH risk avec prêt actif
   - Fréquence : Toutes les heures

#### ✅ FR-11 : Génération Automatique d'Alertes et Tâches

**Workflow** :
```
Indicateur Dépassé → Alerte Créée → Tâche Générée (si requiresAction=true)
                    ↓
             Notification Utilisateur
```

**Types d'Alertes** :
- CREDIT_RISK : Risques de crédit
- OPERATIONAL : Problèmes opérationnels
- COMPLIANCE : Non-conformité
- PERFORMANCE : Performance faible
- SYSTEM : Alertes système

**Niveaux de Sévérité** :
- CRITICAL : Action immédiate (< 4h)
- HIGH : Action urgente (< 24h)
- MEDIUM : Action dans 3 jours
- LOW : Information (7 jours)

#### ✅ FR-12 : Restriction des Nouveaux Prêts

**Déclencheur** :
```typescript
if (PAR30 > 15%) {
  // 1. Alerte CRITICAL créée
  // 2. Tâche URGENT pour Branch Manager
  // 3. Blocage nouveaux prêts pour la branche
}
```

**Processus** :
1. Alerte critique générée
2. Tâche urgente assignée au Branch Manager
3. Flag de blocage activé
4. Aucun nouveau prêt ne peut être créé jusqu'à résolution

### 📋 API Endpoints (13 routes)

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| POST | `/alerts` | Créer alerte manuelle | ADMIN, BRANCH_MANAGER, COMPLIANCE |
| GET | `/alerts` | Lister avec filtres | ADMIN, CEO, BOARD, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, AUDITOR |
| GET | `/alerts/statistics` | Statistiques alertes | ADMIN, CEO, BOARD, BRANCH_MANAGER, COMPLIANCE |
| POST | `/alerts/trigger-monitoring` | Déclencher surveillance | ADMIN, COMPLIANCE |
| POST | `/alerts/bulk-acknowledge` | Accusé réception multiple | ADMIN, BRANCH_MANAGER, COMPLIANCE |
| GET | `/alerts/:id` | Détails alerte | ADMIN, CEO, BOARD, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, AUDITOR |
| PATCH | `/alerts/:id` | Mettre à jour | ADMIN, BRANCH_MANAGER, COMPLIANCE |
| POST | `/alerts/:id/acknowledge` | Accuser réception | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE |
| POST | `/alerts/:id/resolve` | Résoudre | ADMIN, BRANCH_MANAGER, COMPLIANCE |
| POST | `/alerts/:id/dismiss` | Ignorer | ADMIN, BRANCH_MANAGER, COMPLIANCE |
| POST | `/alerts/:id/escalate` | Escalader | ADMIN, BRANCH_MANAGER, COMPLIANCE |
| DELETE | `/alerts/:id` | Supprimer | ADMIN |

### 📝 Exemples d'Utilisation

#### Créer une Alerte Manuelle
```bash
POST /api/v1/alerts
Authorization: Bearer {token}

{
  "severity": "HIGH",
  "category": "OPERATIONAL",
  "title": "Staff Shortage at Downtown Branch",
  "message": "Only 2 loan officers present today, 5 required",
  "branchId": "{branch_uuid}",
  "assignedToId": "{manager_uuid}",
  "requiresAction": true,
  "metadata": {
    "staffPresent": 2,
    "staffRequired": 5
  }
}
```

#### Filtrer les Alertes
```bash
GET /api/v1/alerts?severity=CRITICAL&status=ACTIVE&category=CREDIT_RISK&page=1&limit=10
```

#### Accuser Réception d'une Alerte
```bash
POST /api/v1/alerts/{alertId}/acknowledge

{
  "notes": "Investigating the issue, will report back in 2 hours"
}
```

#### Résoudre une Alerte
```bash
POST /api/v1/alerts/{alertId}/resolve

{
  "resolutionNotes": "Contacted all overdue customers, 8/10 committed to payment",
  "action": "RESOLVED"
}
```

#### Escalader une Alerte
```bash
POST /api/v1/alerts/{alertId}/escalate

{
  "escalatedToId": "{senior_manager_uuid}",
  "reason": "Situation not improving, requires senior management intervention"
}
```

#### Déclencher Surveillance Manuelle
```bash
POST /api/v1/alerts/trigger-monitoring

# Lance immédiatement la surveillance des indicateurs
# Normalement exécuté automatiquement toutes les heures
```

---

## ✅ Module TASKS - Gestion des Tâches et Workflows

### 📁 Fichiers Créés
```
src/modules/tasks/
├── dto/task.dto.ts
├── tasks.service.ts
├── tasks.controller.ts
└── tasks.module.ts
```

### 🎯 Fonctionnalités Principales

#### ✅ FR-13 : Génération Automatique de Tâches

**Sources de Tâches** :
1. **Alertes avec requiresAction=true** → Tâche automatique
2. **Événements cycle de vie prêt** → Tâches workflow
3. **Créations manuelles** → Par utilisateurs

**Workflow Auto-génération** :
```
Alerte Créée (requiresAction=true)
    ↓
Calcul Due Date selon Severity:
  - CRITICAL: +4 heures
  - HIGH: +24 heures
  - MEDIUM: +3 jours
  - LOW: +7 jours
    ↓
Tâche Créée avec Priority: URGENT/HIGH
    ↓
Notification Assignée
```

#### ✅ FR-14 : Suivi du Respect des SLA

**Fonctionnement** :
```typescript
// Lors de la création de la tâche
if (slaHours) {
  slaDeadline = now + slaHours
}

// Monitoring toutes les 30 minutes
@Cron(EVERY_30_MINUTES)
checkSLABreaches() {
  // Si slaDeadline < maintenant && status=PENDING/IN_PROGRESS
  // → Marquer slaBreached = true
  // → Créer Alerte HIGH
}
```

**SLA par Type de Tâche** :
- URGENT_ACTION : 4 heures
- FOLLOW_UP : 24 heures
- DOCUMENT_REVIEW : 48 heures
- FIELD_VISIT : 72 heures
- OTHER : Personnalisé

#### ✅ FR-15 : Relances Automatiques

**Système de Relances** :

1. **Tâches en Retard** :
   - Fréquence : Tous les 3 jours
   - Alerte : MEDIUM
   - Message : "Tâche {X} jours en retard"

2. **Tâches Due Soon** :
   - Fréquence : 24h avant échéance
   - Alerte : LOW
   - Pour : Tâches HIGH/URGENT uniquement

3. **Breach SLA** :
   - Immédiat dès breach
   - Alerte : HIGH
   - Notification : Assigné + Manager

**Exemples de Relances** :
```
Tâche due le 10/01 à 10:00
├─ 09/01 10:00 → Reminder "Due in 24h" (si HIGH/URGENT)
├─ 10/01 10:00 → Deadline atteinte
├─ 10/01 10:01 → SLA breach (si applicable)
├─ 13/01 → Overdue reminder (3 jours)
├─ 16/01 → Overdue reminder (6 jours)
└─ 19/01 → Overdue reminder (9 jours)
```

### 📋 API Endpoints (16 routes)

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| POST | `/tasks` | Créer tâche | ADMIN, BRANCH_MANAGER, LOAN_OFFICER |
| GET | `/tasks` | Lister avec filtres | ADMIN, CEO, BRANCH_MANAGER, LOAN_OFFICER, HR, COMPLIANCE, FIELD_OFFICER |
| GET | `/tasks/my-tasks` | Mes tâches | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, HR, COMPLIANCE, FIELD_OFFICER |
| GET | `/tasks/statistics` | Statistiques tâches | ADMIN, CEO, BRANCH_MANAGER, HR |
| POST | `/tasks/trigger-monitoring` | Déclencher monitoring | ADMIN |
| POST | `/tasks/bulk-assign` | Assignation multiple | ADMIN, BRANCH_MANAGER |
| GET | `/tasks/:id` | Détails tâche | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, HR, COMPLIANCE, FIELD_OFFICER |
| PATCH | `/tasks/:id` | Mettre à jour | ADMIN, BRANCH_MANAGER, LOAN_OFFICER |
| POST | `/tasks/:id/start` | Démarrer tâche | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, FIELD_OFFICER |
| POST | `/tasks/:id/complete` | Terminer tâche | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, FIELD_OFFICER |
| POST | `/tasks/:id/reassign` | Réassigner | ADMIN, BRANCH_MANAGER |
| POST | `/tasks/:id/cancel` | Annuler | ADMIN, BRANCH_MANAGER |
| POST | `/tasks/:id/comment` | Ajouter commentaire | ADMIN, BRANCH_MANAGER, LOAN_OFFICER, COMPLIANCE, FIELD_OFFICER |
| DELETE | `/tasks/:id` | Supprimer | ADMIN |

### 📝 Exemples d'Utilisation

#### Créer une Tâche
```bash
POST /api/v1/tasks

{
  "type": "FOLLOW_UP",
  "title": "Follow up with customer on overdue payment",
  "description": "Customer Jean Dupont has payment 5 days overdue. Contact to arrange payment.",
  "priority": "HIGH",
  "dueDate": "2025-01-15T17:00:00Z",
  "assignedToId": "{loan_officer_uuid}",
  "customerId": "{customer_uuid}",
  "loanId": "{loan_uuid}",
  "branchId": "{branch_uuid}",
  "slaHours": 24,
  "checklist": [
    "Call customer",
    "Send SMS reminder",
    "Update notes in system"
  ]
}
```

#### Obtenir Mes Tâches
```bash
GET /api/v1/tasks/my-tasks?status=PENDING&priority=HIGH

# Retourne toutes les tâches du user connecté
```

#### Démarrer une Tâche
```bash
POST /api/v1/tasks/{taskId}/start

# Passe le status à IN_PROGRESS
# Enregistre startedAt
```

#### Compléter une Tâche
```bash
POST /api/v1/tasks/{taskId}/complete

{
  "completionNotes": "Customer contacted, agreed to pay 50% today and 50% next week",
  "completedChecklist": [
    "Call customer",
    "Send SMS reminder",
    "Update notes in system"
  ]
}
```

#### Réassigner une Tâche
```bash
POST /api/v1/tasks/{taskId}/reassign

{
  "newAssigneeId": "{other_officer_uuid}",
  "reason": "Original officer on leave, workload redistribution"
}
```

#### Ajouter un Commentaire
```bash
POST /api/v1/tasks/{taskId}/comment

{
  "comment": "Tried calling 3 times, no answer. Will try again tomorrow morning."
}
```

#### Filtrer Tâches en Retard
```bash
GET /api/v1/tasks?overdue=true&status=PENDING

# Retourne toutes les tâches dont dueDate < now
```

#### Filtrer Breach SLA
```bash
GET /api/v1/tasks?slaBreached=true

# Retourne toutes les tâches ayant dépassé SLA
```

---

## 🔄 Intégration Alerts ↔ Tasks

### Workflow Complet

```
1. Monitoring Automatique (toutes les heures)
   ↓
2. Indicateur Dépassé (ex: PAR30 > 15%)
   ↓
3. Alerte Créée (CRITICAL, requiresAction=true)
   ↓
4. Tâche Auto-générée
   - Type: ALERT_RESPONSE
   - Priority: URGENT
   - Due: +4 heures
   - SLA: 4 heures
   ↓
5. Notification Assigné
   ↓
6. User Travaille sur Tâche
   ↓
7. Monitoring SLA (toutes les 30 minutes)
   - Si breach → Alerte HIGH
   - Si overdue → Reminder tous les 3 jours
   ↓
8. Tâche Complétée
   ↓
9. Alerte Résolue
```

---

## ⚙️ Configuration CRON Jobs

### Alerts Module
```typescript
@Cron(CronExpression.EVERY_HOUR)
monitorRiskIndicators()
  ├─ monitorPortfolioAtRisk()
  ├─ monitorOverdueLoansByOfficer()
  ├─ monitorBranchPerformance()
  └─ monitorCustomerRiskProfile()
```

### Tasks Module
```typescript
@Cron(CronExpression.EVERY_30_MINUTES)
monitorSLAAndReminders()
  ├─ checkSLABreaches()
  ├─ sendOverdueReminders()
  └─ sendDueSoonReminders()
```

---

## 📊 Statistiques et Reporting

### Statistiques Alertes
```bash
GET /api/v1/alerts/statistics?branchId={uuid}

Response:
{
  "total": 150,
  "active": 45,
  "requiresAction": 12,
  "bySeverity": [
    { "severity": "CRITICAL", "_count": 5 },
    { "severity": "HIGH", "_count": 15 },
    { "severity": "MEDIUM", "_count": 20 },
    { "severity": "LOW", "_count": 5 }
  ],
  "byCategory": [
    { "category": "CREDIT_RISK", "_count": 25 },
    { "category": "OPERATIONAL", "_count": 15 },
    { "category": "PERFORMANCE", "_count": 5 }
  ],
  "byStatus": [
    { "status": "ACTIVE", "_count": 45 },
    { "status": "ACKNOWLEDGED", "_count": 30 },
    { "status": "RESOLVED", "_count": 70 },
    { "status": "DISMISSED", "_count": 5 }
  ]
}
```

### Statistiques Tâches
```bash
GET /api/v1/tasks/statistics?userId={uuid}

Response:
{
  "total": 200,
  "overdue": 15,
  "dueSoon": 8,
  "slaBreached": 12,
  "completionRate": 75.5,
  "byStatus": [
    { "status": "PENDING", "_count": 50 },
    { "status": "IN_PROGRESS", "_count": 25 },
    { "status": "COMPLETED", "_count": 120 },
    { "status": "CANCELLED", "_count": 5 }
  ],
  "byPriority": [
    { "priority": "URGENT", "_count": 10 },
    { "priority": "HIGH", "_count": 30 },
    { "priority": "MEDIUM", "_count": 80 },
    { "priority": "LOW", "_count": 80 }
  ]
}
```

---

## 🚀 Installation

### Étape 1 : Installer Dépendances
```bash
npm install @nestjs/schedule
npm install
```

### Étape 2 : Démarrer
```bash
npm run start:dev
```

### Étape 3 : Vérifier CRON Jobs
Les logs montrent l'exécution :
```
[AlertsService] Starting risk indicator monitoring...
[AlertsService] Risk indicator monitoring completed
[TasksService] Starting SLA monitoring and reminders...
[TasksService] SLA monitoring and reminders completed
```

---

## 🧪 Tests

### Test 1 : Déclencher Monitoring Manuellement
```bash
POST /api/v1/alerts/trigger-monitoring
POST /api/v1/tasks/trigger-monitoring
```

### Test 2 : Créer Alerte avec Tâche Auto
```bash
POST /api/v1/alerts
{
  "severity": "CRITICAL",
  "category": "CREDIT_RISK",
  "title": "Test Alert",
  "message": "Test message",
  "requiresAction": true,  // ✅ Créera une tâche
  "assignedToId": "{uuid}"
}

# Vérifier tâche créée
GET /api/v1/tasks/my-tasks
```

### Test 3 : Breach SLA
```bash
# 1. Créer tâche avec SLA court
POST /api/v1/tasks
{
  ...
  "slaHours": 1,
  "dueDate": "2025-01-12T10:00:00Z"
}

# 2. Attendre 1 heure ou déclencher manuellement
POST /api/v1/tasks/trigger-monitoring

# 3. Vérifier alerte SLA breach créée
GET /api/v1/alerts?category=OPERATIONAL
```

---

## ✅ Checklist de Déploiement

- [ ] @nestjs/schedule installé
- [ ] Modules Alerts et Tasks importés dans app.module.ts
- [ ] CRON jobs s'exécutent (vérifier logs)
- [ ] Test création alerte manuelle
- [ ] Test génération tâche automatique
- [ ] Test monitoring PAR30
- [ ] Test breach SLA
- [ ] Test relances overdue
- [ ] Statistiques accessibles
- [ ] Permissions RBAC configurées

---

**Les modules Alertes et Tâches sont complets et production-ready avec surveillance automatique 24/7 ! 🎉**
