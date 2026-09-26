import styled from "styled-components";

import { visuallyHiddenStyles } from "../../../../app/constants/styles.consts.js";

const BoardHeading = styled.h2`
  margin: 0 0 0.75rem;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;

  ${({ $visible }) => !$visible && visuallyHiddenStyles}
`;

const ErrorDetail = styled.p`
  margin: 0;
  color: var(--color-conflict);
  font-size: 0.75rem;
`;

const ErrorHeading = styled.p`
  margin: 0 0 0.5rem;
`;

const LastUpdated = styled.p`
  margin: 1rem 0 0;
  color: var(--color-text-faint);
  font-size: 0.75rem;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.25rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-soft);
`;

export const Styles = {
  BoardHeading,
  ErrorDetail,
  ErrorHeading,
  LastUpdated,
  Toolbar,
};
