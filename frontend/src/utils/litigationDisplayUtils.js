const getPartyNames = (party) =>
  (Array.isArray(party?.name) ? party.name : [])
    .map((entry) =>
      typeof entry === "string" ? entry.trim() : entry?.name?.trim(),
    )
    .filter(Boolean);

const joinNames = (names) => {
  if (names.length < 2) return names[0] || "";
  if (names.length === 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

export const formatLitigationTitle = (litigation, fallbackTitle) => {
  const firstParty = joinNames(getPartyNames(litigation?.firstParty));
  const secondParty = joinNames(getPartyNames(litigation?.secondParty));

  if (firstParty && secondParty) {
    return `${firstParty} v. ${secondParty}`;
  }

  return fallbackTitle || "Litigation Matter";
};
