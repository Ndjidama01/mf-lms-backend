# 🐳 Guide Docker Compose - MF-LMS Backend

## 📖 Qu'est-ce que Docker Compose ?

Docker Compose est un outil qui permet de **définir et gérer plusieurs conteneurs Docker** avec un seul fichier de configuration.

### 🎯 Avantages

✅ **Simplicité** : Une seule commande pour tout démarrer  
✅ **Reproductibilité** : Même environnement sur tous les postes  
✅ **Isolation** : Chaque service dans son conteneur  
✅ **Portabilité** : Fonctionne partout (dev, staging, prod)  
✅ **Orchestration** : Gère les dépendances entre services  

---

## 📦 Services Inclus

Le `docker-compose.yml` configure ces services :

### 1️⃣ **PostgreSQL** (Base de données)
- Port : `5432`
- Utilisateur : `mf_user`
- Base de données : `mf_lms`
- Volume persistant pour les données

### 2️⃣ **NestJS API** (Backend)
- Port : `3000`
- Se connecte automatiquement à PostgreSQL
- Exécute les migrations Prisma au démarrage

### 3️⃣ **Redis** (Cache - Optionnel)
- Port : `6379`
- Pour améliorer les performances

### 4️⃣ **Prisma Studio** (Dev uniquement)
- Port : `5555`
- Interface web pour gérer la base de données

### 5️⃣ **MailHog** (Dev uniquement)
- Port SMTP : `1025`
- Port Web UI : `8025`
- Pour tester l'envoi d'emails

### 6️⃣ **Nginx** (Production uniquement)
- Port : `80` (HTTP)
- Port : `443` (HTTPS)
- Reverse proxy devant l'API

---

## 🚀 Utilisation

### Prérequis

Installez Docker Desktop :
- **Windows/Mac** : https://www.docker.com/products/docker-desktop
- **Linux** : 
  ```bash
  sudo apt-get install docker.io docker-compose
  ```

---

### Commandes Essentielles

#### 1️⃣ Démarrer tous les services

```bash
# Démarrer en arrière-plan
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f api
```

#### 2️⃣ Arrêter tous les services

```bash
# Arrêter (conserve les données)
docker-compose stop

# Arrêter et supprimer les conteneurs
docker-compose down

# Arrêter et supprimer TOUT (conteneurs + volumes)
docker-compose down -v
```

#### 3️⃣ Reconstruire l'application

```bash
# Après modification du code
docker-compose build api

# Reconstruire et redémarrer
docker-compose up -d --build
```

#### 4️⃣ Voir les services en cours

```bash
docker-compose ps
```

#### 5️⃣ Exécuter une commande dans un conteneur

```bash
# Ouvrir un shell dans l'API
docker-compose exec api sh

# Exécuter une migration
docker-compose exec api npx prisma migrate dev

# Voir les logs PostgreSQL
docker-compose logs postgres
```

---

## 📁 Structure des Fichiers

```
mf-lms-backend/
├── docker-compose.yml          # Configuration Docker Compose
├── Dockerfile                  # Image Docker de l'API
├── .dockerignore              # Fichiers à ignorer
├── .env                       # Variables d'environnement
├── nginx/                     # Configuration Nginx (production)
│   ├── nginx.conf
│   └── ssl/
├── uploads/                   # Dossier des fichiers uploadés
└── logs/                      # Logs de l'application
```

---

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine :

```env
# Database
POSTGRES_DB=mf_lms
POSTGRES_USER=mf_user
POSTGRES_PASSWORD=changez_ce_mot_de_passe

# API
NODE_ENV=production
JWT_SECRET=changez_ce_secret_en_production
JWT_REFRESH_SECRET=changez_ce_refresh_secret
```

---

## 📊 Profils Docker Compose

### Mode Développement (avec Prisma Studio + MailHog)

```bash
docker-compose --profile dev up -d
```

