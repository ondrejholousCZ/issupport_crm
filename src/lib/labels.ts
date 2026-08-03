import type {
  DruhCinnosti,
  FakturaStav,
  FakturaTyp,
  PracovnikTyp,
  ProjektJednotkaSazby,
  ProjektStav,
  SluzbaFrekvence,
  SluzbaStav,
  StavFakturace,
  ZakaznikStav,
} from "./types";

export const zakaznikStavLabels: Record<ZakaznikStav, string> = {
  aktivni: "Aktivní",
  neaktivni: "Neaktivní",
};

export const pracovnikTypLabels: Record<PracovnikTyp, string> = {
  zamestnanec: "Zaměstnanec",
  dodavatel: "Dodavatel",
};

export const projektStavLabels: Record<ProjektStav, string> = {
  aktivni: "Aktivní",
  pozastaven: "Pozastaven",
  uzavren: "Uzavřen",
};

export const projektJednotkaSazbyLabels: Record<ProjektJednotkaSazby, string> = {
  hodina: "Hodina (h)",
  md: "MD (8 h)",
};

export const fakturaStavLabels: Record<FakturaStav, string> = {
  rozpracovana: "Rozpracovaná",
  vystavena: "Vystavená",
  uhrazena: "Uhrazená",
  po_splatnosti: "Po splatnosti",
  storno: "Storno",
};

export const fakturaTypLabels: Record<FakturaTyp, string> = {
  projektova: "Projektová",
  servisni: "Servisní",
  zaloha: "Záloha",
  dobropis: "Dobropis",
};

export const sluzbaFrekvenceLabels: Record<SluzbaFrekvence, string> = {
  mesicne: "Měsíčně",
  kvartalne: "Kvartálně",
  pololetne: "Pololetně",
  rocne: "Ročně",
  vlastni: "Vlastní",
};

export const FREKVENCE_DNU: Record<Exclude<SluzbaFrekvence, "vlastni">, number> = {
  mesicne: 30,
  kvartalne: 90,
  pololetne: 182,
  rocne: 365,
};

export const sluzbaStavLabels: Record<SluzbaStav, string> = {
  aktivni: "Aktivní",
  pozastavena: "Pozastavena",
  ukoncena: "Ukončena",
};

export const druhCinnostiLabels: Record<DruhCinnosti, string> = {
  prace: "Práce",
  administrativa: "Administrativa",
  konzultace: "Konzultace",
  cestovne: "Cestovné",
};

export const stavFakturaceLabels: Record<StavFakturace, string> = {
  nefakturovano: "Nefakturováno",
  fakturovano: "Fakturováno",
  storno: "Storno",
};
