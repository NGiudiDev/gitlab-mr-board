# ADR 0007: Gestión de usuarios

- Estado: Aceptada
- Fecha: 2026-09-06

## Contexto

El [ADR 0006](0006-autenticacion-local-con-sesiones.md) incorporó el login de usuarios existentes, pero mantuvo su creación como una tarea operativa mediante `npm run users`. Ese mecanismo exige acceso al servidor y no alcanza para que un equipo gestione sus integrantes desde la aplicación.

Además, cada usuario pertenece a una cuenta y sólo puede acceder a los datos compartidos por ella. La incorporación y administración de personas debe respetar ese límite sin introducir un administrador global ni confiar en restricciones de la interfaz.

## Decisión

Ofrecer dos caminos de alta con propósitos diferentes:

- **Registro público** mediante `POST /api/auth/register`. Sin un código de invitación crea una cuenta nueva y asigna el rol `admin` a quien se registra. Con un código válido incorpora a la persona como `user` de la cuenta que lo emitió. En ambos casos inicia su sesión.
- **Alta administrada** mediante `/api/users`. Un `admin` puede crear usuarios con el rol elegido, pero únicamente dentro de la cuenta obtenida de su propia sesión.

La gestión de usuarios también permite a un `admin` listar, habilitar y deshabilitar integrantes de su cuenta. No puede operar sobre otra cuenta ni deshabilitarse a sí mismo. Al deshabilitar un usuario se invalidan todas sus sesiones para que la restricción tenga efecto inmediato.

Los permisos y el aislamiento por cuenta se validan en el backend, ruta por ruta. Los intentos de operar sobre un usuario de otra cuenta responden como recurso inexistente y nunca revelan su pertenencia.

Cada persona administra su propia contraseña. El cambio autenticado y la recuperación por correo no permiten que un administrador conozca ni establezca la contraseña de otra persona. La línea de comandos permanece como herramienta operativa de recuperación.

El modelo completo y sus reglas vigentes se documentan en [Autenticación](../domains/autenticacion.md) y [Cuentas](../domains/cuentas.md).

## Alternativas consideradas

- **Mantener las altas sólo por línea de comandos**: reduce la superficie de la aplicación, pero convierte cada incorporación en una tarea de infraestructura.
- **Permitir únicamente altas administradas**: conserva el control del equipo, pero impide que una instalación nueva cree su primera cuenta sin intervención operativa.
- **Exigir aprobación para todo registro**: permite solicitar acceso sin un código, a costa de sumar un estado y un flujo de revisión que no se necesitan en el modelo actual.
- **Usar un administrador global**: simplifica la operación entre cuentas, pero rompe su aislamiento y amplía innecesariamente el alcance de una credencial privilegiada.

## Consecuencias

- Una persona puede crear su propia cuenta sin acceso al servidor. Ese registro sólo obtiene un tablero vacío hasta que configure GitLab; no permite entrar al tablero de otro equipo.
- Para unirse a una cuenta existente hace falta su código de invitación. El código funciona como un secreto compartido y debe renovarse si se filtra.
- Los administradores resuelven el ciclo de vida de su equipo desde la interfaz sin acceder a usuarios de otras cuentas.
- El registro público escribe en la base y puede generar cuentas no deseadas. Por eso tiene un límite de cinco altas por hora y por origen, mantenido en memoria del proceso.
- Los roles, estados e invalidación de sesiones agregan reglas que deben cubrirse en los test del backend; ocultar controles en el frontend no reemplaza esas validaciones.
