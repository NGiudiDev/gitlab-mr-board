import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Badge = styled.span`
  align-items: center;
  background: ${({ $colors }) => $colors[0]};
  border-radius: 0.25rem;
  color: ${({ $colors }) => $colors[1]};
  display: inline-flex;
  font-size: 0.6875rem;
  font-weight: 600;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  text-decoration: none;
  ${focusRingStyles}
`;

export const Styles = {
  Badge,
};
