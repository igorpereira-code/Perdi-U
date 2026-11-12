import { useCallback, useState } from 'react';
import { SearchX, Users } from 'lucide-react';
import type { ManagedUser } from '@shared/admin';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { AdminUsersService } from '../data/adminUsersService';
import { filterUsersByEmail } from '../logic/filterUsersByEmail';
import { formatRoleLabel } from '../logic/formatRoleLabel';
import { getRoleAction, type RoleAction } from '../logic/getRoleAction';

type UsersSectionProps = {
  adminUsersService: AdminUsersService;
};

/** Which user's role is being changed right now, and which change could not be saved. */
type RoleChangeState = {
  changingUserId: string | null;
  failedUserId: string | null;
};

type ChangeRole = (user: ManagedUser, roleAction: RoleAction) => void;

function replaceUser(users: ManagedUser[] | undefined, updatedUser: ManagedUser) {
  return users?.map((user) => (user.id === updatedUser.id ? updatedUser : user));
}

type ManagedUserCardProps = {
  user: ManagedUser;
  roleChange: RoleChangeState;
  onChangeRole: ChangeRole;
};

function ManagedUserCard({ user, roleChange, onChangeRole }: ManagedUserCardProps) {
  const roleAction = getRoleAction(user.role);
  return (
    <li className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{user.name}</p>
          <p className="truncate text-xs text-neutral-500">{user.email}</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {formatRoleLabel(user.role)}
        </span>
      </div>
      {roleAction && (
        <Button
          variant="outline"
          onClick={() => onChangeRole(user, roleAction)}
          disabled={roleChange.changingUserId !== null}
          isLoading={roleChange.changingUserId === user.id}
          loadingText={roleAction.loadingText}
          className="w-full"
        >
          {roleAction.label}
        </Button>
      )}
      {roleChange.failedUserId === user.id && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          No se pudo cambiar el rol. Intenta nuevamente.
        </p>
      )}
    </li>
  );
}

type UsersListProps = {
  users: ManagedUser[];
  roleChange: RoleChangeState;
  onChangeRole: ChangeRole;
};

/** The users, with a search box to find one by email. */
function UsersList({ users, roleChange, onChangeRole }: UsersListProps) {
  const [searchedEmail, setSearchedEmail] = useState('');
  const foundUsers = filterUsersByEmail(users, searchedEmail);
  return (
    <div className="space-y-4">
      <Field id="searched-email" label="Buscar por correo">
        <input
          id="searched-email"
          type="search"
          value={searchedEmail}
          onChange={(event) => setSearchedEmail(event.target.value)}
          placeholder="nombre.apellido@ucb.edu.bo"
          className={INPUT_CLASSES}
        />
      </Field>
      {foundUsers.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos usuarios con ese correo"
          text="Revisa que el correo esté bien escrito."
        />
      ) : (
        <ul aria-label="Usuarios" className="space-y-3">
          {foundUsers.map((user) => (
            <ManagedUserCard
              key={user.id}
              user={user}
              roleChange={roleChange}
              onChangeRole={onChangeRole}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** The users of the app and their roles. */
export function UsersSection({ adminUsersService }: UsersSectionProps) {
  const loadUsers = useCallback(() => adminUsersService.listUsers(), [adminUsersService]);
  const { data: users, setData: setUsers, hasFailed, retry } = useLoadedData(loadUsers);
  const [roleChange, setRoleChange] = useState<RoleChangeState>({
    changingUserId: null,
    failedUserId: null,
  });

  async function changeRole(user: ManagedUser, roleAction: RoleAction) {
    setRoleChange({ changingUserId: user.id, failedUserId: null });
    try {
      const updatedUser = await adminUsersService.changeRole(user.id, roleAction.newRole);
      setUsers((current) => replaceUser(current, updatedUser));
      setRoleChange({ changingUserId: null, failedUserId: null });
    } catch {
      setRoleChange({ changingUserId: null, failedUserId: user.id });
    }
  }

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudieron cargar los usuarios. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (users === undefined) {
    return <SkeletonList rows={4} label="Cargando usuarios…" />;
  }
  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Todavía no hay usuarios"
        text="Aparecerán cuando ingresen a Perdi-U."
      />
    );
  }
  return <UsersList users={users} roleChange={roleChange} onChangeRole={changeRole} />;
}
