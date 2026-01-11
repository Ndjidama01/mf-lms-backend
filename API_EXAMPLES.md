# 🧪 Exemples de Requêtes API - MF-LMS Backend

Collection complète d'exemples pour tester tous les endpoints de l'API.

---

## 🔑 Variables d'Environnement

```bash
BASE_URL=http://localhost:3000/api/v1
ACCESS_TOKEN=<votre_token_après_login>
```

---

## 1️⃣ MODULE AUTHENTIFICATION

### 1.1 Login (Connexion)

```bash
curl -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "officer1@mflms.com",
    "password": "Password123!"
  }'
```

**Réponse** :
```json
{
  "user": {
    "id": "uuid",
    "email": "officer1@mflms.com",
    "username": "officer1",
    "firstName": "Jane",
    "lastName": "Officer",
    "role": "LOAN_OFFICER",
    "branchId": "uuid",
    "branch": {
      "id": "uuid",
      "code": "BR01",
      "name": "Downtown Branch"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1d"
}
```

### 1.2 Register (Inscription)

```bash
curl -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@mflms.com",
    "username": "newuser",
    "password": "Password123!",
    "firstName": "New",
    "lastName": "User",
    "phone": "+243987654321"
  }'
```

### 1.3 Refresh Token

```bash
curl -X POST ${BASE_URL}/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 1.4 Get Profile

```bash
curl -X GET ${BASE_URL}/auth/profile \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 1.5 Change Password

```bash
curl -X POST ${BASE_URL}/auth/change-password \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Password123!",
    "newPassword": "NewPassword123!"
  }'
```

---

## 2️⃣ MODULE UTILISATEURS

### 2.1 Créer un Utilisateur (ADMIN/HR)

```bash
curl -X POST ${BASE_URL}/users \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newloancofficer@mflms.com",
    "username": "newofficer",
    "password": "Password123!",
    "firstName": "Marie",
    "lastName": "Dupont",
    "phone": "+243123456789",
    "role": "LOAN_OFFICER",
    "branchId": "YOUR_BRANCH_ID",
    "status": "ACTIVE"
  }'
```

### 2.2 Liste des Utilisateurs

```bash
# Tous les utilisateurs
curl -X GET "${BASE_URL}/users?page=1&limit=10" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par rôle
curl -X GET "${BASE_URL}/users?role=LOAN_OFFICER" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Recherche
curl -X GET "${BASE_URL}/users?search=jane" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par branche
curl -X GET "${BASE_URL}/users?branchId=BRANCH_ID" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 2.3 Détails d'un Utilisateur

```bash
curl -X GET ${BASE_URL}/users/USER_ID \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 2.4 Modifier un Utilisateur

```bash
curl -X PATCH ${BASE_URL}/users/USER_ID \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane Updated",
    "phone": "+243999999999",
    "status": "ACTIVE"
  }'
```

### 2.5 Affecter à une Branche

```bash
curl -X POST ${BASE_URL}/users/USER_ID/assign-branch \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "BRANCH_ID"
  }'
```

### 2.6 Statistiques Utilisateur

```bash
curl -X GET ${BASE_URL}/users/USER_ID/stats \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

---

## 3️⃣ MODULE CLIENTS

### 3.1 Créer un Client (Prospect)

```bash
curl -X POST ${BASE_URL}/customers \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "Jean",
    "lastName": "Kabila",
    "middleName": "Paul",
    "dateOfBirth": "1985-05-15",
    "gender": "Male",
    "nationalId": "ID123456789",
    "phone": "+243123456789",
    "email": "jean.kabila@example.com",
    "address": "123 Avenue Kasa-Vubu",
    "city": "Kinshasa",
    "district": "Gombe",
    "occupation": "Farmer",
    "monthlyIncome": 5000,
    "businessName": "Kabila Farm",
    "businessType": "Agriculture",
    "branchId": "BRANCH_ID",
    "niuData": {
      "referralSource": "Community Leader",
      "customField1": "value1"
    }
  }'
```

### 3.2 Liste des Clients

```bash
# Tous les clients
curl -X GET "${BASE_URL}/customers?page=1&limit=10" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par type
curl -X GET "${BASE_URL}/customers?type=INDIVIDUAL" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par statut
curl -X GET "${BASE_URL}/customers?status=PROSPECT" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Recherche
curl -X GET "${BASE_URL}/customers?search=jean" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par niveau de risque
curl -X GET "${BASE_URL}/customers?riskLevel=MEDIUM" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 3.3 Détails d'un Client

