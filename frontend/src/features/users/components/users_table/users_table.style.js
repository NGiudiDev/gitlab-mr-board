import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;

  &:hover {
    border-color: var(--color-accent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ${focusRingStyles}
`;

const HeaderCell = styled.th`
  font-weight: 600;
  padding: 0.5rem ${({ $last }) => $last ? 0 : "1rem"} 0.5rem 0;
`;

const TableHead = styled.thead`
  color: var(--color-text-muted);
`;

const TableViewport = styled.div`
  overflow-x: auto;
`;

const UserCell = styled.td`
  color: ${({ $muted }) => $muted ? "var(--color-text-muted)" : "var(--color-text-primary)"};
  padding: 0.5rem ${({ $last }) => $last ? 0 : "1rem"} 0.5rem 0;
`;

const UserEmail = styled.th`
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-weight: 400;
  padding: 0.5rem 1rem 0.5rem 0;
`;

const UserRow = styled.tr`
  border-top: 1px solid var(--color-border-soft);
`;

const UsersTable = styled.table`
  border-collapse: collapse;
  color: var(--color-text-primary);
  font-size: 0.78125rem;
  text-align: left;
  width: 100%;
`;

export const Styles = {
  ActionButton,
  HeaderCell,
  TableHead,
  TableViewport,
  UserCell,
  UserEmail,
  UserRow,
  UsersTable,
};
