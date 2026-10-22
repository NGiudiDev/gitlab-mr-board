import styled from "styled-components";

import { visuallyHiddenStyles } from "../../../../app/constants/styles.consts.js";

const BoardHeading = styled.h2`
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;

  ${({ $visible }) => !$visible && visuallyHiddenStyles}
`;

const ErrorDetail = styled.p`
  color: var(--color-conflict);
  font-size: 0.75rem;
  margin: 0;
`;

const ErrorHeading = styled.p`
  margin: 0 0 0.5rem;
`;

const LastUpdated = styled.p`
  color: var(--color-text-faint);
  font-size: 0.75rem;
  margin: 1rem 0 0;
`;

const Toolbar = styled.div`
  align-items: center;
  border-bottom: 1px solid var(--color-border-soft);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
`;

export const Styles = {
  BoardHeading,
  ErrorDetail,
  ErrorHeading,
  LastUpdated,
  Toolbar,
};
