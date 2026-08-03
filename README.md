# ISSP CRM

Interní CRM pro evidenci zákazníků, projektů, odvedené práce, faktur a služeb.

Plná specifikace: [PROJECT.md](./PROJECT.md)

## Rychlý start (lokálně)

```bash
cp .env.example .env.local
# doplň DATABASE_URL, NEXTAUTH_SECRET, AZURE_AD_*
npm install
npm run db:migrate
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## Git & Vercel

- Repozitář: https://github.com/ondrejholousCZ/issupport_crm
- Hosting: Vercel
- Cron: `/api/cron/daily` každý den v 6:00 UTC (faktury po splatnosti, přehled služeb)

## Infrastruktura

| Služba | Hodnota |
|---|---|
| PostgreSQL | `apireg` @ resvm1.issupport.cz, schema `crmissp` |
| Auth | Microsoft Entra ID (stejný tenant jako FaktuMatch) |
| UI | Desktop-first (mobil/tablet layout ve fázi 2) |

## Provize databáze

1. Spusť `database/00_provision.sql` jako superuser (DB `apireg` už existuje — nevytvářet znovu)
2. Spusť `npm run db:migrate`
3. V Entra ID vytvoř Enterprise App (nebo použij existující) a doplň `AZURE_AD_*` do env
4. Po prvním přihlášení se uživatel auto-založí v `crmissp.users`; roli `admin` nastav v DB ručně

## Entra ID — nová App Registration

1. Azure Portal → Entra ID → App registrations → New registration
2. Název: `ISSP CRM`, Redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id` (Web)
3. Po vytvoření: Client ID + Tenant ID → do `.env.local`
4. Certificates & secrets → nový client secret → `AZURE_AD_CLIENT_SECRET`
5. Pro produkci (Vercel) přidej redirect: `https://<tvoje-url>/api/auth/callback/microsoft-entra-id`
6. Enterprise applications → tvoje app → Users and groups → přiřaď uživatele

## Připojení k DB z lokálu

PostgreSQL na `resvm1` povoluje přímé připojení jen z whitelistovaných IP (Vercel, interní síť).
Z domova/Macu typicky potřebuješ **SSH tunel**:

```bash
ssh -L 5432:127.0.0.1:5432 <user>@resvm1.issupport.cz
```

A v `.env.local` dočasně:

```
DATABASE_URL=postgresql://crmissp:<heslo>@127.0.0.1:5432/apireg?options=-c%20search_path%3Dcrmissp
DATABASE_SSL=false
```

Alternativa: nechat na serveru přidat tvou veřejnou IP do `pg_hba.conf` (metoda **md5**, stejně jako u FaktuMatch):

```
host    apireg    crmissp    195.122.198.178/32    md5
```

Poté reload PostgreSQL (`pg_ctl reload` nebo `systemctl reload postgresql`).

## Struktura

```
src/
  app/              # Next.js App Router (UI + API)
  components/       # AppShell, formuláře, UI prvky
  lib/
    db/             # pg pool
    queries/        # SQL dotazy per entita
    actions/        # Server Actions (CRUD)
database/
  00_provision.sql
  schema.sql
  migrations/
```