```bash
curl -X GET ${BASE_URL}/customers/CUSTOMER_ID \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 3.4 Modifier un Client

```bash
curl -X PATCH ${BASE_URL}/customers/CUSTOMER_ID \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+243987654321",
    "email": "newemail@example.com",
    "monthlyIncome": 6000,
    "address": "New address"
  }'
```

### 3.5 Mettre à Jour le KYC

```bash
curl -X PATCH ${BASE_URL}/customers/CUSTOMER_ID/kyc \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "hasNationalId": true,
    "hasProofOfAddress": true,
    "hasPhotoProof": true,
    "hasIncomeProof": true,
    "hasBusinessDocs": false
  }'
```

### 3.6 Mettre à Jour le Profil de Risque

```bash
curl -X PATCH ${BASE_URL}/customers/CUSTOMER_ID/risk-profile \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "riskLevel": "LOW",
    "creditScore": 720,
    "delinquencyHistory": false,
    "multipleBorrowing": false,
    "politicalExposure": false,
    "highRiskOccupation": false,
    "assessmentNotes": "Client has excellent repayment history"
  }'
```

### 3.7 Convertir Prospect en Client

```bash
curl -X POST ${BASE_URL}/customers/CUSTOMER_ID/convert-to-customer \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "confirm": true
  }'
```

### 3.8 Historique Client

```bash
curl -X GET ${BASE_URL}/customers/CUSTOMER_ID/history \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

---

## 4️⃣ MODULE PRÊTS - CYCLE COMPLET

### 4.1 Créer une Demande de Prêt (DRAFT)

```bash
curl -X POST ${BASE_URL}/loans \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID",
    "productName": "Micro Crédit Agricole",
    "purpose": "AGRICULTURE",
    "requestedAmount": 10000,
    "interestRate": 15.5,
    "interestRateType": "REDUCING_BALANCE",
    "tenure": 12,
    "repaymentFrequency": "MONTHLY",
    "loanOfficerId": "LOAN_OFFICER_ID",
    "branchId": "BRANCH_ID"
  }'
```

### 4.2 Liste des Prêts

```bash
# Tous les prêts
curl -X GET "${BASE_URL}/loans?page=1&limit=10" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par statut
curl -X GET "${BASE_URL}/loans?status=PENDING_APPROVAL" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par type
curl -X GET "${BASE_URL}/loans?purpose=AGRICULTURE" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par client
curl -X GET "${BASE_URL}/loans?customerId=CUSTOMER_ID" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filtrer par loan officer
curl -X GET "${BASE_URL}/loans?loanOfficerId=OFFICER_ID" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 4.3 Détails d'un Prêt

```bash
curl -X GET ${BASE_URL}/loans/LOAN_ID \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### 4.4 Modifier un Prêt (DRAFT uniquement)

```bash
curl -X PATCH ${BASE_URL}/loans/LOAN_ID \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedAmount": 12000,
    "tenure": 18,
    "interestRate": 14.0
  }'
```

### 4.5 Soumettre la Demande (DRAFT → APPLICATION_SUBMITTED)

```bash
curl -X POST ${BASE_URL}/loans/LOAN_ID/submit \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "confirm": true
  }'
```

**⚠️ WORKFLOW GATE : KYC doit être COMPLETE**

---

### 🔍 PHASE D'ÉVALUATION (APPRAISAL)

### 4.6 Créer une Évaluation

```bash
curl -X POST ${BASE_URL}/loans/LOAN_ID/appraisal \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "siteVisitDate": "2025-01-15",
    "siteVisitNotes": "Property is in good condition, suitable for agricultural activities",
    "siteVisitPhotos": [
      "photo1.jpg",
      "photo2.jpg"
    ],
    "monthlyIncome": 5000,
    "monthlyExpenses": 3000,
    "netCashFlow": 2000,
    "debtServiceRatio": 0.3,
    "creditScore": 720,
    "scoringNotes": "Good credit history, no defaults",
    "recommendedAmount": 9500,
    "recommendedTenure": 12,
    "appraisalNotes": "Applicant demonstrates strong repayment capacity",
    "recommendation": "APPROVE"
  }'
```

### 4.7 Modifier l'Évaluation

