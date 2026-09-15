import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getWorkspaces } from '../../api';
import { WorkspaceSkeleton } from './WorkspaceSkeleton';

/**
 * Route handler for /dashboard and /workspaces.
 * Resolves the user's primary workspace ID and redirects to /workspaces/<id>
 * without rendering the full dashboard page.
 */
export const WorkspaceRedirect: React.FC = () => {
  const [target, setTarget] = useState<{ path: string; workspaces?: import('../../types').Workspace[] } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function resolve() {
      try {
        const workspaces = await getWorkspaces();
        if (isMounted) {
          if (workspaces && workspaces.length > 0 && workspaces[0]?.id) {
            setTarget({ path: `/workspaces/${workspaces[0].id}`, workspaces });
          } else {
            setTarget({ path: '/workspaces/default', workspaces: [] });
          }
        }
      } catch {
        if (isMounted) {
          setTarget({ path: '/login' });
        }
      }
    }
    resolve();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!target) {
    return <WorkspaceSkeleton />;
  }

  return <Navigate to={target.path} state={target.workspaces ? { workspaces: target.workspaces } : undefined} replace />;
};

export default WorkspaceRedirect;
