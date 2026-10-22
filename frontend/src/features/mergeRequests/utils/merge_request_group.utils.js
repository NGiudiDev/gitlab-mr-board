/**
 * Agrupa los merge requests por proyecto, en orden alfabético.
 *
 * Los proyectos configurados en la cuenta aparecen aunque no tengan merge
 * requests abiertos, para que el tablero no los esconda.
 *
 * @param {Array<object>} mergeRequests Merge requests visibles.
 * @param {Array<string>} allProjects Rutas de todos los proyectos de la cuenta.
 * @returns {Array<{project: string, mergeRequests: Array<object>}>} Grupos ordenados.
 */
export function groupByProject(mergeRequests, allProjects = []) {
  const byProject = {};

  allProjects.forEach((project) => { byProject[project] = []; });

  mergeRequests.forEach((mergeRequest) => {
    if (!byProject[mergeRequest.projectPath]) byProject[mergeRequest.projectPath] = [];

    byProject[mergeRequest.projectPath].push(mergeRequest);
  });

  return Object.keys(byProject)
    .sort()
    .map((project) => ({ mergeRequests: byProject[project], project }));
}
