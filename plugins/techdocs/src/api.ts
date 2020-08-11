/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createApiRef } from '@backstage/core';
import URLFormatter from './reader/urlFormatter';

export const techdocsStorageApiRef = createApiRef<TechDocsStorageApi>({
  id: 'plugin.techdocs.storageservice',
  description: 'Used to make requests towards the techdocs storage',
});

export class TechDocsStorageApi {
  public apiOrigin: string;

  constructor({ apiOrigin }: { apiOrigin: string }) {
    this.apiOrigin = apiOrigin;
  }

  async getEntityDocs({
    kind,
    namespace,
    name,
    path,
  }: {
    kind: string;
    namespace: string;
    name: string;
    path: string;
  }) {
    const url = new URLFormatter(
      `${this.apiOrigin}/${kind}/${namespace}/${name}/${path}`,
    ).formatBaseURL();

    return fetch(`${url}index.html`);
  }

  getBaseUrl({
    url,
    entityId,
    path = '',
  }: {
    url: string;
    entityId: {
      kind: string;
      namespace: string;
      name: string;
    };
    path: string;
  }): string {
    const urlFormatter = new URLFormatter(
      path.length < 1 || path.endsWith('/')
        ? `${this.apiOrigin}/${entityId.kind}/${entityId.namespace}/${entityId.name}/${path}`
        : `${this.apiOrigin}/${entityId.kind}/${entityId.namespace}/${entityId.name}/${path}/`,
    );

    return urlFormatter.formatURL(url);
  }
}
