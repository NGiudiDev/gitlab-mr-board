import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const Branches = styled.div`
  overflow: hidden;
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: 0.65625rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Card = styled.article`
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border-soft);
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 0.375rem;
  background: var(--color-surface-raised);
`;

const DetailLabel = styled.span`
  color: var(--color-text-muted);
  font-size: 0.625rem;
  font-weight: 600;
`;

const Details = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const DetailValue = styled.span`
  color: var(--color-text-primary);
  font-size: 0.625rem;
`;

const Metadata = styled.span`
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TitleLink = styled.a`
  display: block;
  margin-bottom: 0.375rem;
  border-radius: 0.125rem;
  font-size: 0.8125rem;
  line-height: 1.375;
  ${focusRingStyles}
`;

export const Styles = {
  Badges,
  Branches,
  Card,
  DetailLabel,
  Details,
  DetailValue,
  Metadata,
  TitleLink,
};
