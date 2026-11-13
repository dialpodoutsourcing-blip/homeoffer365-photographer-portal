export type AddressLocality = {
  city: string;
  state: string;
  zip: string;
};

export const PENNSYLVANIA_SERVICE_LOCALITIES: readonly AddressLocality[] = [
  { city: "Lebanon", state: "PA", zip: "17042" },
  { city: "Harrisburg", state: "PA", zip: "17101" },
  { city: "Lancaster", state: "PA", zip: "17603" },
  { city: "Reading", state: "PA", zip: "19601" },
  { city: "York", state: "PA", zip: "17401" },
  { city: "Pottstown", state: "PA", zip: "19464" },
  { city: "Bethlehem", state: "PA", zip: "18018" },
  { city: "Easton", state: "PA", zip: "18042" },
] as const;

function localityQuery(value: string): string {
  return value.split(",").at(-1)?.trim().toLocaleLowerCase() ?? "";
}

export function findAddressLocalities(query: string, limit = 5): AddressLocality[] {
  const normalizedQuery = localityQuery(query);
  if (normalizedQuery.length < 2 || normalizedQuery === "pa") return [];

  return PENNSYLVANIA_SERVICE_LOCALITIES.filter(({ city, zip }) =>
    city.toLocaleLowerCase().startsWith(normalizedQuery) || zip.startsWith(normalizedQuery),
  ).slice(0, Math.max(0, limit));
}

export function formatAddressLocality(locality: AddressLocality): string {
  return `${locality.city}, ${locality.state} ${locality.zip}`;
}

export function applyAddressLocality(input: string, locality: AddressLocality): string {
  const formattedLocality = formatAddressLocality(locality);
  const trimmedInput = input.trim();
  const normalizedInput = trimmedInput.toLocaleLowerCase();
  const isStandaloneQuery = !trimmedInput.includes(",") && normalizedInput.length >= 2 && (
    locality.city.toLocaleLowerCase().startsWith(normalizedInput) || locality.zip.startsWith(normalizedInput)
  );
  if (isStandaloneQuery) return formattedLocality;

  const queryBoundary = trimmedInput.lastIndexOf(",");
  const streetAndUnit = (queryBoundary >= 0 ? trimmedInput.slice(0, queryBoundary) : trimmedInput).trim();
  return streetAndUnit ? `${streetAndUnit}, ${formattedLocality}` : formattedLocality;
}
