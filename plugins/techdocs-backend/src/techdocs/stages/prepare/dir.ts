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
import fs from 'fs-extra';
import os from 'os';
import { PreparerBase } from './types';
import { Entity } from '@backstage/catalog-model';
import path from 'path';
import { parseReferenceAnnotation } from './helpers';
import { InputError } from '@backstage/backend-common';
import { Clone } from 'nodegit';
import GitUriParser from 'git-url-parse';

export class DirectoryPreparer implements PreparerBase {
  private async cloneGithubRepo(entity: Entity) {
    const { protocol, location } = parseReferenceAnnotation(
      'backstage.io/managed-by-location',
      entity,
    );

    if (protocol !== 'github') {
      throw new InputError(
        `Wrong location protocol: ${protocol}, should be 'github'`,
      );
    }

    const parsedGitLocation = GitUriParser(location);
    const repositoryTmpPath = path.join(
      os.tmpdir(),
      'backstage-repo',
      parsedGitLocation.source,
      parsedGitLocation.owner,
      parsedGitLocation.name,
      parsedGitLocation.ref,
    );
    if (fs.existsSync(repositoryTmpPath)) {
      return repositoryTmpPath;
    }
    const repositoryCheckoutUrl = parsedGitLocation.toString('https');
    fs.mkdirSync(repositoryTmpPath, { recursive: true });

    await Clone.clone(repositoryCheckoutUrl, repositoryTmpPath, {});

    return repositoryTmpPath;
  }

  private async resolveManagedByLocationToDir(entity: Entity) {
    const { protocol, location } = parseReferenceAnnotation(
      'backstage.io/managed-by-location',
      entity,
    );

    switch (protocol) {
      case 'github': {
        const parsedGitLocation = GitUriParser(location);
        const repoLocation = await this.cloneGithubRepo(entity);

        return path.dirname(
          path.join(repoLocation, parsedGitLocation.filepath),
        );
      }
      case 'file':
        return path.dirname(location);
      default:
        throw new InputError(`Unable to resolve location type ${protocol}`);
    }
  }

  async prepare(entity: Entity): Promise<string> {
    const { location: techdocsLocation } = parseReferenceAnnotation(
      'backstage.io/techdocs-ref',
      entity,
    );

    const managedByLocationDirectory = await this.resolveManagedByLocationToDir(
      entity,
    );

    return new Promise(resolve => {
      resolve(path.resolve(managedByLocationDirectory, techdocsLocation));
    });
  }
}
