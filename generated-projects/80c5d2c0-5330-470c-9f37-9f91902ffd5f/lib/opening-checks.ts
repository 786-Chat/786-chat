export const OPENING_TASKS = [
  "Hand wash basin has hot/cold running water, soap & towels",
  "Equipment working: fridges, freezers, cooking equipment, dishwasher and hot/cold water",
  "Waste area and sanitisers available; colour-coded cloths ready",
  "Floors clean from the previous day",
  "Food and hand-contact surfaces clean from the previous day",
  "No dirty washing-up left from the previous day",
  "Waste cleared from the previous day",
  "Food handlers fit for work and any required declarations completed",
  "No out-of-date food products; food correctly covered and stored",
] as const;

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function londonDateISO(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) throw new Error("Unable to resolve London business date");
  return `${year}-${month}-${day}`;
}

export function addIsoDays(dateString: string, amount: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function dayNameFromIso(dateString: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
  }).format(new Date(`${dateString}T12:00:00Z`));
}
