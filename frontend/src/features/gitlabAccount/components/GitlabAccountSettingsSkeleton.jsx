export function GitlabAccountSettingsSkeleton(props) {
  const { canEdit = false } = props;

  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando la configuración...</span>

      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        <div>
          <div className="mb-2 h-3 w-28 rounded bg-surface-raised" />
          <div className="h-10 w-full rounded-md border border-border-soft bg-surface-raised" />
          <div className="mt-2 h-3 w-4/5 rounded bg-surface-raised" />
        </div>

        <div>
          <div className="mb-2 h-3 w-20 rounded bg-surface-raised" />
          <div className="h-10 w-full rounded-md border border-border-soft bg-surface-raised" />
          <div className="mt-2 h-3 w-3/5 rounded bg-surface-raised" />
        </div>

        {canEdit ? (
          <div className="h-9 w-44 rounded-md bg-surface-raised" />
        ) : null}
      </div>
    </div>
  );
}