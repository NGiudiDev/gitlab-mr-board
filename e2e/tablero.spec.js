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
    // Lo completa el paso que visita «Mi cuenta» y lo usa el último paso.
    let inviteCode = '';
    const project = page.getByRole('region', { name: e2eConfig.projectPath, exact: true });
    const mergeRequestLink = page.getByRole('link', {
      name: exactCardName(e2eConfig.mergeRequestTitle),
    });

    await test.step('ingresa con el usuario de test, todavía sin configurar GitLab', async () => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Tablero de MRs', level: 1 })).toBeVisible();

      await page.getByLabel('Usuario').fill(e2eConfig.username);
      await page.getByLabel('Contraseña').fill(e2eConfig.password);
      await page.getByRole('button', { name: 'Ingresar' }).click();

      await expect(page.getByText(`@${e2eConfig.username}`)).toBeVisible();
      // La base se recrea en cada corrida, así que el usuario arranca sin
      // proyectos ni token: el tablero todavía no tiene qué consultar.
      await expect(page.getByText('Todavía no configuraste GitLab')).toBeVisible();
    });

    await test.step('carga los proyectos y el access token en «Mi cuenta»', async () => {
      await page.getByRole('button', { name: 'Configurar en Mi cuenta' }).click();
      await expect(page.getByRole('heading', { level: 2, name: 'GitLab de la cuenta' })).toBeVisible();

      await page.getByLabel('IDs de los proyectos').fill(e2eConfig.projectIds);
      await page.getByLabel('Access token').fill(e2eConfig.gitlabToken);
      await page.getByRole('button', { name: 'Guardar configuración' }).click();

      await expect(page.getByText('Configuración de GitLab guardada.')).toBeVisible();
      // El token se guarda cifrado y no vuelve al navegador: el campo se vacía.
      await expect(page.getByLabel('Access token')).toHaveValue('');

      // El nickname es de cada persona y no de la cuenta: de él depende la
      // vista personal.
      await page.getByLabel('Nickname de GitLab').fill(e2eConfig.gitlabUsername);
      await page.getByRole('button', { name: 'Guardar mi nickname' }).click();
      await expect(page.getByText('Nickname de GitLab guardado.')).toBeVisible();
    });

    await test.step('vuelve al tablero y espera los datos de GitLab', async () => {
      const boardResponse = waitForBoardResponse(page);
      await page.getByRole('button', { name: 'Tablero' }).click();
      await boardResponse;

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

      // La barra del layout va primero: tablero, cuenta, usuarios y el menú de sesión.
      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Tablero');

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Mi cuenta');

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Usuarios');

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Abrir menú de cuenta');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();

      await page.keyboard.press('Tab');
      expect(await focusedAccessibleName(page)).toContain('Cerrar sesión');

      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Abrir menú de cuenta' })).toBeFocused();

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

    await test.step('navega entre la cuenta, los usuarios y el tablero', async () => {
      await page.getByRole('button', { name: 'Mi cuenta' }).click();
      await expect(page.getByRole('heading', { level: 2, name: 'Mi contraseña' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Mi equipo' })).toBeVisible();

      // El código habilita el último paso: sumar a alguien más a esta cuenta.
      inviteCode = await page.getByLabel('Código de invitación').inputValue();
      expect(inviteCode).toMatch(/^[A-Z2-9]{10}$/);

      // El usuario del recorrido es administrador, así que ve la tabla de usuarios.
      await page.getByRole('button', { name: 'Usuarios' }).click();
      await expect(page.getByRole('heading', { level: 2, name: 'Usuarios' })).toBeVisible();
      await expect(page.getByRole('rowheader', { name: `@${e2eConfig.username}` })).toBeVisible();

      await page.getByRole('button', { name: 'Tablero' }).click();
      await expect(page.getByRole('button', { name: 'Refrescar ahora' })).toBeEnabled();
    });

    await test.step('cierra la sesión y vuelve al formulario de ingreso', async () => {
      await page.getByRole('button', { name: 'Abrir menú de cuenta' }).click();
      await page.getByRole('button', { name: 'Cerrar sesión' }).click();

      await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Refrescar ahora' })).toHaveCount(0);

      // La cookie quedó invalidada: recargar no devuelve el tablero.
      await page.reload();
      await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
    });

    await test.step('alguien invitado ve el mismo tablero sin cargar credenciales', async () => {
      await page.getByRole('button', { name: 'Crear una cuenta' }).click();
      await page.getByLabel('Código de invitación').fill(inviteCode);
      await page.getByLabel('Usuario').fill(e2eConfig.guestUsername);
      await page.getByLabel('Contraseña', { exact: true }).fill(e2eConfig.password);
      await page.getByLabel('Repetí la contraseña').fill(e2eConfig.password);

      const boardResponse = waitForBoardResponse(page);
      await page.getByRole('button', { name: 'Crear cuenta' }).click();
      await boardResponse;

      // Entra al tablero ya armado: los proyectos y el token son de la cuenta.
      await expect(page.getByText('Todavía no configuraste GitLab')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Refrescar ahora' })).toBeEnabled();
      await expect(project).toBeVisible();

      // No administra la cuenta, así que no puede tocar esa configuración ni
      // ver la pantalla de usuarios.
      await expect(page.getByRole('button', { name: 'Usuarios' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Mi cuenta' }).click();
      await expect(page.getByRole('heading', { level: 2, name: 'GitLab de la cuenta' })).toBeVisible();
      await expect(page.getByLabel('IDs de los proyectos')).toHaveCount(0);
    });
  });
});
