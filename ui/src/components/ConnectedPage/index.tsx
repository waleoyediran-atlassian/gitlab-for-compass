import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Spinner from '@atlaskit/spinner';

import { disconnectGroup } from '../../services/invokes';
import { ConnectInfoPanel } from './ConnectInfoPanel';
import { ImportControls } from './ImportControls';
import { CenterWrapper } from '../styles';
import { DefaultErrorState } from '../DefaultErrorState';
import { ApplicationState } from '../../routes';
import { useAppContext } from '../../hooks/useAppContext';
import { AuthErrorTypes, ErrorTypes, GitlabAPIGroup } from '../../resolverTypes';
import { useImportContext } from '../../hooks/useImportContext';
import { ImportResult } from '../ImportResult';
import { IncomingWebhookSectionMessage } from '../IncomingWebhookSectionMessage';
import { isRenderingInOnboardingFlow } from '../onboarding-flow-context-helper';

export const ConnectedPage = () => {
  const [isDisconnectGroupInProgress, setDisconnectGroupInProgress] = useState(false);
  const [errorType, setErrorType] = useState<ErrorTypes>();
  const [groups, setGroups] = useState<GitlabAPIGroup[]>();
  const [isInOnboarding, setIsInOnboarding] = useState<boolean>(false);

  const navigate = useNavigate();
  const { features, getConnectedInfo, clearGroup } = useAppContext();
  const { isImportInProgress } = useImportContext();

  const getIsInOnboarding = async () => {
    const isInOnboardingFlow = await isRenderingInOnboardingFlow();
    setIsInOnboarding(isInOnboardingFlow);
  };

  const handleDisconnectGroup = async (id: number) => {
    setDisconnectGroupInProgress(true);
    try {
      const { success, errors } = await disconnectGroup(id);
      clearGroup(id);

      if (success) {
        setDisconnectGroupInProgress(false);
        navigate(`..${ApplicationState.AUTH}`, { replace: true });
      }
      if (errors && errors.length > 0) {
        setDisconnectGroupInProgress(false);
        setErrorType(errors[0].errorType || AuthErrorTypes.UNEXPECTED_ERROR);
      }
    } catch (err) {
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    } finally {
      setDisconnectGroupInProgress(false);
    }
  };

  useEffect(() => {
    getConnectedInfo()
      .then(setGroups)
      .catch((e) => {
        console.error('Error while getting connected info', e);
      });

    getIsInOnboarding().catch((e) => console.error(`Error fetching onboarding flow context: ${e}`));
  }, []);

  if (errorType) {
    return <DefaultErrorState errorType={errorType} />;
  }

  if (!groups?.length) {
    return (
      <CenterWrapper>
        <Spinner size='large' />
      </CenterWrapper>
    );
  }

  return (
    <div data-testid='gitlab-connected-page'>
      <h4>Connected group</h4>
      <p>You can connect only one GitLab group to Compass at a time, and you must be an owner of that group.</p>
      <br />
      {!isInOnboarding && (
        <IncomingWebhookSectionMessage isMaintainerTokenEnabled={features.isGitlabMaintainerTokenEnabled} />
      )}
      <br />
      <ConnectInfoPanel
        connectedGroup={groups[0]}
        handleDisconnectGroup={handleDisconnectGroup}
        isDisconnectGroupInProgress={isDisconnectGroupInProgress}
      />

      <ImportControls />

      {!isImportInProgress ? <ImportResult /> : null}
    </div>
  );
};