Services démarrés :
- ✅ PostgreSQL
- ✅ API
- ✅ Redis
- ✅ Prisma Studio (http://localhost:5555)
- ✅ MailHog (http://localhost:8025)

### Mode Production (avec Nginx)

```bash
docker-compose --profile production up -d
```

Services démarrés :
- ✅ PostgreSQL
- ✅ API
- ✅ Redis
- ✅ Nginx (reverse proxy)

### Mode Standard (minimal)

```bash
docker-compose up -d
```

Services démarrés :
- ✅ PostgreSQL
- ✅ API
- ✅ Redis

---

## 🎯 Scénarios d'Usage

### 🔹 Développement Local

```bash
# 1. Démarrer les services de dev
docker-compose --profile dev up -d

# 2. Accéder à l'API
curl http://localhost:3000/api/v1

# 3. Accéder à Prisma Studio
open http://localhost:5555

# 4. Voir les logs en temps réel
docker-compose logs -f api

# 5. Exécuter les seeds
docker-compose exec api npm run prisma:seed
```

### 🔹 Tests

```bash
# Démarrer uniquement la base de données
docker-compose up -d postgres

# Exécuter les tests sur votre machine
npm run test

# Ou exécuter les tests dans Docker
docker-compose exec api npm run test
```

### 🔹 Production

```bash
# 1. Construire l'image
docker-compose build api

# 2. Démarrer en production
docker-compose --profile production up -d

# 3. Vérifier le statut
docker-compose ps

# 4. Voir les logs
docker-compose logs -f api nginx
```

---

## 🔍 Dépannage

### Problème : Conteneurs ne démarrent pas

```bash
# Voir les logs détaillés
docker-compose logs

# Vérifier l'état des services
docker-compose ps

# Redémarrer tous les services
docker-compose restart
```

### Problème : Base de données non accessible

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Tester la connexion
docker-compose exec postgres psql -U mf_user -d mf_lms

# Recréer la base de données
docker-compose down -v
docker-compose up -d postgres
```

### Problème : Modifications de code non appliquées

```bash
# Reconstruire l'image
docker-compose build api --no-cache

# Redémarrer
docker-compose up -d api
```

### Problème : Port déjà utilisé

```bash
# Trouver le processus qui utilise le port 3000
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Changer le port dans docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

---

## 📈 Monitoring

### Voir l'utilisation des ressources

```bash
docker stats
```

### Voir l'espace disque utilisé

```bash
docker system df
```

### Nettoyer les ressources inutilisées

```bash
# Nettoyer tout ce qui n'est pas utilisé
docker system prune -a

# Nettoyer uniquement les volumes
docker volume prune
```

---

## 🔐 Sécurité

### ⚠️ En Production

1. **Changez tous les mots de passe** dans `.env`
2. **Utilisez des secrets Docker** au lieu de variables d'environnement
3. **Activez HTTPS** avec des certificats SSL
4. **Limitez les ports exposés**
5. **Utilisez des images officielles et à jour**
6. **Scannez les vulnérabilités** :
   ```bash
   docker scan mf-lms-api
   ```

---

## 📚 Commandes Utiles

```bash
# Voir la version de Docker Compose
docker-compose --version

# Valider le fichier docker-compose.yml
docker-compose config

# Recréer les conteneurs (sans reconstruire)
docker-compose up -d --force-recreate

# Suivre les logs de tous les services
docker-compose logs -f --tail=100

# Exporter les logs vers un fichier
docker-compose logs > logs.txt

# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U mf_user mf_lms > backup.sql

# Restaurer la base de données
docker-compose exec -T postgres psql -U mf_user mf_lms < backup.sql
```

---

## 🎓 Exemple Complet : Premier Démarrage

```bash
# 1. Cloner le projet
git clone <repository>
cd mf-lms-backend

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 3. Démarrer tous les services
docker-compose up -d

# 4. Vérifier que tout fonctionne
docker-compose ps

# 5. Exécuter les migrations
docker-compose exec api npx prisma migrate deploy

# 6. Seed la base de données
docker-compose exec api npm run prisma:seed

# 7. Tester l'API
curl http://localhost:3000/api/v1/auth/login

# 8. Accéder à la documentation
open http://localhost:3000/api/docs

# 9. Voir les logs en temps réel
docker-compose logs -f api

# 10. Arrêter quand vous avez fini
docker-compose down
```

---

## ✅ Avantages de Docker Compose pour MF-LMS

### Pour le Développement
- ✅ Installation en une commande
- ✅ Pas besoin d'installer PostgreSQL localement
- ✅ Environnement identique pour toute l'équipe
- ✅ Facile à réinitialiser (`docker-compose down -v`)

### Pour la Production
- ✅ Déploiement reproductible
- ✅ Mise à l'échelle facile
- ✅ Isolation des services
- ✅ Monitoring simplifié

### Pour les Tests
- ✅ Base de données de test isolée
- ✅ Tests d'intégration fiables
- ✅ CI/CD simplifié

---

## 🚀 Prochaines Étapes

Une fois que vous maîtrisez Docker Compose, vous pouvez :

1. **Kubernetes** : Pour des déploiements à grande échelle
2. **Docker Swarm** : Pour l'orchestration de clusters
3. **CI/CD** : Intégrer dans GitHub Actions, GitLab CI
4. **Monitoring** : Ajouter Prometheus + Grafana

---

## 📞 Ressources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

---

**Avec Docker Compose, votre application MF-LMS est prête à être déployée n'importe où en quelques secondes ! 🚀**
