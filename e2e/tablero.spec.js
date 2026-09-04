import { expect, test } from '@playwright/test';

import e2eConfig from './config.js';

const PULL_REQUESTS_ENDPOINT = '/api/pull-requests';

/** Espera la respuesta real del backend, opcionalmente la que omite la caché. */
function waitForBoardResponse(page, { forced = false } = {}) {
  return page.waitForResponse((response) => {
    const url = response.url();
    if (!url.includes(PULL_REQUESTS_ENDPOINT) || !response.ok()) return false;

    return forced ? url.includes('force=true') : true;
  });
}

/**
 * Nombre accesible exacto de la tarjeta. `getByRole` matchea por substring, así
 * que sin anclar el patrón un título más largo también coincidiría. El enlace
 * suma el aviso de pestaña nueva que lee un lector de pantalla, y el espacio
 * previo depende de cómo el navegador arma el nombre.
 */
function exactCardName(title) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`^${escapedTitle}\\s*\\(abre en una pestaña nueva\\)$`);
}

/** Nombre accesible del elemento con el foco, para las comprobaciones de teclado. */
function focusedAccessibleName(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element) return '';

    return (element.getAttribute('aria-label') || element.textContent || '').trim();
  });
}

test.describe('Tablero de merge requests', () => {
  test('recorre el tablero contra GitLab real', async ({ page }) => {
    const project = page.getByRole('region', { name: e2eConfig.projectPath, exact: true });
    const mergeRequestLink = page.getByRole('link', {
      name: exactCardName(e2eConfig.mergeRequestTitle),
    });

    await test.step('abre el tablero y espera los datos de GitLab', async () => {
      const boardResponse = waitForBoardResponse(page);
      await page.goto('/');
      await boardResponse;

      await expect(page.getByRole('heading', { name: 'Tablero de MRs', level: 1 })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Refrescar ahora' })).toBeEnabled();
    });

    await test.step('expande el proyecto del merge request conocido', async () => {
      // El panel contraído se oculta con `display: none`, así que sus tarjetas
      // quedan fuera del árbol de accesibilidad: el proyecto se ubica por su
      // ruta, no por el merge request que contiene.
      const toggle = project.getByRole('button', { expanded: false });

      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(project.getByRole('button', { expanded: true })).toBeVisible();
      await expect(mergeRequestLink).toBeVisible();
    });

    await test.step('verifica la columna y los bloqueadores del merge request', async () => {
      const column = project.getByRole('region', {
        name: e2eConfig.mergeRequestColumn,
        exact: true,
      });
      const card = column.getByRole('listitem').filter({ has: mergeRequestLink });

      await expect(card).toBeVisible();
      await expect(card.getByLabel(/^Pipeline:/)).toBeVisible();
      await expect(card.getByLabel(/hilos sin resolver/)).toBeVisible();
      await expect(card.getByLabel(/aprobaciones|approvals/i)).toBeVisible();
      await expect(card.getByLabel(/conflictos de merge/)).toBeVisible();
    });

    await test.step('fuerza una actualización omitiendo la caché', async () => {
      const forcedResponse = waitForBoardResponse(page, { forced: true });
      await page.getByRole('button', { name: 'Refrescar ahora' }).click();
      await forcedResponse;

      await expect(page.getByRole('button', { name: 'Refrescar ahora' })).toBeEnabled();
      await expect(mergeRequestLink).toBeVisible();
    });

    await test.step('recorre los controles principales con teclado', async () => {
      // Chromium sigue tabulando desde el último elemento enfocado, así que se
      // recarga para que el recorrido empiece en el inicio del documento.
      await page.reload();
      await expect(page.getByRole('button', { name: 'Refrescar ahora' })).toBeEnabled();

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Saltar al contenido principal');

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Refrescar ahora');

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('General');

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Personal');
      await page.keyboard.press('Enter');

      const personalButton = page.getByRole('button', { name: 'Personal' });
      await expect(personalButton).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('Elegí una persona para ver sus tareas pendientes.')).toBeVisible();

      const personSelect = page.getByLabel('Persona');
      await page.keyboard.press('Tab');
      await expect(personSelect).toBeFocused();

      const firstPerson = await personSelect.locator('option').nth(1).getAttribute('value');
      await personSelect.selectOption(firstPerson);
      await expect(page.getByRole('heading', { level: 2, name: /^Tareas de / })).toBeVisible();

      await page.getByRole('button', { name: 'General' }).click();
      await expect(personalButton).toHaveAttribute('aria-pressed', 'false');
      await expect(project).toBeVisible();
    });
  });
});
