function iconFor(type, data) {
  if (type === "pipeline") {
    const status = data.status;
    if (status === "success") return "✓";
    if (status === "failed" || status === "canceled") return "✗";
    if (status === "running" || status === "pending") return "●";
    return "–";
  }
  if (type === "threads") return data.unresolvedCount > 0 ? "✉" : "✓";
  if (type === "approvals") return data.status === "approved" ? "✓" : "✎";
  if (type === "conflicts") return data.hasConflicts ? "✗" : "✓";
  return "";
}

function labelFor(type, data) {
  if (type === "pipeline") {
    const map = { success: "CI OK", failed: "CI Falló", running: "CI...", pending: "CI...", canceled: "CI Cancel", none: "Sin CI" };
    return map[data.status] || "CI ?";
  }
  if (type === "threads") {
    const count = data.unresolvedCount;
    return count > 0 ? `${count} hilo${count > 1 ? "s" : ""}` : "Hilos OK";
  }
  if (type === "approvals") {
    if (data.status === "unknown") return "Approvals ?";
    return `${data.given}/${data.required}`;
  }
  if (type === "conflicts") return data.hasConflicts ? "Con conflictos" : "Sin conflictos";
  return "";
}

function tooltipFor(type, data) {
  if (type === "pipeline") return `Pipeline: ${data.status}`;
  if (type === "threads") return `${data.unresolvedCount} hilos sin resolver`;
  if (type === "approvals") {
    if (data.status === "unknown") return "No se pudo obtener info de approvals";
    const { given, required, approvers, hasLeadApproval } = data;
    const parts = [`${given}/${required} aprobaciones`];
    if (approvers && approvers.length > 0) parts.push(`Aprobado por: ${approvers.join(", ")}`);
    if (!hasLeadApproval) parts.push("Falta aprobación del líder");
    return parts.join("\n");
  }
  if (type === "conflicts") {
    return data.hasConflicts ? "Tiene conflictos de merge" : "Sin conflictos de merge";
  }
  return "";
}

function badgeColors(type, data) {
  if (type === "pipeline") {
    const status = data.status;
    if (status === "success") return ["var(--color-ready-soft)", "var(--color-ready)"];
    if (status === "failed" || status === "canceled") return ["var(--color-conflict-soft)", "var(--color-conflict)"];
    if (status === "running" || status === "pending") return ["var(--color-draft-soft)", "var(--color-draft)"];
    return ["var(--color-surface)", "var(--color-text-muted)"];
  }
  if (type === "threads") {
    return data.unresolvedCount > 0
      ? ["var(--color-conflict-soft)", "var(--color-conflict)"]
      : ["var(--color-ready-soft)", "var(--color-ready)"];
  }
  if (type === "approvals") {
    if (data.status === "approved") return ["var(--color-ready-soft)", "var(--color-ready)"];
    if (data.status === "pending") return ["var(--color-draft-soft)", "var(--color-draft)"];
    return ["var(--color-surface)", "var(--color-text-muted)"];
  }
  if (type === "conflicts") {
    return data.hasConflicts
      ? ["var(--color-conflict-soft)", "var(--color-conflict)"]
      : ["var(--color-ready-soft)", "var(--color-ready)"];
  }
  return ["var(--color-surface)", "var(--color-text-muted)"];
}

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: ${({ $colors }) => $colors[0]};
  color: ${({ $colors }) => $colors[1]};
  font-size: 0.6875rem;
  font-weight: 600;
  text-decoration: none;
  ${focusRingStyles}
`;

export function BlockerBadge(props) {
  const { data, type } = props;

  const linkUrl = type === "pipeline" ? data.pipelineUrl || null : null;
  const tooltip = tooltipFor(type, data);
  const colors = badgeColors(type, data);

  return (
    <Badge
      $colors={colors}
      aria-label={`${tooltip}${linkUrl ? ". Abre en una pestaña nueva." : ""}`}
      as={linkUrl ? "a" : "span"}
      href={linkUrl || undefined}
      rel={linkUrl ? "noopener" : undefined}
      target={linkUrl ? "_blank" : undefined}
      title={tooltip}
    >
      <span aria-hidden="true">{iconFor(type, data)}</span>
      <span>{labelFor(type, data)}</span>
      {linkUrl ? <VisuallyHidden>(abre en una pestaña nueva)</VisuallyHidden> : null}
    </Badge>
  );
}
import styled from "styled-components";

import { focusRingStyles, VisuallyHidden } from "../../../app/constants/styles.consts.js";