```bash
curl -X PATCH ${BASE_URL}/loans/LOAN_ID/appraisal \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyIncome": 5500,
    "creditScore": 750,
    "recommendedAmount": 10000
  }'
```

### 4.8 Finaliser l'Évaluation (→ PENDING_APPROVAL)

```bash
curl -X POST ${BASE_URL}/loans/LOAN_ID/appraisal/complete \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**⚠️ WORKFLOW GATE : Recommandation et montant recommandé requis**

---

### ✅ PHASE D'APPROBATION

### 4.9 Créer une Décision d'Approbation

```bash
# Approbation simple
curl -X POST ${BASE_URL}/loans/LOAN_ID/approval \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "BRANCH_MANAGER",
    "decision": "APPROVED",
    "approvedAmount": 9500,
    "notes": "All criteria met. Applicant has good repayment capacity.",
    "minutes": "Loan committee reviewed application on 2025-01-10. Unanimously approved."
  }'

# Approbation avec conditions
curl -X POST ${BASE_URL}/loans/LOAN_ID/approval \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "BRANCH_MANAGER",
    "decision": "APPROVED_WITH_CONDITIONS",
    "approvedAmount": 9000,
    "conditions": [
      "Provide additional collateral",
      "Monthly monitoring visits required",
      "Insurance coverage mandatory"
    ],
    "notes": "Approved with specific conditions",
    "minutes": "Committee discussed and approved with conditions"
  }'

# Rejet
curl -X POST ${BASE_URL}/loans/LOAN_ID/approval \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "BRANCH_MANAGER",
    "decision": "REJECTED",
    "notes": "Insufficient cash flow to service the loan",
    "minutes": "Committee reviewed and rejected based on debt service ratio"
  }'
```

**⚠️ WORKFLOW GATE : Évaluation doit être COMPLETED**

---

### 💰 PHASE DE DÉCAISSEMENT

### 4.10 Créer un Décaissement

```bash
# Virement bancaire
curl -X POST ${BASE_URL}/loans/LOAN_ID/disbursement \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9500,
    "method": "BANK_TRANSFER",
    "accountNumber": "0123456789",
    "accountName": "Jean Kabila",
    "bankName": "BCDC",
    "referenceNumber": "REF123456",
    "notes": "Disbursement for agricultural loan"
  }'

# Mobile Money
curl -X POST ${BASE_URL}/loans/LOAN_ID/disbursement \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9500,
    "method": "MOBILE_MONEY",
    "accountNumber": "+243123456789",
    "accountName": "Jean Kabila",
    "notes": "Mobile money disbursement"
  }'

# Cash
curl -X POST ${BASE_URL}/loans/LOAN_ID/disbursement \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9500,
    "method": "CASH",
    "notes": "Cash disbursement at branch"
  }'
```

**⚠️ WORKFLOW GATE : Prêt doit être APPROVED**

### 4.11 Vérifier le Décaissement

```bash
curl -X POST ${BASE_URL}/loans/LOAN_ID/disbursement/verify \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true,
    "notes": "All documents verified, disbursement approved"
  }'
```

### 4.12 Finaliser le Décaissement (→ DISBURSED)

```bash
curl -X POST ${BASE_URL}/loans/LOAN_ID/disbursement/complete \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "confirm": true,
    "referenceNumber": "REF-FINAL-123456"
  }'
```

**⚠️ WORKFLOW GATE : Décaissement doit être vérifié**
**✅ CALENDRIER DE REMBOURSEMENT GÉNÉRÉ AUTOMATIQUEMENT**

---

### 🔒 CLÔTURE DU PRÊT

### 4.13 Clôturer un Prêt

```bash
curl -X POST ${BASE_URL}/loans/LOAN_ID/close \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "finalRating": "GOOD",
    "closureNotes": "Loan fully repaid on time with no defaults",
    "closureChecklist": [
      "All installments paid",
      "No outstanding balance",
      "Documents returned to customer",
      "Customer satisfaction confirmed"
    ]
  }'
