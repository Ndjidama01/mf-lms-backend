# 🔧 Correction Erreur Prisma 7.x

## ❌ Erreur Rencontrée

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: The datasource property `url` is no longer supported in schema files.
```

## 🎯 Cause

Vous avez installé **Prisma 7.x** (version beta/preview) au lieu de **Prisma 5.x** (stable).

Prisma 7 a changé la façon de configurer la connexion à la base de données et n'est pas encore stable.

---

## ✅ Solution Recommandée : Downgrade vers Prisma 5.x

### Étape 1 : Supprimer les installations actuelles

```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Ou sur Windows
rmdir /s /q node_modules
del package-lock.json
```

### Étape 2 : Réinstaller avec Prisma 5.x

```bash
# Installer les dépendances (Prisma 5.22.0 est inclus dans package.json)
npm install

# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init
```

### Étape 3 : Seed la base de données

```bash
npx prisma db seed
```

---

## 🔍 Vérification de Version

Pour vérifier quelle version de Prisma vous avez :

```bash
npx prisma --version
```

**Version attendue** : `5.22.0` (ou 5.x)

**Si vous voyez** : `7.2.0` → Suivez les étapes ci-dessus

---

## 📦 Versions Correctes dans package.json

Le fichier `package.json` a été mis à jour avec les versions stables :

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0"
  }
}
```

---

## 🚀 Commandes Complètes (Windows)

```cmd
# 1. Nettoyer
rmdir /s /q node_modules
del package-lock.json

# 2. Installer
npm install

# 3. Vérifier la version de Prisma
npx prisma --version

# 4. Créer la base de données (si elle n'existe pas)
# Dans PostgreSQL :
# CREATE DATABASE mf_lms;

# 5. Configurer .env
# DATABASE_URL="postgresql://user:password@localhost:5432/mf_lms?schema=public"

# 6. Générer le client
npx prisma generate

# 7. Créer les tables
npx prisma migrate dev --name init

# 8. Seed les données
npm run prisma:seed

# 9. Démarrer l'application
npm run start:dev
```

---

## 🚀 Commandes Complètes (Linux/Mac)

```bash
# 1. Nettoyer
rm -rf node_modules package-lock.json

# 2. Installer
npm install

# 3. Vérifier la version de Prisma
npx prisma --version

# 4. Créer la base de données
createdb mf_lms

# 5. Configurer .env
# DATABASE_URL="postgresql://user:password@localhost:5432/mf_lms?schema=public"

# 6. Générer le client
npx prisma generate

# 7. Créer les tables
npx prisma migrate dev --name init

# 8. Seed les données
npm run prisma:seed

# 9. Démarrer l'application
npm run start:dev
```

---

## ⚠️ Si Vous Voulez Utiliser Prisma 7.x (Non Recommandé)

Si vous tenez à utiliser Prisma 7 (version preview), vous devez modifier le schéma :

### Option 1 : Supprimer url du schema.prisma

**Avant** :
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Après** :
```prisma
datasource db {
  provider = "postgresql"
  // url supprimé
}
```

### Option 2 : Créer prisma.config.ts

Créer `prisma/prisma.config.ts` :
```typescript
import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

**⚠️ Attention** : Prisma 7 est en preview et peut contenir des bugs !

---

## 🎯 Recommandation

**Utilisez Prisma 5.x** (solution ci-dessus) car :
- ✅ Stable et bien testé
- ✅ Documentation complète
- ✅ Compatible avec le projet
- ✅ Pas de changements breaking

---

## 🆘 En Cas de Problème

Si après le downgrade vous avez encore des erreurs :

1. **Vérifier la version** :
   ```bash
   npx prisma --version
   # Doit afficher 5.x
   ```

2. **Nettoyer le cache npm** :
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Vérifier PostgreSQL** :
   - PostgreSQL est démarré
   - La base de données existe
   - Les credentials dans .env sont corrects

4. **Tester la connexion** :
   ```bash
   npx prisma db pull
   ```

---

## ✅ Résultat Attendu

Après avoir suivi ces étapes, vous devriez voir :

```bash
$ npx prisma --version
prisma                  : 5.22.0
@prisma/client          : 5.22.0
Current platform        : windows
Query Engine (Node-API) : libquery-engine ...
Migration Engine        : migration-engine-cli ...
Format Binary           : prisma-fmt ...
```

Et les commandes Prisma fonctionneront sans erreur ! 🎉

---

## 📚 Ressources

- [Prisma 5 Documentation](https://www.prisma.io/docs/orm/prisma-client)
- [Prisma Migration Guide](https://www.prisma.io/docs/orm/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)
