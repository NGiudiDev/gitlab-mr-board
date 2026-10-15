import styled from "styled-components";

import { disabledControlStyles, focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
  margin-top: 1.25rem;
`;

const Backdrop = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 68%);
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 1rem;
`;

const Branches = styled.p`
  overflow-wrap: anywhere;
  margin: 1rem 0 0;
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: 0.75rem;
`;

const CloseButton = styled.button`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    border-color: var(--color-control);
    color: var(--color-text-primary);
  }

  ${disabledControlStyles}
  ${focusRingStyles}
`;

const Details = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem 1rem;
  margin: 1.25rem 0 0;
  padding: 1rem 0;
  border-block: 1px solid var(--color-border-soft);

  dt {
    color: var(--color-text-muted);
    font-size: 0.6875rem;
    font-weight: 600;
  }

  dd {
    overflow-wrap: anywhere;
    margin: 0.25rem 0 0;
    color: var(--color-text-primary);
    font-size: 0.8125rem;
  }

  @media (max-width: 32rem) {
    grid-template-columns: 1fr;
  }
`;

const Dialog = styled.div`
  width: min(100%, 35rem);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  background: var(--color-surface-raised);
  box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 45%);
`;

const Form = styled.form`
  margin-top: 1rem;
`;

const GitLabLink = styled.a`
  display: inline-block;
  margin-top: 0.5rem;
  border-radius: 0.125rem;
  font-size: 0.75rem;
  ${focusRingStyles}
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.125rem;
  line-height: 1.4;
`;

const UploadDateInput = styled.input`
  width: 100%;
  margin-top: 0.375rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  color-scheme: dark;
  font-size: 0.8125rem;

  ${disabledControlStyles}
  ${focusRingStyles}
`;

const UploadDateLabel = styled.label`
  display: block;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

const UploadDateStatus = styled.p`
  min-height: 1rem;
  margin: 0.25rem 0 0;
  color: ${({ $error }) => $error ? "var(--color-conflict)" : "var(--color-text-muted)"};
  font-size: 0.6875rem;
`;

export const Styles = {
  Actions,
  Backdrop,
  Badges,
  Branches,
  CloseButton,
  Details,
  Dialog,
  Form,
  GitLabLink,
  Header,
  Title,
  UploadDateInput,
  UploadDateLabel,
  UploadDateStatus,
};
