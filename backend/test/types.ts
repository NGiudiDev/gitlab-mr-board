// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService } from '../src/features/auth/types.js';
import type { GitLabSettingsService } from '../src/features/gitlabSettings/types.js';
import type { GitLabApprovalsResponse, GitLabDiscussion, GitLabMergeRequest, GitLabPipeline } from '../src/features/mergeRequests/types.js';
import type { Express } from 'express';
import type { IncomingHttpHeaders } from 'node:http';

// Contratos que sólo usa la infraestructura de test. Viven acá para que no se
// mezclen con los del código que se despliega.

export interface HttpTestOptions {
  method?: string;
  /** Cuerpo que se serializa como JSON. */
  body?: unknown;
  headers?: Record<string, string>;
}

export interface HttpTestResponse {
  status: number;
  body: string;
  headers: IncomingHttpHeaders;
  json: <T>() => T;
}

export type FixtureOr<T> = T | number;
export type ApprovalsFixture = GitLabApprovalsResponse;
export type PipelineFixture = GitLabPipeline;
export type DiscussionFixture = GitLabDiscussion;

export interface GitLabFixture {
  /** Ruta del proyecto por ID, o código HTTP de error. */
  projects?: Record<string, FixtureOr<string>>;
  /** Páginas de MRs abiertos por ID de proyecto. */
  mergeRequestPages?: Record<string, FixtureOr<GitLabMergeRequest[][]>>;
  /** Claves con el formato `projectId-iid`. */
  approvals?: Record<string, FixtureOr<ApprovalsFixture>>;
  /** Páginas de discusiones por MR. */
  discussions?: Record<string, FixtureOr<DiscussionFixture[][]>>;
  pipelines?: Record<string, FixtureOr<PipelineFixture[]>>;
}

export interface GitLabStub {
  fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  /** URLs solicitadas, en orden, para verificar paginación y concurrencia. */
  requestedUrls: string[];
  /** Cabeceras enviadas en cada llamada, para verificar el token. */
  sentHeaders: Array<Record<string, string>>;
}

/** App levantada con una sesión ya iniciada, para los test de rutas protegidas. */
export interface AuthenticatedTestApp {
  app: Express;
  authService: AuthService;
  gitlabSettingsService: GitLabSettingsService;
  /** Usuario de la sesión abierta. */
  user: AuthenticatedUser;
  /** Cabecera Cookie lista para reenviar en cada petición. */
  cookie: string;
}

export interface GitLabTestItem {
  id: number;
}
