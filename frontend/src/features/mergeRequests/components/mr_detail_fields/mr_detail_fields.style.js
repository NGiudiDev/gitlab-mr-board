import styled from "styled-components";

const Details = styled.dl`
  border-block: 1px solid var(--color-border-soft);
  display: grid;
  gap: 0.875rem 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 1.25rem 0 0;
  padding: 1rem 0;

  dt {
    color: var(--color-text-muted);
    font-size: 0.6875rem;
    font-weight: 600;
  }

  dd {
    color: var(--color-text-primary);
    font-size: 0.8125rem;
    margin: 0.25rem 0 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 32rem) {
    grid-template-columns: 1fr;
  }
`;

export const Styles = {
  Details,
};
