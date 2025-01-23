import { useEffect, useMemo, useState } from 'react';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';

import { buildTableBody } from './buildTableBody';
import { buildTableHead } from './buildTableHead';
import { buildEmptyView } from '../EmptyState/buildEmptyView';
import { CompassComponentTypeOption, ComponentTypesResult, ProjectImportSelection } from '../../services/types';
import { TableWrapper } from '../styles';
import { SelectOwnerTeamOption } from '../OwnerTeamSelect/types';
import { TeamsForImportResult } from '../../hooks/useTeamsForImport';
import { isRenderingInOnboardingFlow } from '../onboarding-flow-context-helper';

type Props = {
  projects: ProjectImportSelection[];
  isLoading: boolean;
  onSelectAllItems: (filteredProjects: ProjectImportSelection[], isAllItemsSelected: boolean) => void;
  onSelectItem: (id: number) => void;
  onChangeComponentType: (id: number, type: CompassComponentTypeOption) => void;
  error?: string;
  importableComponentTypes: ComponentTypesResult;
  teamsResult: TeamsForImportResult;
  selectProjectTeam: (id: number, ownerTeamOption: SelectOwnerTeamOption | null) => void;
  isSpotlightActive: boolean;
  finishOnboarding: () => void;
};

const SPINNER_SIZE = 'large';

export const ProjectsImportTable = ({
  projects,
  isLoading,
  onSelectAllItems,
  onSelectItem,
  onChangeComponentType,
  error,
  importableComponentTypes,
  teamsResult,
  selectProjectTeam,
  isSpotlightActive,
  finishOnboarding,
}: Props) => {
  const emptyView = useMemo(() => buildEmptyView({ isProjectsExist: projects.length !== 0, error }), [projects, error]);

  const isAllItemsSelected = useMemo(
    () => (isLoading ? false : projects.every(({ isSelected, isManaged }) => isSelected || isManaged)),
    [projects, isLoading],
  );

  const [isOnboardingFlow, setIsOnboardingFlow] = useState<boolean>(false);

  useEffect(() => {
    const processAsync = async () => {
      const isOnbarding = await isRenderingInOnboardingFlow();
      setIsOnboardingFlow(isOnbarding);
    };

    processAsync().catch((e) => {
      console.error(`Failed to get onboarding state: ${e}`);
    });
  }, []);

  return (
    <>
      <TableWrapper>
        <DynamicTableStateless
          testId='projects-import-table'
          head={buildTableHead({
            projects,
            onSelectAllItems,
            isAllItemsSelected,
            isLoading,
            isSpotlightActive,
            finishOnboarding,
            isOnboardingFlow,
          })}
          rows={buildTableBody({
            projects,
            onSelectItem,
            onChangeComponentType,
            importableComponentTypes,
            teamsResult,
            selectProjectTeam,
            isOnboardingFlow,
          })}
          loadingSpinnerSize={SPINNER_SIZE}
          isLoading={isLoading}
          emptyView={emptyView}
        />
      </TableWrapper>
    </>
  );
};
