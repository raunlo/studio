/**
 * Templates API hooks using SWR pattern
 * Follows existing API pattern from Orval-generated clients
 */

import useSWR from 'swr';
import type { SWRConfiguration, Key } from 'swr';
import useSWRMutation from 'swr/mutation';
import type { SWRMutationConfiguration } from 'swr/mutation';
import { customInstance } from '@/lib/axios';

// Type definitions matching backend API
export interface TemplateRow {
  id: number;
  templateId: number;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: number;
  userId: string;
  name: string;
  description?: string | null;
  rows: TemplateRow[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRowRequest {
  name: string;
  position: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string | null;
  rows?: CreateTemplateRowRequest[];
}

export interface CreateTemplateFromItemRequest {
  name: string;
  description?: string | null;
  checklistId: number;
  checklistItemId: number;
}

// ============= GET All Templates =============

export const getAllTemplates = () => {
  return customInstance<Template[]>({
    url: '/api/v1/templates',
    method: 'GET',
  });
};

export const getGetAllTemplatesKey = () => ['/api/v1/templates'] as const;

export type GetAllTemplatesResult = Awaited<ReturnType<typeof getAllTemplates>>;
export type GetAllTemplatesError = Error;

export const useGetAllTemplates = <TError = GetAllTemplatesError>(options?: {
  swr?: SWRConfiguration<GetAllTemplatesResult, TError> & {
    swrKey?: Key;
    enabled?: boolean;
  };
}) => {
  const { swr: swrOptions } = options ?? {};
  const isEnabled = swrOptions?.enabled !== false;
  const swrKey = swrOptions?.swrKey ?? (() => (isEnabled ? getGetAllTemplatesKey() : null));
  const swrFn = () => getAllTemplates();

  const query = useSWR<GetAllTemplatesResult, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

// ============= GET Template by ID =============

export const getTemplateById = (templateId: number) => {
  return customInstance<Template>({
    url: `/api/v1/templates/${templateId}`,
    method: 'GET',
  });
};

export const useGetTemplateById = <TError = GetAllTemplatesError>(
  templateId: number,
  options?: {
    swr?: SWRConfiguration<Template, TError> & {
      swrKey?: Key;
      enabled?: boolean;
    };
  },
) => {
  const { swr: swrOptions } = options ?? {};
  const isEnabled = swrOptions?.enabled !== false && templateId > 0;
  const swrKey = swrOptions?.swrKey ?? (() => (isEnabled ? `/api/v1/templates/${templateId}` : null));
  const swrFn = () => getTemplateById(templateId);

  const query = useSWR<Template, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

// ============= CREATE Template =============

export const createTemplate = (request: CreateTemplateRequest) => {
  return customInstance<Template>({
    url: '/api/v1/templates',
    method: 'POST',
    data: request,
  });
};

export const useCreateTemplate = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<Template, TError, Key, CreateTemplateRequest>;
}) => {
  const fetcher = (
    _: Key,
    { arg }: { arg: CreateTemplateRequest },
  ) => createTemplate(arg);

  return useSWRMutation(getGetAllTemplatesKey(), fetcher, options?.swr);
};

// ============= UPDATE Template =============

export const updateTemplate = (templateId: number, request: CreateTemplateRequest) => {
  return customInstance<Template>({
    url: `/api/v1/templates/${templateId}`,
    method: 'PUT',
    data: request,
  });
};

interface UpdateTemplateArgs {
  id: number;
  data: CreateTemplateRequest;
}

export const useUpdateTemplate = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<Template, TError, Key, UpdateTemplateArgs>;
}) => {
  const fetcher = (_: Key, { arg }: { arg: UpdateTemplateArgs }) =>
    updateTemplate(arg.id, arg.data);

  return useSWRMutation(getGetAllTemplatesKey(), fetcher as any, options?.swr);
};

// ============= DELETE Template =============

export const deleteTemplate = (templateId: number) => {
  return customInstance<void>({
    url: `/api/v1/templates/${templateId}`,
    method: 'DELETE',
  });
};

export const useDeleteTemplate = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<void, TError, Key, number>;
}) => {
  const fetcher = (_: Key, { arg }: { arg: number }) => deleteTemplate(arg);

  return useSWRMutation(getGetAllTemplatesKey(), fetcher, options?.swr);
};

// ============= CREATE Template from Item =============

export const createTemplateFromItem = (request: CreateTemplateFromItemRequest) => {
  return customInstance<Template>({
    url: '/api/v1/templates/from-items',
    method: 'POST',
    data: request,
  });
};

export const useCreateTemplateFromItem = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<Template, TError, Key, CreateTemplateFromItemRequest>;
}) => {
  const fetcher = (
    _: Key,
    { arg }: { arg: CreateTemplateFromItemRequest },
  ) => createTemplateFromItem(arg);

  return useSWRMutation(getGetAllTemplatesKey(), fetcher, options?.swr);
};

// ============= Apply Template to Checklist =============

export const applyTemplate = (checklistId: number, templateId: number) => {
  return customInstance({
    url: `/api/v1/checklists/${checklistId}/apply-template/${templateId}`,
    method: 'POST',
  });
};

interface ApplyTemplateArgs {
  checklistId: number;
  templateId: number;
}

export const useApplyTemplate = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<any, TError, Key, ApplyTemplateArgs>;
}) => {
  const fetcher = (_: Key, { arg }: { arg: ApplyTemplateArgs }) =>
    applyTemplate(arg.checklistId, arg.templateId);

  return useSWRMutation(['/checklists'], fetcher as any, options?.swr);
};
