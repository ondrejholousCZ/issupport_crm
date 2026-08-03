# Nasazení na Vercel

## Import projektu

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Vyber `ondrejholousCZ/issupport_crm`
3. Framework Preset: **Next.js** (mělo se detekovat automaticky z `vercel.json`)
4. Root Directory: prázdné
5. Build Command / Output Directory: **Override vypnuto** (default `next build`)
6. Deploy

## Environment Variables (Production + Preview)

| Proměnná | Popis |
|---|---|
| `NEXTAUTH_URL` | `https://<projekt>.vercel.app` (po prvním deployi upřesni) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `DATABASE_URL` | `postgresql://crmissp:<heslo>@resvm1.issupport.cz:5432/apireg?options=-c%20search_path%3Dcrmissp` |
| `DATABASE_SSL` | `false` |
| `AZURE_AD_CLIENT_ID` | Entra App Registration |
| `AZURE_AD_CLIENT_SECRET` | Client secret |
| `AZURE_AD_TENANT_ID` | Tenant ID |
| `CRON_SECRET` | `openssl rand -base64 32` |
| `DAIS_API_BASE_URL` | `https://resvm1.issupport.cz:8443/api/v1` |
| `DAIS_API_KEY` | API klíč pro lookup IČO |

## Entra ID — redirect URI pro produkci

Po prvním deployi přidej v Azure Portal:

```
https://<projekt>.vercel.app/api/auth/callback/microsoft-entra-id
```

## Cron

V `vercel.json` je `/api/cron/daily` (6:00 UTC). Na Vercel Pro plán cron běží automaticky; endpoint vyžaduje header `Authorization: Bearer ${CRON_SECRET}`.

## Po deployi

1. Přihlas se přes Microsoft
2. V DB nastav admin roli: `UPDATE crmissp.users SET role = 'admin' WHERE email = 'tvuj@email';`
