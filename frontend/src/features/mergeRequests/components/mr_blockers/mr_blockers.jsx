import { BlockerBadge } from "../blocker_badge/blocker_badge.jsx";

/** Los cuatro bloqueantes de un merge request, en el mismo orden en todas las vistas. */
export function MrBlockers(props) {
  const { mr } = props;

  return (
    <>
      <BlockerBadge data={mr.blockers.pipeline} type="pipeline" />
      <BlockerBadge data={mr.blockers.threads} type="threads" />
      <BlockerBadge data={mr.blockers.approvals} type="approvals" />
      <BlockerBadge data={{ hasConflicts: mr.hasConflicts }} type="conflicts" />
    </>
  );
}
