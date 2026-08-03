export class DaisCompanyNotFoundError extends Error {
  readonly ico: string;

  constructor(ico: string) {
    super(`Subjekt s IČO ${ico} nebyl nalezen v DAIS portálu.`);
    this.name = "DaisCompanyNotFoundError";
    this.ico = ico;
  }
}

export class DaisApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DaisApiError";
  }
}
