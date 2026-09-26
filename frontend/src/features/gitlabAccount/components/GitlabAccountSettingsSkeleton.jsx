import styled, { keyframes } from "styled-components";

import { Styles } from "../../../app/app.styles.jsx";

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
  width: ${({ $width }) => $width};
  height: 0.75rem;
  margin: ${({ $hint }) => $hint ? "0.5rem 0 0" : "0 0 0.5rem"};
  border-radius: 0.25rem;
  background: var(--color-surface-raised);
`;

const SkeletonField = styled.div`
  width: 100%;
  height: 2.5rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 0.375rem;
  background: var(--color-surface-raised);
`;

const SkeletonButton = styled.div`
  width: 11rem;
  height: 2.25rem;
  border-radius: 0.375rem;
  background: var(--color-surface-raised);
`;

export function GitlabAccountSettingsSkeleton(props) {
  const { canEdit = false } = props;

  return (
    <div aria-busy="true" role="status">
      <Styles.VisuallyHidden>Cargando la configuración...</Styles.VisuallyHidden>

      <SkeletonContent aria-hidden="true">
        <div>
          <SkeletonLine $width="7rem" />
          <SkeletonField />
          <SkeletonLine $hint $width="80%" />
        </div>

        <div>
          <SkeletonLine $width="5rem" />
          <SkeletonField />
          <SkeletonLine $hint $width="60%" />
        </div>

        {canEdit ? <SkeletonButton /> : null}
      </SkeletonContent>
    </div>
  );
}
