import styled from "styled-components";

import { NavLink } from "react-router";

import { focusRingStyles, visuallyHiddenStyles } from "../../constants/styles.consts.js";

const Brand = styled.h1`
  align-items: center;
  color: var(--color-text-primary);
  display: flex;
  font-size: 0.8125rem;
  font-weight: 600;
  gap: 0.5rem;
  margin: 0;
`;

const BrandDot = styled.span`
  background: var(--color-accent);
  border-radius: 999px;
  flex: none;
  height: 0.5rem;
  width: 0.5rem;
`;

const Header = styled.header`
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 40;
`;

const HeaderContent = styled.div`
  align-items: center;
  column-gap: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  margin: 0 auto;
  max-width: 100rem;
  padding: 0.625rem 1.25rem;
  row-gap: 0.5rem;
`;

const Main = styled.main`
  margin: 0 auto;
  max-width: 100rem;
  padding: 1.25rem;
  scroll-margin-top: 4rem;
`;

const NavigationList = styled.ul`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavigationLink = styled(NavLink)`
  border-radius: 0.375rem;
  color: var(--color-text-muted);
  cursor: pointer;
  display: block;
  font-size: 0.8125rem;
  padding: 0.25rem 0.625rem;

  &:hover {
    color: var(--color-text-primary);
  }

  &[aria-current="page"] {
    background: var(--color-surface-raised);
    color: var(--color-text-primary);
    font-weight: 600;
  }

  ${focusRingStyles}
`;

const SkipLink = styled.a`
  ${visuallyHiddenStyles}

  &:focus {
    background: var(--color-accent);
    border-radius: 0.375rem;
    clip: auto;
    color: var(--color-bg);
    font-weight: 600;
    height: auto;
    left: 1rem;
    margin: 0;
    padding: 0.5rem 1rem;
    position: fixed;
    top: 1rem;
    width: auto;
    z-index: 50;
  }
`;

export const Styles = {
  Brand,
  BrandDot,
  Header,
  HeaderContent,
  Main,
  NavigationList,
  NavigationLink,
  SkipLink,
};