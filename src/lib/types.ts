export type UserRole = "admin" | "user";

export type ZakaznikStav = "aktivni" | "neaktivni";
export type PracovnikTyp = "zamestnanec" | "dodavatel";
export type ProjektStav = "aktivni" | "pozastaven" | "uzavren";
export type FakturaStav = "rozpracovana" | "vystavena" | "uhrazena" | "po_splatnosti" | "storno";
export type FakturaTyp = "projektova" | "servisni" | "zaloha" | "dobropis";
export type SluzbaFrekvence = "mesicne" | "kvartalne" | "pololetne" | "rocne" | "vlastni";
export type SluzbaStav = "aktivni" | "pozastavena" | "ukoncena";
export type DruhCinnosti = "prace" | "administrativa" | "konzultace" | "cestovne";
export type StavFakturace = "nefakturovano" | "fakturovano" | "storno";

export interface Zakaznik {
  id: string;
  ico: string | null;
  nazev: string;
  ic_dph: string | null;
  kontaktni_email: string | null;
  kontaktni_telefon: string | null;
  fakturacni_ulice: string | null;
  fakturacni_mesto: string | null;
  fakturacni_psc: string | null;
  postup_fakturace: string | null;
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
  created_at: string;
  updated_at: string;
  zakaznik_nazev?: string;
  projekt_nazev?: string | null;
  sluzba_nazev?: string | null;
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
  projekt_nazev?: string;
  projekt_zakazka?: string | null;
  projekt_sazba_fak?: string | null;
  pracovnik_jmeno?: string;
  pracovnik_jmeno_krestni?: string;
  pracovnik_prijmeni?: string;
}

export interface DashboardStats {
  zakaznici: number;
  aktivni_projekty: number;
  nefakturovana_prace: number;
  sluzby_blizko_fakturace: number;
}
