import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Badges = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const Branches = styled.div`
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: 0.65625rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Card = styled.article`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-soft);
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 0.375rem;
  padding: 0.625rem 0.75rem;
  position: relative;

  a {
    position: relative;
    z-index: 2;
  }
`;

const DetailLabel = styled.span`
  color: var(--color-text-muted);
  font-size: 0.625rem;
  font-weight: 600;
`;

const Details = styled.div`
  align-items: center;
  display: flex;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const DetailValue = styled.span`
  color: var(--color-text-primary);
  font-size: 0.625rem;
`;

const Metadata = styled.span`
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OpenButton = styled.button`
  background: transparent;
  border: 0;
  border-radius: 0.375rem;
  cursor: pointer;
  inset: 0;
  padding: 0;
  position: absolute;
  width: 100%;
  z-index: 1;

  &:hover {
    background: rgb(255 255 255 / 2%);
  }

  ${focusRingStyles}
`;

const Title = styled.h4`
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.375;
  margin-bottom: 0.375rem;
  margin-top: 0;
`;

export const Styles = {
  Badges,
  Branches,
  Card,
  DetailLabel,
  Details,
  DetailValue,
  Metadata,
  OpenButton,
  Title,
};
