import styled, { css } from "styled-components";

import { Link } from "react-router";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const MenuContainer = styled.div`
  position: relative;
  margin-left: auto;
`;

const MenuTrigger = styled.button`
  display: flex;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.375rem;
  border: 1px solid var(--color-control);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-primary);

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-surface-raised);
  }

  ${focusRingStyles}
`;

const Avatar = styled.span`
  display: flex;
  width: ${({ $large }) => $large ? "2.75rem" : "2rem"};
  height: ${({ $large }) => $large ? "2.75rem" : "2rem"};
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: ${({ $large }) => $large ? "0.875rem" : "0.75rem"};
  font-weight: 700;
`;

const Chevron = styled.svg`
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
  transform: ${({ $open }) => $open ? "rotate(180deg)" : "none"};
  transition: transform 150ms ease;
`;

const MenuPanel = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  width: 18rem;
  margin-top: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.55);
`;

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
`;

const IdentityText = styled.div`
  min-width: 0;
`;

const TruncatedText = styled.p`
  overflow: hidden;
  margin: 0;
  color: ${({ $muted }) => $muted ? "var(--color-text-muted)" : "var(--color-text-primary)"};
  font-size: ${({ $muted }) => $muted ? "0.75rem" : "0.875rem"};
  font-weight: ${({ $muted }) => $muted ? 400 : 600};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AccountDetails = styled.dl`
  margin: 0;
  padding: 0.75rem 1rem;
  border-block: 1px solid var(--color-border-soft);
`;

const AccountTerm = styled.dt`
  color: var(--color-text-faint);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
`;

const AccountName = styled.dd`
  overflow: hidden;
  margin: 0.125rem 0 0;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuActions = styled.div`
  padding: 0.5rem;
`;

const menuActionStyles = css`
  display: flex;
  width: 100%;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-raised);
  }

  ${focusRingStyles}
`;

const MenuLink = styled(Link)`
  ${menuActionStyles}
`;

const MenuButton = styled.button`
  ${menuActionStyles}
`;

const MenuIcon = styled.svg`
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
`;

export const Styles = {
  MenuContainer,
  Chevron,
  MenuPanel,
  Identity,
  IdentityText,
  TruncatedText,
  AccountDetails,
  AccountTerm,
  AccountName,
  MenuActions,
  MenuLink,
  MenuButton,
  MenuIcon,
  MenuTrigger,
  Avatar,
};