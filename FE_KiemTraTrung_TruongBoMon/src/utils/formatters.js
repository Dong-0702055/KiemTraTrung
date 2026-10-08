export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function topicCode(topic) {
  return topic.topic_code || `DT-${String(topic.id).padStart(4, "0")}`;
}
