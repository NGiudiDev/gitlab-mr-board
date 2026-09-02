import { defineConfig } from 'vitepress'

// El sidebar se declara a mano: con cinco secciones es más explícito que
// autogenerarlo, y obliga a decidir el título con el que aparece cada página.
const sidebar = [
  {
    text: 'Arquitectura',
    link: '/architecture/',
    items: [
      { text: 'Visión general', link: '/architecture/vision-general' },
      { text: 'Backend', link: '/architecture/backend' },
      { text: 'Frontend', link: '/architecture/frontend' },
      { text: 'Interfaz visual', link: '/architecture/interfaz-visual' },
    ],
  },
  {
    text: 'Decisiones',
    link: '/decisions/',
    items: [
      { text: 'ADR 0001: Backend for Frontend', link: '/decisions/0001-backend-for-frontend' },
      { text: 'ADR 0002: caché en memoria', link: '/decisions/0002-cache-en-memoria' },
      { text: 'ADR 0003: estrategia de pruebas', link: '/decisions/0003-estrategia-de-pruebas' },
      { text: 'ADR 0004: sitio de documentación', link: '/decisions/0004-sitio-de-documentacion' },
    ],
  },
  {
    text: 'Desarrollo',
    link: '/development/',
    items: [
      { text: 'Entorno local', link: '/development/entorno-local' },
      { text: 'Pruebas', link: '/development/pruebas' },
    ],
  },
  {
    text: 'Despliegue',
    link: '/deployment/',
    items: [
      { text: 'Producción', link: '/deployment/produccion' },
    ],
  },
  {
    text: 'Dominios',
    link: '/domains/',
    items: [
      { text: 'Merge Requests', link: '/domains/merge-requests' },
      { text: 'Columnas configurables', link: '/domains/columnas-configurables' },
    ],
  },
]

export default defineConfig({
  lang: 'es',
  title: 'GitLab MR Board',
  description: 'Documentación del tablero de merge requests',
  // VitePress espera `index.md` como índice de carpeta. Los archivos siguen
  // llamándose `README.md` para que GitHub los renderice al navegar el repo.
  rewrites: {
    'README.md': 'index.md',
    ':section/README.md': ':section/index.md',
  },
  // El sitio se sirve local. `DOCS_BASE` ajusta la ruta si algún día se
  // publica bajo un subdirectorio.
  base: process.env.DOCS_BASE ?? '/',
  cleanUrls: true,
  // 5173 y 4173 los usa el frontend; el sitio de docs no debe competir por ellos.
  vite: { server: { port: 5175, strictPort: false } },
  // Un enlace roto entre documentos rompe el build en lugar de publicarse.
  ignoreDeadLinks: false,
  themeConfig: {
    outline: { level: [2, 3], label: 'En esta página' },
    nav: [
      { text: 'Arquitectura', link: '/architecture/' },
      { text: 'Decisiones', link: '/decisions/' },
      { text: 'Desarrollo', link: '/development/' },
      { text: 'Dominios', link: '/domains/' },
    ],
    sidebar,
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar en la documentación' },
          modal: {
            displayDetails: 'Mostrar detalles',
            resetButtonTitle: 'Limpiar búsqueda',
            backButtonTitle: 'Volver',
            noResultsText: 'Sin resultados para',
            footer: {
              selectText: 'para seleccionar',
              navigateText: 'para navegar',
              closeText: 'para cerrar',
            },
          },
        },
      },
    },
    docFooter: { prev: 'Anterior', next: 'Siguiente' },
    darkModeSwitchLabel: 'Tema',
    lightModeSwitchTitle: 'Cambiar a tema claro',
    darkModeSwitchTitle: 'Cambiar a tema oscuro',
    sidebarMenuLabel: 'Secciones',
    returnToTopLabel: 'Volver arriba',
    lastUpdated: {
      text: 'Última actualización',
      formatOptions: { dateStyle: 'medium' },
    },
  },
})
