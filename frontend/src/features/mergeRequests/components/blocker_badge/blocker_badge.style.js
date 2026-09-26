import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: ${({ $colors }) => $colors[0]};
  color: ${({ $colors }) => $colors[1]};
  font-size: 0.6875rem;
  font-weight: 600;
  text-decoration: none;
  ${focusRingStyles}
`;

export const Styles = {
  Badge,
};
