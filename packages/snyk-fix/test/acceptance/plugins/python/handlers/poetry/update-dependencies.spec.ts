import * as pathLib from 'path';
import * as pipenvPipfileFix from '@snyk/fix-poetry';

import * as snykFix from '../../../../../../src';
import {
  generateEntityToFixWithFileReadWrite,
  generateTestResult,
} from '../../../../../helpers/generate-entity-to-fix';

jest.mock('@snyk/fix-poetry');

describe('fix Poetry Python projects', () => {
  beforeAll(() => {
    jest.spyOn(pipenvPipfileFix, 'isPoetrySupportedVersion').mockReturnValue({
      supported: true,
      versions: ['1.1.1'],
    });
    jest.spyOn(pipenvPipfileFix, 'isPoetryInstalled').mockResolvedValue({
      version: '1.1.1',
    });
  });

  const workspacesPath = pathLib.resolve(__dirname, 'workspaces');

  it.skip('shows expected changes with lockfile in --dry-run mode', async () => {
    // jest.spyOn(pipenvPipfileFix, 'poetryAdd').mockResolvedValue({
    //   exitCode: 0,
    //   stdout: '',
    //   stderr: '',
    //   command: 'pipenv install',
    //   duration: 123,
    // });
    // Arrange
    const targetFile = 'simple/pyproject.toml';

    const testResult = {
      ...generateTestResult(),
      remediation: {
        unresolved: [],
        upgrade: {},
        patch: {},
        ignore: {},
        pin: {
          'django@1.6.1': {
            upgradeTo: 'django@2.0.1',
            vulns: [],
            isTransitive: false,
          },
          'transitive@1.0.0': {
            upgradeTo: 'transitive@1.1.1',
            vulns: [],
            isTransitive: true,
          },
        },
      },
    };

    const entityToFix = generateEntityToFixWithFileReadWrite(
      workspacesPath,
      targetFile,
      testResult,
    );

    // Act
    const result = await snykFix.fix([entityToFix], {
      quiet: true,
      stripAnsi: true,
      dryRun: true,
    });
    // Assert
    expect(result).toMatchObject({
      exceptions: {},
      results: {
        python: {
          failed: [],
          skipped: [],
          succeeded: [
            {
              original: entityToFix,
              changes: [
                {
                  success: true,
                  userMessage: 'Upgraded django from 1.6.1 to 2.0.1',
                },
                {
                  success: true,
                  userMessage: 'Pinned transitive from 1.0.0 to 1.1.1',
                },
              ],
            },
          ],
        },
      },
    });
  });
});
