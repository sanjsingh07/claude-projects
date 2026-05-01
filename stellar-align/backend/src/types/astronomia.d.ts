// Type declarations for astronomia (no @types available)
declare module "astronomia/base" {
  const obj: Record<string, unknown>;
  export default obj;
  export * from "astronomia/base";
}

declare module "astronomia/julian" {
  export function CalendarGregorianToJD(
    year: number,
    month: number,
    day: number,
  ): number;
  export function JDToCalendarGregorian(jd: number): {
    year: number;
    month: number;
    day: number;
  };
  export function JDToDate(jd: number): Date;
  export function JDToTime(jd: number): number;
}

declare module "astronomia/solar" {
  export function apparentVSOP87(earth: unknown, jd: number): number;
  export function trueVSOP87(earth: unknown, jd: number): number;
}

declare module "astronomia/sidereal" {
  export function mean(jd: number): number;
  export function apparent(jd: number): number;
}

declare module "astronomia/nutation" {
  export function nutation(jd: number): {
    dPsi: number;
    dEps: number;
  };
  export function meanObliquity(jd: number): number;
}

declare module "astronomia/moonposition" {
  export function position(jd: number): {
    lon: number;
    lat: number;
    dist: number;
  };
}

declare module "astronomia/moonphase" {
  export function phase(jd: number): number;
  export function phaseName(jd: number): string;
}

declare module "astronomia/planetposition" {
  export class Planet {
    constructor(data: unknown);
    position(jd: number): {
      lon: number;
      lat: number;
      range: number;
    };
  }
}

declare module "astronomia/coord" {
  export function eclipticToEquatorial(
    lon: number,
    lat: number,
    obliquity: number,
  ): { ra: number; dec: number };
  export function equatorialToHorizontal(
    ra: number,
    dec: number,
    lst: number,
    lat: number,
  ): { alt: number; az: number };
}

declare module "astronomia/data/vsop87Bmercury" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bvenus" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bearth" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bmars" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bjupiter" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bsaturn" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Buranus" {
  const data: unknown;
  export default data;
}
declare module "astronomia/data/vsop87Bneptune" {
  const data: unknown;
  export default data;
}