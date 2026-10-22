import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Chevron = styled.span`
  color: var(--color-text-faint);
  font-size: 0.6875rem;
  transform: rotate(${({ $expanded }) => $expanded ? "90deg" : "0"});
  transition: transform 150ms ease;
`;

const Columns = styled.div`
  border-top: 1px solid var(--color-border-soft);
  display: ${({ $expanded }) => $expanded ? "flex" : "none"};
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.75rem;
`;

const Project = styled.section`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  overflow: hidden;
`;

const ProjectCount = styled.span`
  background: var(--color-surface-raised);
  border-radius: 9999px;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  margin-left: 0.25rem;
  padding: 0.125rem 0.5rem;
`;

const ProjectName = styled.span`
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
`;

const ProjectToggle = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  text-align: left;
  width: 100%;

  &:hover {
    background: var(--color-surface-raised);
  }

  ${focusRingStyles}

  &:focus-visible {
    outline-offset: -2px;
  }
`;

export const Styles = {
  Chevron,
  Columns,
  Project,
  ProjectCount,
  ProjectName,
  ProjectToggle,
};
