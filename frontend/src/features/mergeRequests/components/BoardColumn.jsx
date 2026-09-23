import styled from "styled-components";

import { VisuallyHidden } from "../../../app/constants/styles.consts.js";

import { MrCard } from "./MrCard.jsx";

const Column = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 250px;
  max-width: 250px;
  border: 1px solid var(--color-border-soft);
  border-radius: 0.5rem;
  background: var(--color-surface-raised);
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border-soft);
`;

const ColumnTitle = styled.h3`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

const Count = styled.span`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  background: var(--color-surface);
  color: var(--color-text-faint);
  font-size: 0.65625rem;
`;

const CardList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 60vh;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  list-style: none;
`;

export function BoardColumn(props) {
  const { idPrefix, mergeRequests, title } = props;

  const headingId = `columna-${idPrefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <Column aria-labelledby={headingId}>
      <ColumnHeader>
        <ColumnTitle id={headingId}>{title}</ColumnTitle>
        <Count>
          <span aria-hidden="true">{mergeRequests.length}</span>
          <VisuallyHidden>{mergeRequests.length} merge requests</VisuallyHidden>
        </Count>
      </ColumnHeader>

      <CardList role="list">
        {mergeRequests.map((mr) => (
          <li key={mr.id}>
            <MrCard mr={mr} />
          </li>
        ))}
      </CardList>
    </Column>
  );
}
