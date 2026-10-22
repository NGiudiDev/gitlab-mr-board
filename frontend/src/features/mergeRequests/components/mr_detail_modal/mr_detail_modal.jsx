import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { keepFocusInside } from "../../../../app/utils/focus.utils.js";

import { MrBlockers } from "../mr_blockers/mr_blockers.jsx";
import { MrDetailFields } from "../mr_detail_fields/mr_detail_fields.jsx";
import { MrUploadDateForm } from "../mr_upload_date_form/mr_upload_date_form.jsx";

import { Styles } from "./mr_detail_modal.style.js";

import { useUploadDateForm } from "../../hooks/useUploadDateForm.js";

export function MrDetailModal(props) {
  const {
    mr,
    onClose = () => {},
    onUploadDateChange = async () => {},
  } = props;

  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  const uploadDateForm = useUploadDateForm(mr, onUploadDateChange, onClose);

  const headingId = `mr-detail-title-${mr.id}`;
  const statusId = `upload-date-status-${mr.id}`;

  // El diálogo toma el foco al abrirse, bloquea el scroll del fondo y devuelve
  // el foco a quien lo abrió al cerrarse.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  function handleBackdropMouseDown(event) {
    if (event.target !== event.currentTarget || uploadDateForm.saving) return;

    onClose();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && !uploadDateForm.saving) {
      event.preventDefault();
      onClose();
      return;
    }

    keepFocusInside(event, dialogRef.current);
  }

  return createPortal(
    <Styles.Backdrop onMouseDown={handleBackdropMouseDown}>
      <Styles.Dialog
        aria-labelledby={headingId}
        aria-modal="true"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <Styles.Header>
          <Styles.Title id={headingId}>{mr.title}</Styles.Title>

          <Styles.CloseButton
            aria-label="Cerrar detalle del merge request"
            disabled={uploadDateForm.saving}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </Styles.CloseButton>
        </Styles.Header>

        <Styles.GitLabLink href={mr.url} rel="noopener" target="_blank">
          Abrir merge request en GitLab
          <AppStyles.VisuallyHidden> (abre en una pestaña nueva)</AppStyles.VisuallyHidden>
        </Styles.GitLabLink>

        <Styles.Branches>
          {mr.sourceBranch} → {mr.targetBranch}
        </Styles.Branches>

        <Styles.Badges>
          <MrBlockers mr={mr} />
        </Styles.Badges>

        <MrDetailFields mr={mr} />

        {mr.mergeability === "ready_to_merge" ? (
          <MrUploadDateForm
            error={uploadDateForm.error}
            fieldId={`upload-date-${mr.id}`}
            onCancel={onClose}
            onChange={uploadDateForm.setUploadDate}
            onSubmit={uploadDateForm.submit}
            saving={uploadDateForm.saving}
            statusId={statusId}
            uploadDate={uploadDateForm.uploadDate}
          />
        ) : (
          <AppStyles.DialogActions>
            <AppStyles.Button onClick={onClose} type="button">Cerrar</AppStyles.Button>
          </AppStyles.DialogActions>
        )}
      </Styles.Dialog>
    </Styles.Backdrop>,
    document.body,
  );
}
