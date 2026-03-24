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
export interface TemplateItem {
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
  items: TemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string | null;
}

export interface CreateTemplateFromItemsRequest {
  name: string;
  description?: string | null;
  checklistId: number;
  checklistItemIds: number[];
}

export interface CreateChecklistFromTemplateRequest {
  name: string;
}

export interface TemplatePreviewResponse {
  existingItems: TemplateItem[];
  newItems: TemplateItem[];
}

export interface ApplyTemplateRequest {
  itemIds: number[];
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

// ============= CREATE Template from Items =============

export const createTemplateFromItems = (request: CreateTemplateFromItemsRequest) => {
  return customInstance<Template>({
    url: '/api/v1/templates/from-items',
    method: 'POST',
    data: request,
  });
};

export const useCreateTemplateFromItems = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<Template, TError, Key, CreateTemplateFromItemsRequest>;
}) => {
  const fetcher = (
    _: Key,
    { arg }: { arg: CreateTemplateFromItemsRequest },
  ) => createTemplateFromItems(arg);

  return useSWRMutation(getGetAllTemplatesKey(), fetcher, options?.swr);
};

// ============= CREATE Checklist from Template =============

export const createChecklistFromTemplate = (templateId: number, request: CreateChecklistFromTemplateRequest) => {
  return customInstance({
    url: `/api/v1/templates/${templateId}/create-checklist`,
    method: 'POST',
    data: request,
  });
};

interface CreateChecklistFromTemplateArgs {
  templateId: number;
  data: CreateChecklistFromTemplateRequest;
}

export const useCreateChecklistFromTemplate = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<any, TError, Key, CreateChecklistFromTemplateArgs>;
}) => {
  const fetcher = (_: Key, { arg }: { arg: CreateChecklistFromTemplateArgs }) =>
    createChecklistFromTemplate(arg.templateId, arg.data);

  return useSWRMutation(['/checklists'], fetcher as any, options?.swr);
};

// ============= Apply Template to Checklist =============

export const applyTemplate = (checklistId: number, templateId: number, request: ApplyTemplateRequest) => {
  return customInstance({
    url: `/api/v1/checklists/${checklistId}/apply-template/${templateId}`,
    method: 'POST',
    data: request,
  });
};

interface ApplyTemplateArgs {
  checklistId: number;
  templateId: number;
  data: ApplyTemplateRequest;
}

export const useApplyTemplate = <TError = Error>(options?: {
  swr?: SWRMutationConfiguration<any, TError, Key, ApplyTemplateArgs>;
}) => {
  const fetcher = (_: Key, { arg }: { arg: ApplyTemplateArgs }) =>
    applyTemplate(arg.checklistId, arg.templateId, arg.data);

  return useSWRMutation(['/checklists'], fetcher as any, options?.swr);
};

// ============= Get Template Preview =============

export const getTemplatePreview = (checklistId: number, templateId: number) => {
  return customInstance<TemplatePreviewResponse>({
    url: `/api/v1/checklists/${checklistId}/template-preview/${templateId}`,
    method: 'GET',
  });
};

export const useGetTemplatePreview = <TError = GetAllTemplatesError>(
  checklistId: number,
  templateId: number,
  options?: {
    swr?: SWRConfiguration<TemplatePreviewResponse, TError> & {
      swrKey?: Key;
      enabled?: boolean;
    };
  },
) => {
  const { swr: swrOptions } = options ?? {};
  const isEnabled = swrOptions?.enabled !== false && checklistId > 0 && templateId > 0;
  const swrKey = swrOptions?.swrKey ?? (() =>
    isEnabled ? `/api/v1/checklists/${checklistId}/template-preview/${templateId}` : null
  );
  const swrFn = () => getTemplatePreview(checklistId, templateId);

  const query = useSWR<TemplatePreviewResponse, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
