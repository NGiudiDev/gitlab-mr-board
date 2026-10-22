import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { Styles } from "./mr_upload_date_form.style.js";

/**
 * Campo de fecha de subida, disponible sólo para los merge requests listos
 * para mergear. El estado del guardado lo administra `useUploadDateForm`.
 */
export function MrUploadDateForm(props) {
  const {
    error = "",
    fieldId,
    onCancel = () => {},
    onChange = () => {},
    onSubmit = () => {},
    saving = false,
    statusId,
    uploadDate = "",
  } = props;

  return (
    <Styles.Form onSubmit={onSubmit}>
      <Styles.UploadDateLabel htmlFor={fieldId}>
        Fecha de subida
      </Styles.UploadDateLabel>

      <Styles.UploadDateInput
        aria-describedby={statusId}
        disabled={saving}
        id={fieldId}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={uploadDate}
      />

      <Styles.UploadDateStatus
        $error={Boolean(error)}
        id={statusId}
        role={error ? "alert" : "status"}
      >
        {saving ? "Guardando fecha..." : error}
      </Styles.UploadDateStatus>

      <AppStyles.DialogActions>
        <AppStyles.SecondaryButton disabled={saving} onClick={onCancel} type="button">
          Cancelar
        </AppStyles.SecondaryButton>

        <AppStyles.Button disabled={saving} type="submit">
          {saving ? "Guardando..." : "Guardar"}
        </AppStyles.Button>
      </AppStyles.DialogActions>
    </Styles.Form>
  );
}
