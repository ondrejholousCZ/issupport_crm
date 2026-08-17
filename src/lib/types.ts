export type UserRole = "admin" | "user";

export type ZakaznikStav = "aktivni" | "neaktivni";
export type PracovnikTyp = "zamestnanec" | "dodavatel";
export type ProjektStav = "aktivni" | "pozastaven" | "uzavren";
export type ProjektJednotkaSazby = "hodina" | "md";
export type FakturaStav = "rozpracovana" | "vystavena" | "uhrazena" | "po_splatnosti" | "storno";
export type FakturaTyp = "projektova" | "servisni" | "zaloha" | "dobropis";
export type SluzbaFrekvence = "mesicne" | "kvartalne" | "pololetne" | "rocne" | "vlastni";
export type SluzbaStav = "aktivni" | "pozastavena" | "ukoncena";
export type DruhCinnosti = "prace" | "administrativa" | "konzultace" | "cestovne";
export type StavFakturace = "nefakturovano" | "schvaleni_vykazu" | "fakturovano" | "storno";
export type VykazStav = "rozpracovany" | "odeslany" | "schvaleny";
export type FakturacniJednotka = "md" | "hodina" | "ks";
export type DuzpTyp = "konec_obdobi" | "vystaveni";

export interface Zakaznik {
  id: string;
  ico: string | null;
  nazev: string;
  zkratka: string | null;
  kontaktni_email: string | null;
  fakturacni_email: string | null;
  kontaktni_telefon: string | null;
  fakturacni_ulice: string | null;
  fakturacni_mesto: string | null;
  fakturacni_psc: string | null;
  postup_fakturace: string | null;
  idoklad_partner_id: number | null;
  stav: ZakaznikStav;
  created_at: string;
  updated_at: string;
}

export interface Pracovnik {
  id: string;
  jmeno: string;
  prijmeni: string;
  email: string | null;
  typ: PracovnikTyp;
  naklad_na_hodinu: string | null;
  mena: string;
  sazba_platna_od: string | null;
  created_at: string;
  updated_at: string;
}

export interface Projekt {
  id: string;
  nazev_projektu: string;
  zakazka: string | null;
  zakaznik_id: string;
  datum_od: string | null;
  datum_do: string | null;
  hodinova_sazba_fak: string | null;
  jednotka_sazby: ProjektJednotkaSazby;
  mena: string;
  stav: ProjektStav;
  created_at: string;
  updated_at: string;
  zakaznik_nazev?: string;
}

export interface Faktura {
  id: string;
  cislo_faktury: string | null;
  zakaznik_id: string;
  projekt_id: string | null;
  sluzba_id: string | null;
  datum_vystaveni: string | null;
  datum_splatnosti: string | null;
  datum_uhrazeni: string | null;
  castka_bez_dph: string | null;
  dph_sazba: string | null;
  castka_celkem: string | null;
  stav: FakturaStav;
  typ_faktury: FakturaTyp | null;
  external_ref: string | null;
  vykaz_id: string | null;
  datum_duzp: string | null;
  idoklad_id: number | null;
  idoklad_url: string | null;
  odeslano_email: string | null;
  odeslano_at: string | null;
  created_at: string;
  updated_at: string;
  zakaznik_nazev?: string;
  zakaznik_fakturacni_email?: string | null;
  zakaznik_kontaktni_email?: string | null;
  projekt_nazev?: string | null;
  sluzba_nazev?: string | null;
}

export interface FakturaPolozka {
  id: string;
  faktura_id: string;
  nazev: string;
  mnozstvi: string;
  jednotka: string;
  cena_jednotka: string;
  dph_sazba: string;
  poradi: number;
}

export interface FakturacniSablona {
  id: string;
  projekt_id: string;
  text_sablona: string;
  jednotka: FakturacniJednotka;
  splatnost_dnu: number;
  duzp_typ: DuzpTyp;
  dph_sazba: string;
  created_at: string;
  updated_at: string;
}

export interface Sluzba {
  id: string;
  zakaznik_id: string;
  nazev_sluzby: string;
  frekvence: SluzbaFrekvence | null;
  frekvence_dnu: number | null;
  cena_periody: string | null;
  mena: string;
  posledni_platba: string | null;
  dalsi_fakturace: string | null;
  stav: SluzbaStav;
  created_at: string;
  updated_at: string;
  zakaznik_nazev?: string;
}

export interface OdvedenaPrace {
  id: string;
  datum: string | Date;
  hodiny: number;
  minuty: number;
  druh_cinnosti: DruhCinnosti | null;
  zakaznik_id: string;
  projekt_id: string;
  pracovnik_id: string;
  popis: string | null;
  castka_fakturace: string | null;
  castka_naklady: string | null;
  stav_fakturace: StavFakturace;
  faktura_id: string | null;
  created_at: string;
  updated_at: string;
  zakaznik_nazev?: string;
  zakaznik_zkratka?: string | null;
  projekt_nazev?: string;
  projekt_zakazka?: string | null;
  projekt_sazba_fak?: string | null;
  projekt_jednotka_sazby?: ProjektJednotkaSazby;
  pracovnik_jmeno?: string;
  pracovnik_jmeno_krestni?: string;
  pracovnik_prijmeni?: string;
  vykaz_id?: string | null;
}

export interface VykazPrace {
  id: string;
  zakaznik_id: string;
  obdobi: string;
  stav: VykazStav;
  poznamka_klienta: string | null;
  schvaleno_at: string | null;
  odeslano_at: string | null;
  odeslano_email: string | null;
  approval_token: string | null;
  faktura_id: string | null;
  created_at: string;
  updated_at: string;
  zakaznik_nazev?: string;
  zakaznik_email?: string | null;
  pocet_polozek?: number;
}

export interface DashboardStats {
  zakaznici: number;
  aktivni_projekty: number;
  nefakturovana_prace: number;
  sluzby_blizko_fakturace: number;
}
