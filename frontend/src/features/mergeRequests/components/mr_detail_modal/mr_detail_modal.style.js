import styled from "styled-components";

import { disabledControlStyles, focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Backdrop = styled.div`
  background: rgb(0 0 0 / 68%);
  display: grid;
  inset: 0;
  padding: 1rem;
  place-items: center;
  position: fixed;
  z-index: 1000;
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 1rem;
`;

const Branches = styled.p`
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  margin: 1rem 0 0;
  overflow-wrap: anywhere;
`;

const CloseButton = styled.button`
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--color-text-muted);
  cursor: pointer;
  display: grid;
  flex: 0 0 auto;
  font-size: 1.5rem;
  height: 2rem;
  line-height: 1;
  padding: 0;
  place-items: center;
  width: 2rem;

  svg {
    height: 1rem;
    width: 1rem;
  }

  &:hover {
    border-color: var(--color-control);
    color: var(--color-text-primary);
  }

  ${disabledControlStyles}
  ${focusRingStyles}
`;

const Dialog = styled.div`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 45%);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1.25rem;
  width: min(100%, 35rem);
`;

const GitLabLink = styled.a`
  border-radius: 0.125rem;
  display: inline-block;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  ${focusRingStyles}
`;

const Header = styled.header`
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
`;

const Title = styled.h2`
  color: var(--color-text-primary);
  font-size: 1.125rem;
  line-height: 1.4;
  margin: 0;
`;

export const Styles = {
  Backdrop,
  Badges,
  Branches,
  CloseButton,
  Dialog,
  GitLabLink,
  Header,
  Title,
};
