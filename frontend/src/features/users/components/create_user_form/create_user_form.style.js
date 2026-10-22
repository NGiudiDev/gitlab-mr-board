import styled from "styled-components";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

const CreateButton = styled(AppStyles.Button)`
  margin-top: 0.75rem;
`;

const CreateForm = styled.form`
  margin-bottom: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const FormHeading = styled.h3`
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
`;

export const Styles = {
  CreateButton,
  CreateForm,
  FormGrid,
  FormHeading,
};
