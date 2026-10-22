import styled from "styled-components";

const Avatar = styled.span`
  align-items: center;
  background: var(--color-accent);
  border-radius: 999px;
  color: var(--color-bg);
  display: flex;
  flex: none;
  font-size: ${({ $large }) => $large ? "0.875rem" : "0.75rem"};
  font-weight: 700;
  height: ${({ $large }) => $large ? "2.75rem" : "2rem"};
  justify-content: center;
  width: ${({ $large }) => $large ? "2.75rem" : "2rem"};
`;

export const Styles = {
  Avatar,
};
