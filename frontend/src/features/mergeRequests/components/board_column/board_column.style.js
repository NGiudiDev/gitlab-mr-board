import styled from "styled-components";

const CardList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  max-height: 60vh;
  overflow-y: auto;
  padding: 0.5rem;
`;

const Column = styled.section`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  max-width: 250px;
  min-width: 250px;
`;

const ColumnHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid var(--color-border-soft);
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
`;

const ColumnTitle = styled.h3`
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0;
`;

const Count = styled.span`
  background: var(--color-surface);
  border-radius: 9999px;
  color: var(--color-text-faint);
  font-size: 0.65625rem;
  padding: 0.125rem 0.375rem;
  position: relative;
`;

export const Styles = {
  CardList,
  Column,
  ColumnHeader,
  ColumnTitle,
  Count,
};
