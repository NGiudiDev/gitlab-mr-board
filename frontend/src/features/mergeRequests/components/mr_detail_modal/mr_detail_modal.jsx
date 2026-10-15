import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BlockerBadge } from "../blocker_badge/blocker_badge.jsx";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./mr_detail_modal.style.js";

import { formatMergeRequestDateTime } from "../../utils/merge_request_format.utils.js";
import { keepFocusInside } from "../../../../app/utils/focus.utils.js";

export function MrDetailModal(props) {
  const {
    mr,
    onClose = () => {},
    onUploadDateChange = async () => {},
  } = props;

  const [uploadDate, setUploadDate] = useState(mr.uploadDate ?? "");
  const [uploadDateError, setUploadDateError] = useState("");
  const [savingUploadDate, setSavingUploadDate] = useState(false);
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  const assignee = mr.responsiblePeople.map((person) => person.name).join(", ");
  const headingId = `mr-detail-title-${mr.id}`;
  const projectName = mr.projectPath.split("/").at(-1);
  const statusId = `upload-date-status-${mr.id}`;

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
    if (event.target !== event.currentTarget || savingUploadDate) return;
    onClose();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && !savingUploadDate) {
      event.preventDefault();
      onClose();
      return;
    }

    keepFocusInside(event, dialogRef.current);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setUploadDateError("");
    setSavingUploadDate(true);

    try {
      await onUploadDateChange(mr.projectId, mr.iid, uploadDate);
      onClose();
    } catch (error) {
      setUploadDateError(error instanceof Error ? error.message : "No se pudo guardar la fecha.");
      setSavingUploadDate(false);
    }
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
            disabled={savingUploadDate}
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
          <BlockerBadge data={mr.blockers.pipeline} type="pipeline" />
          <BlockerBadge data={mr.blockers.threads} type="threads" />
          <BlockerBadge data={mr.blockers.approvals} type="approvals" />
          <BlockerBadge data={{ hasConflicts: mr.hasConflicts }} type="conflicts" />
        </Styles.Badges>

        <Styles.Details>
          <div>
            <dt>Autor</dt>
            <dd>{mr.author}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{assignee || "Sin responsable"}</dd>
          </div>
          <div>
            <dt>Proyecto</dt>
            <dd>{projectName}</dd>
          </div>
          <div>
            <dt>Merge request</dt>
            <dd>!{mr.iid}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{formatMergeRequestDateTime(mr.createdAt)}</dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>{formatMergeRequestDateTime(mr.updatedAt)}</dd>
          </div>
        </Styles.Details>

        {mr.mergeability === "ready_to_merge" ? (
          <Styles.Form onSubmit={handleSubmit}>
            <Styles.UploadDateLabel htmlFor={`upload-date-${mr.id}`}>
              Fecha de subida
            </Styles.UploadDateLabel>
            <Styles.UploadDateInput
              aria-describedby={statusId}
              disabled={savingUploadDate}
              id={`upload-date-${mr.id}`}
              onChange={(event) => setUploadDate(event.target.value)}
              type="date"
              value={uploadDate}
            />
            <Styles.UploadDateStatus
              $error={Boolean(uploadDateError)}
              id={statusId}
              role={uploadDateError ? "alert" : "status"}
            >
              {savingUploadDate ? "Guardando fecha..." : uploadDateError}
            </Styles.UploadDateStatus>

            <Styles.Actions>
              <AppStyles.SecondaryButton
                disabled={savingUploadDate}
                onClick={onClose}
                type="button"
              >
                Cancelar
              </AppStyles.SecondaryButton>
              <AppStyles.Button disabled={savingUploadDate} type="submit">
                {savingUploadDate ? "Guardando..." : "Guardar"}
              </AppStyles.Button>
            </Styles.Actions>
          </Styles.Form>
        ) : (
          <Styles.Actions>
            <AppStyles.Button onClick={onClose} type="button">Cerrar</AppStyles.Button>
          </Styles.Actions>
        )}
      </Styles.Dialog>
    </Styles.Backdrop>,
    document.body,
  );
}
