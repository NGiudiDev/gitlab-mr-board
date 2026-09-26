import styled from "styled-components";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const ActionButton = styled.button`
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.75rem;
  cursor: pointer;

  &:hover {
    border-color: var(--color-accent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ${focusRingStyles}
`;

const AdminSection = styled.section`
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
`;

const CreateButton = styled(AppStyles.Button)`
  margin-top: 0.75rem;
`;

const CreateForm = styled.form`
  margin-bottom: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const FormHeading = styled.h3`
  margin: 0 0 0.75rem;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
`;

const HeaderCell = styled.th`
  padding: 0.5rem ${({ $last }) => $last ? 0 : "1rem"} 0.5rem 0;
  font-weight: 600;
`;

const TableHead = styled.thead`
  color: var(--color-text-muted);
`;

const TableViewport = styled.div`
  overflow-x: auto;
`;

const UserCell = styled.td`
  padding: 0.5rem ${({ $last }) => $last ? 0 : "1rem"} 0.5rem 0;
  color: ${({ $muted }) => $muted ? "var(--color-text-muted)" : "var(--color-text-primary)"};
`;

const UserEmail = styled.th`
  padding: 0.5rem 1rem 0.5rem 0;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-weight: 400;
`;

const UserRow = styled.tr`
  border-top: 1px solid var(--color-border-soft);
`;

const UsersTable = styled.table`
  width: 100%;
  color: var(--color-text-primary);
  font-size: 0.78125rem;
  text-align: left;
  border-collapse: collapse;
`;

export const Styles = {
  ActionButton,
  AdminSection,
  CreateButton,
  CreateForm,
  FormGrid,
  FormHeading,
  HeaderCell,
  TableHead,
  TableViewport,
  UserCell,
  UserEmail,
  UserRow,
  UsersTable,
};
