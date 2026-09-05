import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getWorkspaces } from '../../api';
import { WorkspaceSkeleton } from './WorkspaceSkeleton';

/**
 * Route handler for /dashboard and /workspaces.
 * Resolves the user's primary workspace ID and redirects to /workspaces/<id>
 * without rendering the full dashboard page.
 */
export const WorkspaceRedirect: React.FC = () => {
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function resolve() {
      try {
        const workspaces = await getWorkspaces();
        if (isMounted) {
          if (workspaces && workspaces.length > 0 && workspaces[0]?.id) {
            setTargetPath(`/workspaces/${workspaces[0].id}`);
          } else {
            setTargetPath('/workspaces/default');
          }
        }
      } catch {
        if (isMounted) {
          setTargetPath('/login');
        }
      }
    }
    resolve();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!targetPath) {
    return <WorkspaceSkeleton />;
  }

  return <Navigate to={targetPath} replace />;
};

export default WorkspaceRedirect;
