import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Chevron = styled.span`
  color: var(--color-text-faint);
  font-size: 0.6875rem;
  transform: rotate(${({ $expanded }) => $expanded ? "90deg" : "0"});
  transition: transform 150ms ease;
`;

const Columns = styled.div`
  display: ${({ $expanded }) => $expanded ? "flex" : "none"};
  gap: 0.75rem;
  padding: 0.75rem;
  overflow-x: auto;
  border-top: 1px solid var(--color-border-soft);
`;

const Project = styled.section`
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
`;

const ProjectCount = styled.span`
  margin-left: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  font-size: 0.6875rem;
`;

const ProjectName = styled.span`
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
`;

const Projects = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ProjectToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

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
  Projects,
  ProjectToggle,
};
