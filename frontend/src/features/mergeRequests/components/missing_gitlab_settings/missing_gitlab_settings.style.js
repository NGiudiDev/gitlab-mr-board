import styled from "styled-components";

import { Link } from "react-router";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

const Message = styled.p`
  margin: 0 0 0.75rem;
`;

const SettingsLink = styled(AppStyles.Button).attrs({ as: Link })`
  display: inline-block;
  text-decoration: none;
`;

export const Styles = {
  Message,
  SettingsLink,
};