```

---

## 📊 EXEMPLES DE RÉPONSES

### Loan Details (GET /loans/:id)

```json
{
  "id": "uuid",
  "loanId": "LN-BR01-25-00001",
  "customerId": "uuid",
  "customer": {
    "id": "uuid",
    "customerId": "BR01-25-00001",
    "firstName": "Jean",
    "lastName": "Kabila",
    "phone": "+243123456789",
    "kycProfile": {
      "status": "COMPLETE"
    },
    "riskProfile": {
      "riskLevel": "LOW"
    }
  },
  "productName": "Micro Crédit Agricole",
  "purpose": "AGRICULTURE",
  "requestedAmount": 10000,
  "approvedAmount": 9500,
  "interestRate": 15.5,
  "interestRateType": "REDUCING_BALANCE",
  "tenure": 12,
  "repaymentFrequency": "MONTHLY",
  "status": "DISBURSED",
  "loanOfficer": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Officer",
    "email": "officer1@mflms.com"
  },
  "branch": {
    "id": "uuid",
    "code": "BR01",
    "name": "Downtown Branch"
  },
  "appraisal": {
    "status": "COMPLETED",
    "recommendedAmount": 9500,
    "recommendation": "APPROVE"
  },
  "approvalDecisions": [
    {
      "level": "BRANCH_MANAGER",
      "decision": "APPROVED",
      "approvedAmount": 9500,
      "approvedAt": "2025-01-10T10:00:00Z"
    }
  ],
  "disbursement": {
    "amount": 9500,
    "method": "BANK_TRANSFER",
    "status": "COMPLETED",
    "disbursedAt": "2025-01-11T14:00:00Z"
  },
  "repaymentSchedule": [
    {
      "installmentNumber": 1,
      "dueDate": "2025-02-11",
      "principalAmount": 750,
      "interestAmount": 125,
      "totalAmount": 875,
      "status": "PENDING"
    }
    // ... 11 more installments
  ],
  "applicationDate": "2025-01-08T09:00:00Z",
  "approvalDate": "2025-01-10T10:00:00Z",
  "disbursementDate": "2025-01-11T14:00:00Z",
  "maturityDate": "2026-01-11",
  "createdAt": "2025-01-08T09:00:00Z",
  "updatedAt": "2025-01-11T14:00:00Z"
}
```

---

## 🧪 Scénario de Test Complet

### Étape par étape pour créer et approuver un prêt

```bash
# 1. Login
ACCESS_TOKEN=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"officer1@mflms.com","password":"Password123!"}' \
  | jq -r '.accessToken')

# 2. Créer un client
CUSTOMER_ID=$(curl -s -X POST ${BASE_URL}/customers \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -r '.id')

# 3. Mettre à jour KYC (COMPLETE)
curl -X PATCH ${BASE_URL}/customers/${CUSTOMER_ID}/kyc \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"hasNationalId":true,"hasProofOfAddress":true,"hasPhotoProof":true}'

# 4. Convertir en client
curl -X POST ${BASE_URL}/customers/${CUSTOMER_ID}/convert-to-customer \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"confirm":true}'

# 5. Créer le prêt
LOAN_ID=$(curl -s -X POST ${BASE_URL}/loans \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -r '.id')

# 6. Soumettre
curl -X POST ${BASE_URL}/loans/${LOAN_ID}/submit \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"confirm":true}'

# 7. Créer évaluation
curl -X POST ${BASE_URL}/loans/${LOAN_ID}/appraisal \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 8. Finaliser évaluation
curl -X POST ${BASE_URL}/loans/${LOAN_ID}/appraisal/complete \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# 9. Approuver
curl -X POST ${BASE_URL}/loans/${LOAN_ID}/approval \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 10. Créer décaissement
curl -X POST ${BASE_URL}/loans/${LOAN_ID}/disbursement \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 11. Vérifier décaissement
curl -X POST ${BASE_URL}/loans/${LOAN_ID}/disbursement/verify \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"verified":true}'

# 12. Finaliser décaissement
curl -X POST ${BASE_URL}/loans/${LOAN_ID}/disbursement/complete \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"confirm":true}'

echo "✅ Prêt créé, approuvé et décaissé avec succès!"
```

---

## 📝 Notes Importantes

1. **Tokens** : Le token JWT expire après 1 jour par défaut
2. **Workflow** : Respectez toujours l'ordre des étapes
3. **Gates** : Les transitions sont bloquées si les conditions ne sont pas remplies
4. **RBAC** : Certains endpoints nécessitent des rôles spécifiques
5. **Validation** : Tous les champs sont validés (class-validator)

---

**💡 Conseil** : Utilisez Postman ou Thunder Client avec ces exemples pour un workflow plus visuel !
