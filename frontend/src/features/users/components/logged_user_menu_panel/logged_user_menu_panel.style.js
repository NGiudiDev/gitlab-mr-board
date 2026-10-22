import styled, { css } from "styled-components";

import { Link } from "react-router";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const AccountDetails = styled.dl`
  border-block: 1px solid var(--color-border-soft);
  margin: 0;
  padding: 0.75rem 1rem;
`;

const AccountName = styled.dd`
  color: var(--color-text-primary);
  font-size: 0.875rem;
  margin: 0.125rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AccountTerm = styled.dt`
  color: var(--color-text-faint);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
`;

const Identity = styled.div`
  align-items: center;
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
`;

const IdentityText = styled.div`
  min-width: 0;
`;

const MenuActions = styled.div`
  padding: 0.5rem;
`;

const MenuPanel = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.55);
  margin-top: 0.5rem;
  overflow: hidden;
  position: absolute;
  right: 0;
  top: 100%;
  width: 18rem;
  z-index: 50;
`;

const TruncatedText = styled.p`
  color: ${({ $muted }) => $muted ? "var(--color-text-muted)" : "var(--color-text-primary)"};
  font-size: ${({ $muted }) => $muted ? "0.75rem" : "0.875rem"};
  font-weight: ${({ $muted }) => $muted ? 400 : 600};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const menuActionStyles = css`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.375rem;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  font-size: 0.875rem;
  gap: 0.625rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.625rem;
  text-align: left;
  width: 100%;

  &:hover {
    background: var(--color-surface-raised);
  }

  ${focusRingStyles}
`;

const MenuButton = styled.button`
  ${menuActionStyles}
`;

const MenuLink = styled(Link)`
  ${menuActionStyles}
`;

export const Styles = {
  AccountDetails,
  AccountName,
  AccountTerm,
  Identity,
  IdentityText,
  MenuActions,
  MenuButton,
  MenuLink,
  MenuPanel,
  TruncatedText,
};
