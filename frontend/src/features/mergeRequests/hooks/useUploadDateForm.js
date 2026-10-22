import { useState } from "react";

/**
 * Administra la edición de la fecha de subida de un merge request.
 *
 * El backend es el dueño del dato y vuelve a validar la operación: acá sólo se
 * conserva lo que la persona escribió y el resultado del guardado. Mientras
 * guarda, el diálogo que lo contiene no debe poder cerrarse.
 *
 * @param {object} mr Merge request en edición.
 * @param {(projectId: number, iid: number, uploadDate: string) => Promise<void>} save Guardado remoto.
 * @param {() => void} onSaved Qué hacer cuando el guardado se aplicó.
 * @returns {object} Valor del campo, estado del guardado y sus disparadores.
 */
export function useUploadDateForm(mr, save, onSaved) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadDate, setUploadDate] = useState(mr.uploadDate ?? "");

  async function submit(event) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      await save(mr.projectId, mr.iid, uploadDate);
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo guardar la fecha.");
      setSaving(false);
    }
  }

  return { error, saving, setUploadDate, submit, uploadDate };
}
