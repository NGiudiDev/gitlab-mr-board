import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  50% { opacity: 0.5; }
`;

const SkeletonContent = styled.div`
  display: grid;
  gap: 1rem;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const SkeletonLine = styled.div`
  background: var(--color-surface-raised);
  border-radius: 0.25rem;
  height: 0.75rem;
  margin: ${({ $hint }) => $hint ? "0.5rem 0 0" : "0 0 0.5rem"};
  width: ${({ $width }) => $width};
`;

const SkeletonField = styled.div`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.375rem;
  height: 2.5rem;
  width: 100%;
`;

const SkeletonButton = styled.div`
  background: var(--color-surface-raised);
  border-radius: 0.375rem;
  height: 2.25rem;
  width: 11rem;
`;

export const Styles = {
  SkeletonButton,
  SkeletonContent,
  SkeletonField,
  SkeletonLine,
};
